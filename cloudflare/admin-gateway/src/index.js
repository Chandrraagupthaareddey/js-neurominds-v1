/**
 * JS Neurominds — Admin Gateway (Cloudflare Worker, free tier)
 *
 * Runs as https://admin.neurominds.in and gives the git-based CMS (Sveltia)
 * "Sign in with Google" + email-based roles, with NO GitHub accounts or
 * tokens for editors. The single GitHub token lives only in this Worker.
 *
 *   Browser (Sveltia CMS) ──▶ /auth, /callback   Google OAuth → signed session token
 *                        ──▶ /gh/api/v3/*        GitHub REST  (token swapped server-side)
 *                        ──▶ /gh/api/graphql     GitHub GraphQL
 *                        ──▶ /*                  the static admin UI (proxied from the Pages build)
 *
 * Roles (env):
 *   SUPER_ADMIN_EMAILS  comma-separated → everything
 *   ADMIN_EMAILS        comma-separated → everything except SUPER_ADMIN_ONLY_PATHS
 *   SUPER_ADMIN_ONLY_PATHS (optional, comma-separated path prefixes; default below)
 *
 * Secrets (wrangler secret put …): GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET,
 *   GITHUB_TOKEN (fine-grained PAT: Contents RW + Pull requests RW on the repo),
 *   SESSION_SECRET (any long random string).
 * Vars: ADMIN_UI_ORIGIN (default https://neurominds.in/admin), ALLOWED_ORIGINS,
 *   GITHUB_REPO (owner/repo), SESSION_HOURS (default 12).
 */

const DEFAULT_SUPER_ONLY = [
  'content/settings/feature_flags.json',
  'content/settings/seo.json',
  'content/navigation.json',
  'admin/',
  'public-site/',
  'scripts/',
  'shared/'
];

const GITHUB_API = 'https://api.github.com';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;
    try {
      if (request.method === 'OPTIONS') return cors(request, env, new Response(null, { status: 204 }));
      if (path === '/auth' || path === '/auth/') return startGoogleLogin(request, env, url);
      if (path === '/callback') return googleCallback(request, env, url);
      if (path === '/logout') return logout(url);
      if (path === '/api/me') return cors(request, env, await whoAmI(request, env));
      if (path.startsWith('/gh/')) return cors(request, env, await proxyGitHub(request, env, url));
      if (path === '/healthz') return json({ ok: true, service: 'jsnm-admin-gateway' });
      return serveAdminUi(request, env, url);
    } catch (e) {
      return json({ error: 'gateway_error', message: String(e && e.message || e) }, 500);
    }
  }
};

/* ---------------------------------------------------------------- helpers */
const json = (obj, status = 200, headers = {}) =>
  new Response(JSON.stringify(obj), { status, headers: { 'content-type': 'application/json; charset=utf-8', ...headers } });

