/**
 * JS Neurominds V1 — shared/markdown.js
 * Tiny, dependency-free Markdown → HTML renderer for CMS article bodies.
 * Escapes all raw HTML first (so content can never inject scripts), then
 * supports: # headings, paragraphs, **bold**, *italic*, [links](url),
 * - / * bullet lists, 1. numbered lists, > quotes, --- rules, line breaks.
 * Good enough for clinic articles; keeps the bundle light (no marked/DOMPurify).
 */
import { esc } from './content-normalize.js';

function inline(text) {
  let s = esc(text);
  // links: [label](https://...) — only http(s), mailto, tel and site-relative.
  s = s.replace(/\[([^\]]+)\]\(((?:https?:\/\/|mailto:|tel:|\/)[^)\s]+)\)/g,
    (m, label, url) => `<a href="${url}"${/^https?:/.test(url) ? ' target="_blank" rel="noopener"' : ''}>${label}</a>`);
  s = s.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  s = s.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  return s;
}

export function markdownToHtml(md) {
  if (md == null) return '';
  const src = String(md).replace(/\r\n?/g, '\n');
  // Already HTML-ish legacy content (no markdown markers, contains tags)? Escape as paragraphs.
  const lines = src.split('\n');
  const out = [];
  let para = [];
  let listType = null; // 'ul' | 'ol'
  let quote = [];

  const flushPara = () => { if (para.length) { out.push(`<p>${inline(para.join(' '))}</p>`); para = []; } };
  const flushList = () => { if (listType) { out.push(`</${listType}>`); listType = null; } };
  const flushQuote = () => { if (quote.length) { out.push(`<blockquote><p>${inline(quote.join(' '))}</p></blockquote>`); quote = []; } };
  const flushAll = () => { flushPara(); flushList(); flushQuote(); };

  for (const raw of lines) {
    const line = raw.trimEnd();
    if (!line.trim()) { flushAll(); continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) { flushAll(); const lvl = Math.min(6, h[1].length + 1); out.push(`<h${lvl}>${inline(h[2])}</h${lvl}>`); continue; }

    if (/^(-{3,}|\*{3,}|_{3,})$/.test(line.trim())) { flushAll(); out.push('<hr class="divider" />'); continue; }

    const ul = line.match(/^\s*[-*•]\s+(.*)$/);
    const ol = line.match(/^\s*\d+[.)]\s+(.*)$/);
    if (ul || ol) {
      flushPara(); flushQuote();
      const type = ul ? 'ul' : 'ol';
      if (listType && listType !== type) flushList();
      if (!listType) { out.push(`<${type}>`); listType = type; }
      out.push(`<li>${inline((ul || ol)[1])}</li>`);
      continue;
    }

    const q = line.match(/^\s*>\s?(.*)$/);
    if (q) { flushPara(); flushList(); quote.push(q[1]); continue; }

    flushList(); flushQuote();
    para.push(line.trim());
  }
  flushAll();
  return out.join('\n');
}
