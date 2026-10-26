// Unit icon set, ported verbatim from design/casualty-data.js.
// 34 flat silhouettes on a 48×48 grid, one fill colour per category.
// Classic script: attaches window.CasualtyIcons in the browser, module.exports in Node.
(function (root) {
  'use strict';

  const R = (x, y, w, h, r = 0) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}"/>`;
  const C = (cx, cy, r) => `<circle cx="${cx}" cy="${cy}" r="${r}"/>`;
  const P = (pts) => `<polygon points="${pts}"/>`;
  const L = (x1, y1, x2, y2, w) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="currentColor" stroke-width="${w}" stroke-linecap="round"/>`;
  const hole = (cx, cy, r) => `M${cx - r} ${cy}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0z`;
  const track = (x, w, y = 31, h = 9) => { const r = h / 2; const cs = [x + r + 1, x + w / 2, x + w - r - 1]; return `<path fill-rule="evenodd" d="M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 0 1 0 ${h}H${x + r}a${r} ${r} 0 0 1 0 ${-h}z${cs.map(c => hole(c, y + r, 2)).join('')}"/>`; };
  const wheel = (cx, cy, r = 4) => `<path fill-rule="evenodd" d="${hole(cx, cy, r)}${hole(cx, cy, r * 0.4)}"/>`;
  const person = (cx, helmet = true) => (helmet ? `<path d="M${cx - 6} 11a6 6 0 0 1 12 0z"/>` + R(cx - 7, 10.5, 14, 2.5, 1.25) : R(cx - 4.5, 5, 9, 5, 2) + R(cx - 5, 9.5, 12, 2, 1)) + R(cx - 5.5, 15, 11, 13, 3) + R(cx - 5.5, 27, 4.5, 13, 2) + R(cx + 1, 27, 4.5, 13, 2);
  const wave = (y) => `<path d="M0 ${y}q4-3 8 0t8 0t8 0t8 0t8 0t8 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>`;
  const trefoil = (x, y) => `<g transform="translate(${x} ${y})"><path d="M0 0L0-7A7 7 0 0 1 6.06-3.5Z"/><path d="M0 0L0-7A7 7 0 0 1 6.06-3.5Z" transform="rotate(120)"/><path d="M0 0L0-7A7 7 0 0 1 6.06-3.5Z" transform="rotate(240)"/><circle r="1.8"/></g>`;
  const fuse = (x, y, w, h) => R(x, y, w, h, w / 2);

  const CATS = {
    ground: { label: 'Ground', color: 'oklch(0.48 0.09 130)', soft: 'oklch(0.96 0.02 130)' },
    air: { label: 'Air', color: 'oklch(0.48 0.09 230)', soft: 'oklch(0.96 0.02 230)' },
    naval: { label: 'Naval', color: 'oklch(0.48 0.09 275)', soft: 'oklch(0.96 0.02 275)' },
    // Added beyond the design: units not in the 34-unit roster.
    other: { label: 'Other', color: 'oklch(0.48 0.02 60)', soft: 'oklch(0.955 0.005 70)' },
  };

  // Icon colour for zero-count ("untouched") cards.
  const MUTED = 'oklch(0.74 0.01 60)';

  const UNITS = [
    ['Infantry', 'ground', person(20) + L(27, 32, 36, 9, 3)],
    ['Motorized Infantry', 'ground', R(4, 16, 24, 16, 1.5) + `<path d="M30 32V21h7l5 6v5z"/>` + wheel(12, 34) + wheel(36, 34)],
    ['Mechanized Infantry', 'ground', R(4, 19, 27, 11, 1.5) + `<path d="M30 30V20h8l4 6v4z"/>` + track(4, 24, 30, 8) + wheel(38, 34)],
    ['Militia', 'ground', person(20, false) + L(27, 32, 36, 9, 3)],
    ['Commandos', 'ground', person(20) + P('28,30 31,30 35,13 29.5,14') + R(26, 29, 7, 3, 1.5)],
    ['Paratroopers', 'ground', `<path d="M6 22a18 14 0 0 1 36 0z"/>` + L(8, 22, 23, 33, 1.5) + L(24, 22, 24, 33, 1.5) + L(40, 22, 25, 33, 1.5) + C(24, 32, 3.2) + R(20.5, 35, 7, 9, 2.5)],
    ['Armored Car', 'ground', `<path d="M4 32l4-8h8l4-4h12l4 4h8v8z"/>` + R(20, 15, 10, 6, 1.5) + L(30, 18, 39, 18, 2.5) + wheel(10, 34) + wheel(24, 34) + wheel(38, 34)],
    ['Light Tank', 'ground', track(8, 32) + `<path d="M10 31v-7h22l6 3v4z"/>` + R(17, 17, 12, 7, 2.5) + L(29, 20.5, 41, 20.5, 2.5)],
    ['Medium Tank', 'ground', track(6, 36) + `<path d="M8 31v-7h26l6 3v4z"/>` + R(15, 15, 15, 9, 3) + L(30, 19.5, 46, 19.5, 3)],
    ['Heavy Tank', 'ground', track(4, 40, 30, 10) + `<path d="M6 30v-8h30l6 3v5z"/>` + R(11, 12, 18, 10, 3) + L(29, 17, 46, 17, 3.5) + R(42, 14.5, 5, 5, 1.5)],
    ['Tank Destroyer', 'ground', track(6, 36) + `<path d="M8 31v-8l5-6h16l3 4h6v10z"/>` + L(32, 21, 47, 21, 3)],
    ['Anti Tank', 'ground', P('14,34 14,18 24,14 24,34') + L(22, 22, 42, 16, 3) + L(24, 30, 8, 38, 2.5) + wheel(14, 36)],
    ['Anti Air', 'ground', R(14, 30, 20, 4, 1.5) + R(20, 24, 8, 8, 1.5) + L(24, 28, 36, 8, 3) + wheel(14, 36, 3.5) + wheel(34, 36, 3.5)],
    ['SP Anti Air', 'ground', track(6, 36) + R(8, 24, 32, 8, 1.5) + R(18, 18, 12, 7, 2) + L(26, 20, 38, 4, 2.5) + L(29, 21, 41, 5, 2.5)],
    ['Artillery', 'ground', R(14, 20, 8, 10, 1.5) + L(20, 28, 44, 10, 3.5) + L(20, 30, 6, 38, 3) + wheel(20, 34, 5)],
    ['SP Artillery', 'ground', track(6, 36) + `<path d="M8 31v-7h24l6 3v4z"/>` + R(10, 16, 16, 8, 2) + L(24, 20, 44, 6, 3.5)],
    ['Rocket Artillery', 'ground', R(4, 27, 27, 5, 1) + `<path d="M30 32V22h7l5 5v5z"/>` + wheel(11, 34) + wheel(37, 34) + L(8, 25, 27, 9, 2.5) + L(12, 26, 31, 10, 2.5) + L(16, 27, 35, 11, 2.5) + L(20, 28, 39, 12, 2.5)],
    ['SP Rocket Artillery', 'ground', track(6, 36) + R(8, 24, 32, 8, 1.5) + L(10, 23, 28, 7, 2.5) + L(14, 24, 32, 8, 2.5) + L(18, 25, 36, 9, 2.5) + L(22, 26, 40, 10, 2.5)],
    ['Railroad Gun', 'ground', R(2, 28, 44, 5, 1) + R(14, 20, 16, 8, 1.5) + L(22, 22, 47, 6, 3.5) + wheel(7, 36, 3) + wheel(13, 36, 3) + wheel(35, 36, 3) + wheel(41, 36, 3) + L(1, 41.5, 47, 41.5, 1.5)],
    ['Interceptor', 'air', fuse(21.5, 5, 5, 36) + P('6,26 21.5,16 26.5,16 42,26 42,29 26.5,24 21.5,24 6,29') + P('15,40 21.5,34 26.5,34 33,40 33,42 15,42')],
    ['Tactical Bomber', 'air', fuse(21, 6, 6, 36) + R(4, 19, 40, 6, 2) + R(11, 16, 5, 11, 2.5) + R(32, 16, 5, 11, 2.5) + R(14, 37, 20, 4, 2)],
    ['Attack Bomber', 'air', fuse(21, 6, 6, 36) + P('4,22 21,17 27,17 44,22 44,27 27,25 21,25 4,27') + R(10, 27, 3, 7, 1.5) + R(35, 27, 3, 7, 1.5) + R(14, 38, 20, 4, 2)],
    ['Strategic Bomber', 'air', fuse(21, 3, 6, 42) + P('2,20 21,14 27,14 46,20 46,24 27,24 21,24 2,24') + R(7, 15, 4, 11, 2) + R(14, 13, 4, 11, 2) + R(30, 13, 4, 11, 2) + R(37, 15, 4, 11, 2) + R(13, 40, 22, 4, 2)],
    ['Naval Bomber', 'air', fuse(21, 5, 6, 32) + R(5, 18, 38, 6, 2) + R(9, 24, 4, 12, 2) + R(35, 24, 4, 12, 2) + R(14, 34, 20, 4, 2) + wave(44)],
    ['Rocket Fighter', 'air', fuse(20, 8, 8, 26) + P('4,34 20,18 28,18 44,34 44,37 28,32 20,32 4,37') + P('20,34 28,34 24,45')],
    ['Flying Bomb', 'air', fuse(21, 6, 6, 26) + R(8, 18, 32, 4, 2) + R(14, 30, 20, 3, 1.5) + R(22, 24, 4, 20, 2)],
    ['Rocket', 'air', fuse(19, 3, 10, 34) + P('19,30 12,43 19,43') + P('29,30 36,43 29,43') + R(19, 37, 10, 4, 1)],
    ['Nuclear Bomber', 'air', fuse(20, 3, 6, 36) + P('1,19 20,13 26,13 44,19 44,23 26,23 20,23 1,23') + R(6, 14, 4, 11, 2) + R(13, 12, 4, 11, 2) + R(29, 12, 4, 11, 2) + R(36, 14, 4, 11, 2) + R(13, 34, 20, 4, 2) + trefoil(40, 39)],
    ['Nuclear Rocket', 'air', fuse(13, 3, 10, 34) + P('13,30 6,43 13,43') + P('23,30 30,43 23,43') + R(13, 37, 10, 4, 1) + trefoil(39, 37)],
    ['Submarine', 'naval', wave(12) + R(27, 8, 2, 10, 1) + R(20, 17, 10, 8, 2) + R(4, 25, 40, 10, 5)],
    ['Destroyer', 'naval', P('3,30 45,30 41,38 7,38') + R(16, 22, 12, 8, 1.5) + R(24, 15, 4, 8, 1) + R(19, 13, 2, 9, 1) + R(7, 26, 6, 4, 1) + wave(43)],
    ['Cruiser', 'naval', P('2,30 46,30 42,38 6,38') + R(14, 21, 16, 9, 1.5) + R(20, 14, 4, 8, 1) + R(27, 14, 4, 8, 1) + R(6, 25, 6, 5, 1) + R(36, 25, 6, 5, 1) + R(1, 26.5, 5, 2, 1) + R(42, 26.5, 5, 2, 1) + wave(43)],
    ['Battleship', 'naval', P('1,29 47,29 43,38 5,38') + R(16, 20, 14, 9, 1.5) + R(19, 10, 6, 11, 1.5) + R(27, 13, 4, 8, 1) + R(6, 24, 8, 5, 1.5) + R(33, 24, 8, 5, 1.5) + R(0, 25.5, 6, 2, 1) + R(41, 25.5, 6, 2, 1) + wave(43)],
    ['Aircraft Carrier', 'naval', R(2, 24, 44, 5, 1) + P('5,29 43,29 40,38 8,38') + R(32, 15, 7, 9, 1.5) + R(35, 10, 2, 6, 1) + wave(43)],
  ].map(([name, cat, body], i) => ({ id: name.toLowerCase().replace(/\s+/g, '-'), name, cat, body, order: i }));

  // Added beyond the design: generic icon for units not in the roster (a crate with a "?").
  const FALLBACK_BODY = `<path fill-rule="evenodd" d="M12 8h24a4 4 0 0 1 4 4v24a4 4 0 0 1-4 4H12a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4zM13 13v22h22V13z"/>` +
    `<path d="M19.5 19.5a4.5 4.5 0 1 1 6.3 4.1c-1.2.6-1.8 1.4-1.8 2.7v1.2" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>` + C(24, 31.5, 1.9);
  const fallbackUnit = (name) => ({ id: 'other-' + name.toLowerCase().replace(/\s+/g, '-'), name, cat: 'other', body: FALLBACK_BODY, order: 1000 });

  const iconSvg = (unit, color) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style="color:${color}" fill="currentColor">${unit.body}</svg>`;
  const iconUrl = (unit, color) => 'data:image/svg+xml;utf8,' + encodeURIComponent(iconSvg(unit, color));

  const api = { CATS, UNITS, MUTED, iconSvg, iconUrl, fallbackUnit };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CasualtyIcons = api;
})(typeof window !== 'undefined' ? window : this);