const html = (body, status = 200, headers = {}) =>
  new Response(body, { status, headers: { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store', ...headers } });

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function listEnv(v) { return String(v || '').split(',').map((s) => s.trim().toLowerCase()).filter(Boolean); }

function roleFor(email, env) {
  const e = String(email || '').toLowerCase();
  if (!e) return null;
  if (listEnv(env.SUPER_ADMIN_EMAILS).includes(e)) return 'super_admin';
  if (listEnv(env.ADMIN_EMAILS).includes(e)) return 'admin';
  return null;
}

function superOnlyPaths(env) {
  const custom = listEnv(env.SUPER_ADMIN_ONLY_PATHS);
  return custom.length ? custom : DEFAULT_SUPER_ONLY;
}

function allowedOrigins(env, url) {
  const list = listEnv(env.ALLOWED_ORIGINS);
  list.push(url.origin.toLowerCase());
  const ui = (env.ADMIN_UI_ORIGIN || 'https://neurominds.in/admin');
  try { list.push(new URL(ui).origin.toLowerCase()); } catch (e) { /* ignore */ }
  return [...new Set(list)];
}

function cors(request, env, res) {
  const origin = request.headers.get('origin');
  const url = new URL(request.url);
  if (origin && allowedOrigins(env, url).includes(origin.toLowerCase())) {
    const h = new Headers(res.headers);
    h.set('access-control-allow-origin', origin);
    h.set('access-control-allow-credentials', 'true');
    h.set('access-control-allow-methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    h.set('access-control-allow-headers', request.headers.get('access-control-request-headers') || 'authorization,content-type,accept');
    h.set('access-control-expose-headers', 'link,x-ratelimit-remaining,x-ratelimit-reset,etag');
    h.set('vary', 'origin');
    return new Response(res.body, { status: res.status, headers: h });
  }
  return res;
}

function getCookie(request, name) {
  const c = request.headers.get('cookie') || '';
  const m = c.match(new RegExp('(?:^|;\\s*)' + name + '=([^;]*)'));
  return m ? decodeURIComponent(m[1]) : '';
}

/* ------------------------------------------------------- signed tokens */
const te = new TextEncoder();
const b64u = (buf) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64uStr = (s) => b64u(te.encode(s));
const unb64u = (s) => { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return atob(s); };

async function hmacKey(secret) {
  return crypto.subtle.importKey('raw', te.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}
async function signToken(payload, env) {
  if (!env.SESSION_SECRET) throw new Error('SESSION_SECRET is not set');
  const body = b64uStr(JSON.stringify(payload));
  const sig = b64u(await crypto.subtle.sign('HMAC', await hmacKey(env.SESSION_SECRET), te.encode(body)));
  return `${body}.${sig}`;
}
async function verifyToken(token, env) {
  if (!token || !env.SESSION_SECRET) return null;
  const [body, sig] = String(token).split('.');
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(env.SESSION_SECRET), Uint8Array.from(unb64u(sig), (c) => c.charCodeAt(0)), te.encode(body));
  if (!ok) return null;
  let payload;
  try { payload = JSON.parse(unb64u(body)); } catch (e) { return null; }
  if (!payload.exp || Date.now() / 1000 > payload.exp) return null;
  // Role is re-evaluated on every request so removing an email takes effect immediately.
  const role = roleFor(payload.email, env);
  if (!role) return null;
  return { ...payload, role };
}

function sessionFromRequest(request) {
  const auth = request.headers.get('authorization') || '';
  const m = auth.match(/^(?:token|bearer)\s+(.+)$/i);
  if (m) return m[1].trim();
  return getCookie(request, 'jsnm_session');
}

/* --------------------------------------------------------- Google OAuth */
function startGoogleLogin(request, env, url) {
  if (!env.GOOGLE_CLIENT_ID) return html(page('Setup needed', 'GOOGLE_CLIENT_ID is not configured on the Worker.'), 500);
  // Sveltia sends ?provider=github&site_id=<host>&scope=repo — we ignore provider and do Google.
  const siteId = url.searchParams.get('site_id') || '';
  const state = b64u(crypto.getRandomValues(new Uint8Array(16)));
  const redirect = `${url.origin}/callback`;
  const g = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  g.searchParams.set('client_id', env.GOOGLE_CLIENT_ID);
  g.searchParams.set('redirect_uri', redirect);
  g.searchParams.set('response_type', 'code');
  g.searchParams.set('scope', 'openid email profile');
  g.searchParams.set('prompt', 'select_account');
  g.searchParams.set('state', state);
  const cookie = `jsnm_oauth=${encodeURIComponent(JSON.stringify({ state, siteId, popup: url.searchParams.has('provider') }))}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=600`;
  return new Response(null, { status: 302, headers: { location: g.toString(), 'set-cookie': cookie } });
}

async function googleCallback(request, env, url) {
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  let saved = {};
  try { saved = JSON.parse(getCookie(request, 'jsnm_oauth') || '{}'); } catch (e) { saved = {}; }
  const clearOauth = 'jsnm_oauth=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0';
  const fail = (msg) => popupOrPage(saved.popup, { error: msg }, url, clearOauth);

  if (!code || !state || state !== saved.state) return fail('Sign-in could not be verified (state mismatch). Please try again.');

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code, client_id: env.GOOGLE_CLIENT_ID, client_secret: env.GOOGLE_CLIENT_SECRET,
      redirect_uri: `${url.origin}/callback`, grant_type: 'authorization_code'
    })
  });
  const tok = await tokenRes.json().catch(() => ({}));
  if (!tokenRes.ok || !tok.access_token) return fail('Google did not accept the sign-in. ' + (tok.error_description || tok.error || ''));

  const infoRes = await fetch('https://openidconnect.googleapis.com/v1/userinfo', { headers: { authorization: `Bearer ${tok.access_token}` } });
  const info = await infoRes.json().catch(() => ({}));
  const email = String(info.email || '').toLowerCase();
  if (!email || info.email_verified === false) return fail('Google did not return a verified email address.');

  const role = roleFor(email, env);
  if (!role) return fail(`${email} is not an admin of this website. Ask the super admin to add this email.`);

  const hours = Number(env.SESSION_HOURS) > 0 ? Number(env.SESSION_HOURS) : 12;
  const session = await signToken({
    email, name: info.name || email, picture: info.picture || '', role,
    iat: Math.floor(Date.now() / 1000), exp: Math.floor(Date.now() / 1000) + hours * 3600
  }, env);
  const sessionCookie = `jsnm_session=${encodeURIComponent(session)}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${hours * 3600}`;
  return popupOrPage(saved.popup, { token: session, name: info.name || email, role }, url, clearOauth, sessionCookie);
}

