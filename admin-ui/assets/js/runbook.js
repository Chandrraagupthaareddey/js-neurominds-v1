/**
 * JS Neurominds V1 — admin-ui/assets/js/runbook.js
 * Runbook / Help Center with two modes:
 *   - Staff Guide: how to handle callbacks, calls, what to ask/not ask, lab.
 *   - Admin System Guide: architecture, data flows, deploy, debug checklists.
 * Flow cards expand with a lightweight CSS transition (no heavy libraries).
 */

let mode = 'staff';

const STAFF = [
  { t: 'Handle a callback request', b: 'Open Callback Desk. Pick the request. Verify the patient, confirm their concern category and preferred time, then call using the Call Patient button. Keep it warm and brief.' },
  { t: 'Call or WhatsApp the patient', b: 'Use the sticky Call Patient (opens dialer) or WhatsApp button (opens click-to-chat). There is no WhatsApp Business API in V1 — these are quick links only.' },
  { t: 'What to ask', b: 'Best time to reach them, whether the consult is for themselves or family, clinic vs online preference, and preferred doctor. Keep questions logistical.' },
  { t: 'What not to ask', b: 'Never ask for diagnosis, symptoms, medication, or psychiatric history on the call form. Do not give clinical advice. Guide them to book a consultation instead.' },
  { t: 'Set a follow-up', b: 'If the patient needs a callback later, set status to "Follow-up required" and add a short, non-clinical note. It will resurface on the dashboard.' },
  { t: 'Close or convert', b: 'When the patient books or no longer needs help, set status to Converted or Closed with a brief outcome note.' },
  { t: 'Handle a lab inquiry', b: 'Open Lab Requests. Confirm pickup area is within ~10 km of Chandragiri and a workable time. Call to verify, then update status to Verified.' },
  { t: 'Report an issue', b: 'If something looks broken (a link, a missing request, an email that did not arrive), tell the Super Admin and check System Health for email failures.' }
];

const ADMIN = [
  { t: 'Architecture overview', b: 'Cloudflare Pages serves the static public site. Two GAS web apps provide the Public API and Admin CMS. Two Google Sheets workbooks hold CMS + operations data. GA4 owns analytics; BigQuery is an optional sandbox archive.' },
  { t: 'Data flow', b: 'Public site reads content from the Public API (cached). Visitors submit callback/lab/feedback → Public API validates → writes to the Operations workbook under a LockService lock → sends email (non-blocking) → logs status.' },
  { t: 'Booking flow', b: 'Two CTAs. Private call back saves to Operations and is handled in the Callback Desk. Confirmed booking redirects to PWeNS/Doctor24x7 and fires the pwens_booking_click GA4 event. No appointment is stored in V1.' },
  { t: 'Callback workflow', b: 'new → contacted → followup_required → converted/closed. Every change writes to Callback_Status_History with the actor and timestamp.' },
  { t: 'Lab flow', b: 'Public lab request → Operations workbook → staff verify → status moves through verified → collected → completed. No clinical data or prescriptions are collected.' },
  { t: 'GA4 / BigQuery flow', b: 'The site sends allowlisted, non-PII events to GA4. GA4 exports daily to BigQuery as a raw archive. Dashboards read the GA4 Data API, never BigQuery streaming (sandbox blocks insertAll).' },
  { t: 'Cloudflare deploy hook flow', b: 'Admin approves content → Sync Approved Content → GAS calls the Cloudflare Deploy Hook → Cloudflare rebuilds → build-stubs.js fetches approved content from the Public API → regenerates stubs + sitemap → deploys.' },
  { t: 'SEO static stub flow', b: 'Condition, treatment, doctor, location, blog, and lab package pages are prerendered as lightweight static stubs with full meta + JSON-LD, referencing shared CSS/JS. Stubs are built at deploy time, not committed.' },
  { t: 'Cost & scaling', b: 'Everything runs on free tiers: Cloudflare Pages, GAS, Sheets, GA4. No bulk visitor logs hit Sheets, so the operational workbook stays small and fast.' },
  { t: 'Quota risks', b: 'Watch the MailApp daily email quota (shown in System Health) and GAS execution limits. Email failures are non-blocking and logged, so a quota hit never loses a request.' },
  { t: 'Failure points', b: 'Email quota exhaustion, Deploy Hook misconfiguration, GAS web app permission drift, and PWeNS URL changes. Each is visible in System Health or the relevant config.' },
  { t: 'Debug checklist', b: '1) Check System Health. 2) Check Email_Logs for failures. 3) Check Cloudflare_Deployments for the last deploy. 4) Confirm Script Properties hold the right workbook + hook URLs. 5) Re-run the Public API health check.' },
  { t: 'Deployment checklist', b: 'Run setup once; verify both workbooks + tabs; seed users/roles; set Script Properties; deploy both web apps; set GA4 + BigQuery export; configure the Deploy Hook; smoke-test public + admin; then go live.' }
];

export async function renderRunbook(mount) {
  mount.innerHTML = `
    <div class="runbook-tabs">
      <button class="runbook-tab ${mode === 'staff' ? 'active' : ''}" data-mode="staff">Staff Guide</button>
      <button class="runbook-tab ${mode === 'admin' ? 'active' : ''}" data-mode="admin">Admin / System Guide</button>
    </div>
    <div id="runbook-cards"></div>`;

  const draw = () => {
    const items = mode === 'staff' ? STAFF : ADMIN;
    document.getElementById('runbook-cards').innerHTML = items.map((it, i) => `
      <div class="flow-card" data-i="${i}">
        <span class="flow-card__num">${i + 1}</span>
        <div class="flex between center">
          <h3 style="margin:0;font-size:1rem">${it.t}</h3>
          <span class="chev" style="transition:transform .2s">▸</span>
        </div>
        <div class="flow-detail"><p style="margin:.75rem 0 0">${it.b}</p></div>
      </div>`).join('');

    document.querySelectorAll('.flow-card').forEach((card) => {
      card.addEventListener('click', () => {
        const detail = card.querySelector('.flow-detail');
        const chev = card.querySelector('.chev');
        const open = detail.classList.toggle('open');
        chev.style.transform = open ? 'rotate(90deg)' : '';
      });
    });
  };

  mount.querySelectorAll('.runbook-tab').forEach((tab) => {
    tab.addEventListener('click', () => {
      mode = tab.dataset.mode;
      mount.querySelectorAll('.runbook-tab').forEach((t) => t.classList.toggle('active', t.dataset.mode === mode));
      draw();
    });
  });
  draw();
}
