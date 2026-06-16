/**
 * JS Neurominds V1 — admin-ui/assets/js/charts.js
 * Lightweight vanilla chart renderers. No chart libraries — just SVG + CSS,
 * to keep the admin bundle small and dependency-free.
 */

const PALETTE = ['#178a8d', '#0f5b5e', '#5cb8b9', '#e08a4b', '#2f6f8f', '#9a6a1c'];

export function sparkline(values, { width = 520, height = 140, stroke = '#178a8d' } = {}) {
  if (!values || !values.length) return '';
  const max = Math.max(...values), min = Math.min(...values);
  const range = max - min || 1;
  const pad = 8;
  const stepX = (width - pad * 2) / (values.length - 1);
  const pts = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = height - pad - ((v - min) / range) * (height - pad * 2);
    return [x, y];
  });
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = line + ` L${pts[pts.length - 1][0].toFixed(1)} ${height - pad} L${pad} ${height - pad} Z`;
  return `
    <svg class="spark" viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" role="img" aria-label="Trend line">
      <defs><linearGradient id="spark-g" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stop-color="${stroke}" stop-opacity="0.18"/>
        <stop offset="100%" stop-color="${stroke}" stop-opacity="0"/>
      </linearGradient></defs>
      <path d="${area}" fill="url(#spark-g)"/>
      <path d="${line}" fill="none" stroke="${stroke}" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      ${pts.map((p) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="2.5" fill="${stroke}"/>`).join('')}
    </svg>`;
}

export function donut(data, { size = 150, thickness = 28 } = {}) {
  // data: [{label, value}]
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2;
  const cx = size / 2, cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const rings = data.map((d, i) => {
    const frac = d.value / total;
    const dash = frac * circ;
    const seg = `<circle cx="${cx}" cy="${cy}" r="${r}" fill="none"
      stroke="${PALETTE[i % PALETTE.length]}" stroke-width="${thickness}"
      stroke-dasharray="${dash.toFixed(2)} ${(circ - dash).toFixed(2)}"
      stroke-dashoffset="${(-offset).toFixed(2)}" transform="rotate(-90 ${cx} ${cy})"/>`;
    offset += dash;
    return seg;
  }).join('');
  const legend = data.map((d, i) =>
    `<li><span class="dot" style="background:${PALETTE[i % PALETTE.length]}"></span>${d.label} <strong style="margin-left:auto">${d.value}</strong></li>`
  ).join('');
  return `
    <div class="donut-wrap">
      <svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" role="img" aria-label="Distribution">
        ${rings}
        <text x="${cx}" y="${cy}" text-anchor="middle" dominant-baseline="central"
          font-family="Fraunces,serif" font-size="22" font-weight="600" fill="#16201f">${total}</text>
      </svg>
      <ul class="legend" style="min-width:160px">${legend}</ul>
    </div>`;
}

export function bars(data) {
  // data: [{label, value}]
  const max = Math.max(...data.map((d) => d.value), 1);
  return data.map((d) => `
    <div class="bar-row">
      <span class="label">${d.label}</span>
      <span class="bar-track"><span class="bar-fill" style="width:${(d.value / max * 100).toFixed(1)}%"></span></span>
      <span class="val">${d.value}</span>
    </div>`).join('');
}