/**
 * Decap/Sveltia OAuth popup protocol: the popup posts "authorizing:github",
 * waits for the opener to echo it, then posts "authorization:github:<state>:<json>".
 */
function popupOrPage(isPopup, result, url, ...cookies) {
  const headers = new Headers({ 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
  cookies.filter(Boolean).forEach((c) => headers.append('set-cookie', c));
  if (!isPopup) {
    if (result.error) return new Response(page('Sign-in failed', result.error, `<a href="/">Try again</a>`), { status: 403, headers });
    headers.set('location', '/');
    return new Response(null, { status: 302, headers });
  }
  const state = result.error ? 'error' : 'success';
  const content = result.error ? { provider: 'github', error: result.error } : { provider: 'github', token: result.token };
  const message = `authorization:github:${state}:${JSON.stringify(content)}`;
  const body = `<!doctype html><html><head><meta charset="utf-8"><title>Signing in…</title></head>
<body style="font:15px system-ui;padding:24px;color:#223">
<p>${result.error ? esc(result.error) : `Signed in as <strong>${esc(result.name)}</strong> (${esc(result.role)}). You can close this window.`}</p>
<script>
  (function () {
    var message = ${JSON.stringify(message)};
    function receive(e) {
      if (e.data === 'authorizing:github') { window.opener && window.opener.postMessage(message, e.origin); window.removeEventListener('message', receive); setTimeout(function(){ window.close(); }, 300); }
    }
    window.addEventListener('message', receive);
    window.opener && window.opener.postMessage('authorizing:github', '*');
  })();
</script></body></html>`;
  return new Response(body, { status: result.error ? 403 : 200, headers });
}

function logout(url) {
  return new Response(null, { status: 302, headers: { location: '/', 'set-cookie': 'jsnm_session=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0' } });
}

async function whoAmI(request, env) {
  const s = await verifyToken(sessionFromRequest(request), env);
  if (!s) return json({ signed_in: false }, 401);
  return json({ signed_in: true, email: s.email, name: s.name, role: s.role, exp: s.exp });
}

/* ------------------------------------------------------- GitHub proxy */
async function proxyGitHub(request, env, url) {
  const session = await verifyToken(sessionFromRequest(request), env);
  if (!session) return json({ message: 'Not signed in. Please sign in with Google.', documentation_url: '' }, 401);
  if (!env.GITHUB_TOKEN) return json({ message: 'GITHUB_TOKEN is not configured on the Worker.' }, 500);

  // /gh/api/v3/<rest path>  →  https://api.github.com/<rest path>
  // /gh/api/graphql         →  https://api.github.com/graphql
  let target;
  if (url.pathname === '/gh/api/graphql') target = `${GITHUB_API}/graphql`;
  else if (url.pathname.startsWith('/gh/api/v3/')) target = GITHUB_API + url.pathname.slice('/gh/api/v3'.length) + url.search;
  else if (url.pathname.startsWith('/gh/')) target = GITHUB_API + url.pathname.slice('/gh'.length) + url.search;
  else return json({ message: 'Not found' }, 404);

  // The signed-in person's profile (the CMS shows name/avatar and uses it in commit messages).
  if (request.method === 'GET' && /^\/gh\/api\/v3\/user\/?$/.test(url.pathname)) {
    return json({
      login: session.email, id: hashCode(session.email), name: session.name, email: session.email,
      avatar_url: session.picture || `https://www.gravatar.com/avatar/?d=mp`, html_url: 'https://neurominds.in', type: 'User', role: session.role
    });
  }
  if (request.method === 'GET' && /^\/gh\/api\/v3\/user\/emails\/?$/.test(url.pathname)) {
    return json([{ email: session.email, primary: true, verified: true, visibility: 'public' }]);
  }

  // Repository guard: only the configured repo may be touched.
  const repo = String(env.GITHUB_REPO || '').toLowerCase();
  if (repo && /^\/gh\/api\/v3\/repos\//.test(url.pathname)) {
    const m = url.pathname.match(/^\/gh\/api\/v3\/repos\/([^/]+\/[^/]+)/);
    if (!m || m[1].toLowerCase() !== repo) return json({ message: 'Repository not allowed' }, 403);
  }

  // Read the body once (we may need to inspect it for role enforcement).
  const method = request.method.toUpperCase();
  const isWrite = !['GET', 'HEAD', 'OPTIONS'].includes(method);
  let bodyText = isWrite ? await request.text() : null;

  if (isWrite) {
    const denied = await deniedPaths(session, env, url, method, bodyText, repo);
    if (denied.length) {
      return json({
        message: `Your role (${session.role}) cannot change: ${denied.join(', ')}. Only a super admin can edit these settings.`,
        errors: denied.map((p) => ({ path: p, code: 'forbidden_for_role' }))
      }, 403);
    }
    // GraphQL createCommitOnBranch requires the token owner's identity; if the UI passed a
    // GitHub-style username/email in the body we leave it — GitHub records the PAT owner anyway.
  }

  const headers = new Headers();
  for (const [k, v] of request.headers) {
    if (['host', 'cookie', 'authorization', 'origin', 'referer', 'cf-connecting-ip', 'cf-ray', 'cf-visitor', 'x-forwarded-for', 'x-real-ip'].includes(k.toLowerCase())) continue;
    headers.set(k, v);
  }
  headers.set('authorization', `Bearer ${env.GITHUB_TOKEN}`);
  headers.set('user-agent', 'jsnm-admin-gateway');
  if (!headers.has('accept')) headers.set('accept', 'application/vnd.github+json');

  const upstream = await fetch(target, { method, headers, body: isWrite ? bodyText : undefined, redirect: 'follow' });
  const out = new Headers(upstream.headers);
  out.delete('set-cookie');
  out.set('cache-control', 'no-store');
  return new Response(upstream.body, { status: upstream.status, headers: out });
}

function hashCode(s) { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; return Math.abs(h); }

/** Paths this role may not modify, extracted from the GitHub request. */
async function deniedPaths(session, env, url, method, bodyText, repo) {
  if (session.role === 'super_admin') return [];
  const protectedPrefixes = superOnlyPaths(env);
  const touched = new Set();
  const add = (p) => { if (p) touched.add(String(p).replace(/^\/+/, '')); };

  // REST contents API: PUT/DELETE /repos/{o}/{r}/contents/{path}
  const c = url.pathname.match(/^\/gh\/api\/v3\/repos\/[^/]+\/[^/]+\/contents\/(.+)$/);
  if (c) add(decodeURIComponent(c[1]));

  let body = null;
  if (bodyText) { try { body = JSON.parse(bodyText); } catch (e) { body = null; } }

  // Git data API: POST git/trees  { tree: [{ path }] }
  if (body && Array.isArray(body.tree)) body.tree.forEach((t) => add(t.path));

  // GraphQL createCommitOnBranch: variables.input.fileChanges.{additions,deletions}[].path
  if (body && typeof body.query === 'string' && /createCommitOnBranch/.test(body.query)) {
    const input = (body.variables && (body.variables.input || Object.values(body.variables).find((v) => v && v.fileChanges))) || {};
    const fc = input.fileChanges || {};
    (fc.additions || []).forEach((a) => add(a.path));
    (fc.deletions || []).forEach((d) => add(d.path));
    // Also inline-literal queries (no variables).
    const lit = [...body.query.matchAll(/path:\s*"([^"]+)"/g)].map((m) => m[1]);
    lit.forEach(add);
  }

  // Branch / ref changes and anything else non-content: admins may commit to main only.
  if (/\/git\/refs/.test(url.pathname) && method !== 'POST' && method !== 'PATCH') add('(repository refs)');

  const denied = [];
  for (const p of touched) {
    if (protectedPrefixes.some((pre) => p === pre || p.startsWith(pre))) denied.push(p);
  }
  return denied;
}

/* ------------------------------------------------- static admin UI proxy */
async function serveAdminUi(request, env, url) {
  // The CMS UI itself (index.html, config.yml, brand assets) is built by Cloudflare Pages
  // with the public site at <ADMIN_UI_ORIGIN>; we proxy it so everything is same-origin.
  const base = (env.ADMIN_UI_ORIGIN || 'https://neurominds.in/admin').replace(/\/$/, '');
  let p = url.pathname === '/' ? '/index.html' : url.pathname;
  let target = base + p + url.search;
  if (p.startsWith('/assets/')) target = new URL(base).origin + p; // brand assets live at the site root
  const res = await fetch(target, { headers: { accept: request.headers.get('accept') || '*/*' }, cf: { cacheTtl: 60 } });
  if (res.status === 404 && p !== '/index.html') return serveAdminUi(request, env, new URL('/', url));
  const h = new Headers(res.headers);
  h.set('x-robots-tag', 'noindex, nofollow');
  h.set('cache-control', p === '/index.html' || p.endsWith('config.yml') ? 'no-store' : 'public, max-age=300');
  h.delete('set-cookie');
  return new Response(res.body, { status: res.status, headers: h });
}

function page(title, text, extra = '') {
  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title></head>
<body style="font:15px/1.5 system-ui;max-width:560px;margin:12vh auto;padding:0 20px;color:#223">
<h1 style="font-size:20px">${esc(title)}</h1><p>${esc(text)}</p>${extra}</body></html>`;
}
