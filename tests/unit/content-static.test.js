import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yes, list, faqList, published, enabledSorted } from '../../shared/content-normalize.js';
import { markdownToHtml } from '../../shared/markdown.js';
import { renderDetail, detailUrl, conditionCard, renderList } from '../../shared/render.js';
import { CONDITIONS, DOCTORS, BLOGS, NAVIGATION, SOCIAL_LINKS, FEATURE_FLAGS, PAGES } from '../../shared/content.js';
import { fillCopy, prerenderMounts, applyHead, transformTopLevelPage } from '../../scripts/lib/html-transform.js';

test('normalize: accepts both legacy Sheets strings and typed JSON', () => {
  assert.equal(yes('YES'), true); assert.equal(yes(true), true); assert.equal(yes('NO'), false); assert.equal(yes(undefined), false);
  assert.deepEqual(list('a;b; c;'), ['a', 'b', 'c']); assert.deepEqual(list(['a', ' b ']), ['a', 'b']); assert.deepEqual(list(''), []);
  assert.deepEqual(faqList('Q1?|A1||Q2?|A2'), [{ question: 'Q1?', answer: 'A1' }, { question: 'Q2?', answer: 'A2' }]);
  assert.deepEqual(faqList([{ question: 'Q', answer: 'A' }, { question: '', answer: 'x' }]), [{ question: 'Q', answer: 'A' }]);
  assert.equal(enabledSorted([{ is_enabled: true, url: 'x', display_order: 2 }, { is_enabled: 'YES', url: 'y', display_order: 1 }, { is_enabled: false, url: 'z' }], 'url').map((r) => r.url).join(), 'y,x');
});

test('content: bundled JSON is the single source and is well formed', () => {
  assert.ok(published(CONDITIONS).length >= 50, 'conditions present');
  assert.ok(DOCTORS[0] && DOCTORS[0].slug, 'doctor present');
  assert.ok(NAVIGATION.length >= 8 && NAVIGATION.every((n) => n.route.startsWith('/')));
  assert.ok(SOCIAL_LINKS.length > 0);
  assert.equal(typeof FEATURE_FLAGS.public_lab_tests_enabled, 'boolean');
  assert.ok(PAGES.home.hero_title && PAGES.home.seo_title);
});

test('markdown: safe (escapes HTML) and renders the basics', () => {
  const html = markdownToHtml('# Title\n\nHello **bold** and *em* <script>alert(1)</script>\n\n- one\n- two\n\n[Link](https://example.com)');
  assert.ok(html.includes('<h2>Title</h2>'));
  assert.ok(html.includes('<strong>bold</strong>') && html.includes('<em>em</em>'));
  assert.ok(!html.includes('<script>'), 'raw HTML must be escaped');
  assert.ok(html.includes('<ul>') && html.includes('<li>one</li>'));
  assert.ok(html.includes('<a href="https://example.com" target="_blank" rel="noopener">Link</a>'));
  assert.ok(!markdownToHtml('[x](javascript:alert(1))').includes('href='), 'javascript: links are not linked');
});

test('render: detail pages use clean URLs and escape content', () => {
  const c = { ...CONDITIONS[0], name: 'Test <b>x</b>', faqs: 'Q|A', symptoms: 'a;b', is_emergency: 'YES' };
  const html = renderDetail('condition', c, FEATURE_FLAGS);
  assert.ok(html.includes('Test &lt;b&gt;x&lt;/b&gt;'));
  assert.ok(html.includes('<li>a</li>') && html.includes('<summary>Q</summary>'));
  assert.ok(html.includes('/emergency"'), 'emergency notice for emergency conditions');
  assert.equal(detailUrl('condition', 'anxiety'), '/conditions/anxiety');
  assert.ok(conditionCard(CONDITIONS[0]).includes(`href="/conditions/${CONDITIONS[0].slug}"`));
  assert.ok(renderList('doctors', DOCTORS).includes(`/doctors/${DOCTORS[0].slug}`));
  assert.ok(renderDetail('blog', BLOGS[0]).includes('<article'));
});

test('build transform: copy, pre-render, head and clean links', () => {
  const src = `<!DOCTYPE html><html><head><title>Old</title><meta name="description" content="old" /><link rel="canonical" href="https://neurominds.in/about.html" /></head>
<body><h1 data-copy="title">Fallback</h1><div class="grid" id="list-wrap" data-list="doctors"></div><a href="/booking.html#confirmed">x</a><a href="/index.html">h</a></body></html>`;
  const out = transformTopLevelPage(src, 'doctors');
  assert.ok(out.includes(`<h1 data-copy="title" data-copy-applied="1">${PAGES.doctors.title}</h1>`));
  assert.ok(out.includes('data-prerendered="1"') && out.includes(DOCTORS[0].full_name), 'list pre-rendered');
  assert.ok(out.includes(`<title>${PAGES.doctors.seo_title.replace(/&/g, '&amp;')}</title>`));
  assert.ok(out.includes('<link rel="canonical" href="https://neurominds.in/doctors" />'), 'canonical is the clean URL');
  assert.ok(out.includes('href="/booking#confirmed"') && out.includes('href="/"'), 'links cleaned');
  assert.ok(out.includes('application/ld+json'), 'JSON-LD present');
  // Legacy ?slug= shells are noindex and carry no canonical.
  const shell = transformTopLevelPage('<html><head><title>x</title><link rel="canonical" href="https://neurominds.in/condition.html" /></head><body></body></html>', 'condition');
  assert.ok(shell.includes('noindex') && !shell.includes('rel="canonical"'));
  // fillCopy ignores unknown keys and non-strings.
  assert.equal(fillCopy('<p data-copy="nope">keep</p>', PAGES.home), '<p data-copy="nope">keep</p>');
  assert.ok(prerenderMounts('<div id="faq-wrap"></div>', 'faq').includes('<details'));
  assert.ok(applyHead('<html><head></head></html>', { title: 'T & U', description: 'D' }).includes('<title>T &amp; U</title>'));
});
