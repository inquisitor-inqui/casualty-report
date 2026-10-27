// Casualty Report page. Renders everything from window.CASUALTY_DATA (data.js).
(function () {
  'use strict';

  var I = window.CasualtyIcons;
  var P = window.CasualtyParse;
  var DATA = window.CASUALTY_DATA || { liveDay: null, updatedAt: '', days: {} };
  var ROSTER = I.UNITS.map(function (u) { return u.name; });
  var BY_NAME = {};
  I.UNITS.forEach(function (u) { BY_NAME[u.name] = u; });

  var parsed = P.parseCasualtyData(DATA, ROSTER);
  var ALL = P.summarize(parsed, null, ROSTER);
  var LATEST = ALL.latestDay;
  var LIVE = DATA.liveDay != null && LATEST != null && Number(DATA.liveDay) === LATEST;
  var DIV_LIMIT = 12;

  var state = {
    nation: null,
    showZero: false,
    showAllDivisions: false,
    open: {},
  };
  if (LATEST != null) state.open[LATEST] = true;

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function slug(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''); }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : many); }

  function unitDef(name) { return BY_NAME[name] || I.fallbackUnit(name); }
  function catOf(name) { return I.CATS[unitDef(name).cat]; }

  var iconCache = {};
  function icon(name, size, opts) {
    opts = opts || {};
    var u = unitDef(name);
    var color = opts.muted ? I.MUTED : I.CATS[u.cat].color;
    var key = name + '|' + color;
    var src = iconCache[key] || (iconCache[key] = I.iconUrl(u, color));
    return '<img class="icon" src="' + src + '" alt="' + esc(opts.alt ? name : '') + '" width="' + size + '" height="' + size + '">';
  }

  function chip(text, kind, size) {
    return '<span class="chip' + (kind ? ' ' + kind : '') + (size ? ' ' + size : '') + '">' + esc(text) + '</span>';
  }
  // "+N" chip; +0 uses the muted style.
  function deltaChip(n, size) { return chip('+' + n, n > 0 ? '' : 'zero', size); }

  // ---------- Hash (selected nation) ----------

  function readHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    var n = ALL.nations.find(function (x) { return slug(x.name) === h; });
    state.nation = n ? n.name : null;
  }

  // ---------- Header ----------

  function renderHeader() {
    $('subtitle').textContent = LATEST != null ? 'Enemy losses · Day ' + LATEST : 'Enemy losses';
    $('status-text').textContent = LATEST == null ? 'Call of War'
      : 'Day ' + LATEST + (LIVE ? ' in progress' : ' final') + ' · Call of War';
    $('status-dot').classList.toggle('live', LIVE);
    $('footer-day').textContent = LATEST != null ? 'Last updated: Day ' + LATEST : 'Last updated';
    renderUpdated();
  }

  function relativeTime(date) {
    var s = Math.round((Date.now() - date.getTime()) / 1000);
    if (s < 45) return 'just now';
    var m = Math.round(s / 60);
    if (m < 60) return m + ' min ago';
    var h = Math.round(m / 60);
    if (h < 24) return plural(h, 'hour', 'hours') + ' ago';
    var d = Math.round(h / 24);
    return plural(d, 'day', 'days') + ' ago';
  }

  function renderUpdated() {
    var el = $('updated');
    var d = DATA.updatedAt ? new Date(DATA.updatedAt) : null;
    if (!d || isNaN(d.getTime())) { el.textContent = ''; el.removeAttribute('title'); return; }
    el.textContent = 'Updated ' + relativeTime(d);
    el.title = d.toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' });
  }

  // ---------- Tabs ----------

  function renderTabs() {
    var tabs = [{ id: '', name: null, label: 'All nations', count: ALL.total }].concat(
      ALL.nations.map(function (n) { return { id: slug(n.name), name: n.name, label: n.name, count: n.total }; }));
    $('tabs').innerHTML = tabs.map(function (t) {
      var active = t.name === state.nation;
      return '<button type="button" class="tab' + (active ? ' active' : '') + '" data-tab="' + esc(t.id) + '"' +
        (active ? ' aria-current="true"' : '') + '>' + esc(t.label) + '<span class="tab-count">' + t.count + '</span></button>';
    }).join('');
  }

  // ---------- Hero ----------

  function renderHero(s) {
    var tiles = [
      { label: 'Total units destroyed', value: s.total, chip: deltaChip(s.latestTotal), note: 'Since tracking began' },
      { label: LIVE ? 'Destroyed today (so far)' : 'Destroyed today', value: s.latestTotal, chip: LATEST != null ? chip('Day ' + LATEST, 'neutral') : '', note: 'Latest game day' },
      { label: 'Enemy divisions that took losses', value: s.divisionsHit, chip: deltaChip(s.newDivisionsLatest), note: 'Distinct formations hit' },
      { label: 'Days tracked', value: s.daysTracked, chip: s.daysTracked ? deltaChip(1) : '', note: 'Game days on record' },
    ];
    $('hero').innerHTML = tiles.map(function (t) {
      return '<div class="card tile"><div class="tile-label">' + esc(t.label) + '</div>' +
        '<div class="tile-value-row"><span class="tile-value">' + t.value + '</span>' + t.chip + '</div>' +
        '<div class="tile-note">' + esc(t.note) + '</div></div>';
    }).join('');
  }

  // ---------- Unit cards ----------

  function renderUnits(s) {
    $('units-heading').textContent = state.nation ? 'What ' + state.nation + ' has lost so far' : 'What the enemy has lost so far';

    var units = I.UNITS.map(function (u) {
      var x = s.units.get(u.name);
      return { name: u.name, cat: u.cat, order: u.order, count: x ? x.total : 0, delta: x ? x.delta : 0 };
    });
    var zeroTotal = units.filter(function (u) { return u.count === 0; }).length;
    var others = [];
    s.units.forEach(function (x) { if (!BY_NAME[x.name]) others.push({ name: x.name, cat: 'other', order: 1000, count: x.total, delta: x.delta }); });

    var toggle = $('zero-toggle');
    toggle.hidden = zeroTotal === 0;
    toggle.textContent = state.showZero ? 'Hide untouched unit types' : 'Show all ' + units.length + ' unit types (' + zeroTotal + ' untouched)';
    toggle.setAttribute('aria-pressed', state.showZero ? 'true' : 'false');

    var keys = ['ground', 'air', 'naval'];
    if (others.length) keys.push('other');
    $('unit-groups').innerHTML = keys.map(function (k) {
      var cat = I.CATS[k];
      var all = (k === 'other' ? others : units.filter(function (u) { return u.cat === k; }))
        .sort(function (a, b) { return b.count - a.count || a.order - b.order || (a.name < b.name ? -1 : 1); });
      var active = all.filter(function (u) { return u.count > 0; });
      var zeros = all.length - active.length;
      var total = active.reduce(function (t, u) { return t + u.count; }, 0);
      var meta = k === 'other' ? plural(active.length, 'unrecognised type', 'unrecognised types')
        : active.length + ' of ' + all.length + ' types hit' + (zeros ? ' · ' + zeros + ' untouched' : '');
      var shown = state.showZero ? all : active;
      return '<div class="group"><div class="group-head">' +
        '<span class="group-swatch" style="background:' + cat.color + '"></span>' +
        '<span class="group-label">' + esc(cat.label) + '</span>' +
        '<span class="group-total">' + total + '</span>' +
        '<span class="group-rule"></span>' +
        '<span class="group-meta">' + esc(meta) + '</span></div>' +
        (shown.length ? '<div class="unit-grid">' + shown.map(unitCard).join('') + '</div>' : '') +
        '</div>';
    }).join('');
  }

  function unitCard(u) {
    if (u.count === 0) {
      return '<div class="unit untouched"><div class="well">' + icon(u.name, 48, { muted: true }) + '</div>' +
        '<div class="unit-body"><div class="unit-name">' + esc(u.name) + '</div>' +
        '<div class="unit-count-row"><span class="unit-count">0</span>' + chip('+0', 'zero', 'sm') + '</div></div></div>';
    }
    return '<div class="card unit"><div class="well" style="background:' + catOf(u.name).soft + '">' + icon(u.name, 48) + '</div>' +
      '<div class="unit-body"><div class="unit-name">' + esc(u.name) + '</div>' +
      '<div class="unit-count-row"><span class="unit-count">' + u.count + '</span>' + deltaChip(u.delta, 'sm') + '</div></div></div>';
  }

  // ---------- Chart ----------

  var chart = null; // { days, cums, maxK, cumMax }

  function renderChart(s) {
    var days = s.perDay;
    $('legend').innerHTML =
      '<span><span class="legend-bar"></span>Per day</span>' +
      '<span><span class="legend-line"></span>Cumulative</span>' +
      (LIVE ? '<span><span class="legend-live live-fill"></span>Day ' + LATEST + ' so far</span>' : '');
    if (!days.length) { chart = null; $('chart').innerHTML = '<p class="empty-note">No battle reports yet.</p>'; return; }

    var maxK = Math.max(1, Math.max.apply(null, days.map(function (d) { return d.total; })));
    var cum = 0;
    var cums = days.map(function (d) { return (cum += d.total); });
    var cumMax = Math.max(1, cum);
    var cap = days.length <= 7 ? 72 : 56;
    chart = { days: days, cums: cums, maxK: maxK, cumMax: cumMax, cap: cap };

    var bars = days.map(function (d, i) {
      var live = LIVE && d.day === LATEST;
      var title = 'Day ' + d.day + ': ' + d.total + ' destroyed, ' + cums[i] + ' total' + (live ? ' (in progress)' : '');
      return '<div class="bar-track" title="' + esc(title) + '" style="max-width:' + cap + 'px">' +
        '<div class="bar' + (live ? ' live' : '') + '" style="height:' + Math.round(d.total / maxK * 100) + '%"></div></div>';
    }).join('');
    var labels = days.map(function (d) {
      return '<div class="x-label" style="max-width:' + cap + 'px">D' + d.day + '</div>';
    }).join('');

    $('chart').innerHTML =
      '<div class="chart-grid">' +
        '<div class="axis left"><span class="top">' + maxK + '</span><span class="mid">' + Math.round(maxK / 2) + '</span><span class="bottom">0</span></div>' +
        '<div class="plot" id="plot">' +
          '<div class="gridline" style="top:0"></div><div class="gridline" style="top:50%"></div>' +
          '<div class="bars" id="bars">' + bars + '</div>' +
          '<svg id="line" preserveAspectRatio="none" aria-hidden="true"><polyline fill="none" stroke="oklch(0.2 0.01 60)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" vector-effect="non-scaling-stroke"></polyline></svg>' +
          '<div id="dots"></div>' +
        '</div>' +
        '<div class="axis right"><span class="top">' + cumMax + '</span><span class="bottom">0</span></div>' +
      '</div>' +
      '<div class="chart-grid"><span></span><div class="x-labels" id="x-labels">' + labels + '</div><span></span></div>';

    layoutChart();
    observePlot();
  }

  // Positions the cumulative line, dots and x labels from the plot's pixel width.
  function layoutChart() {
    var plot = $('plot');
    if (!chart || !plot) return;
    var n = chart.days.length, plotW = plot.clientWidth, plotH = 220;
    var gap = Math.min(6, Math.max(1, Math.floor(plotW / n * 0.2)));
    var trackW = Math.min(chart.cap, Math.max(0, (plotW - (n - 1) * gap) / n));
    var cx = function (i) { return i * (trackW + gap) + trackW / 2; };

    $('bars').style.gap = gap + 'px';
    $('x-labels').style.gap = gap + 'px';

    var svg = $('line');
    svg.setAttribute('viewBox', '0 0 ' + Math.max(1, plotW) + ' ' + plotH);
    svg.firstChild.setAttribute('points', chart.cums.map(function (c, i) {
      return cx(i).toFixed(1) + ',' + (plotH - c / chart.cumMax * plotH).toFixed(1);
    }).join(' '));
    // Dots shrink when days get dense so they don't merge into a solid line.
    var dot = Math.max(5, Math.min(10, Math.round(trackW + gap - 2)));
    var dotStyle = dot < 10 ? 'width:' + dot + 'px;height:' + dot + 'px;border-width:' + (dot < 7 ? 1.5 : 2) + 'px;' : '';
    $('dots').innerHTML = chart.cums.map(function (c, i) {
      return '<div class="dot" style="' + dotStyle + 'left:' + cx(i).toFixed(1) + 'px;bottom:' + (c / chart.cumMax * 100) + '%"></div>';
    }).join('');

    // Thin out x labels so they never collide: first and last always, then round day numbers.
    var maxLen = Math.max.apply(null, chart.days.map(function (d) { return String(d.day).length + 1; }));
    var minGap = maxLen * 7 + 8;
    var pitch = trackW + gap;
    var step = [1, 2, 5, 10, 20, 50, 100].find(function (k) { return k * pitch >= minGap; }) || 100;
    var order = [0, n - 1];
    chart.days.forEach(function (d, i) { if (i !== 0 && i !== n - 1 && d.day % step === 0) order.push(i); });
    var shown = [];
    order.forEach(function (i) {
      if (shown.indexOf(i) >= 0) return;
      if (shown.every(function (j) { return Math.abs(i - j) * pitch >= minGap; })) shown.push(i);
    });
    var labels = $('x-labels').children;
    for (var i = 0; i < labels.length; i++) labels[i].style.visibility = shown.indexOf(i) >= 0 ? 'visible' : 'hidden';
  }

  var ro = null;
  function observePlot() {
    if (!window.ResizeObserver) return;
    if (ro) ro.disconnect();
    ro = new ResizeObserver(function () { layoutChart(); });
    ro.observe($('plot'));
  }
  if (!window.ResizeObserver) window.addEventListener('resize', layoutChart);

  // ---------- Divisions ----------

  function renderDivisions(s) {
    var list = s.divisions;
    if (!list.length) { $('divisions').innerHTML = '<p class="empty-note">No divisions hit yet.</p>'; return; }
    var max = list[0].total || 1;
    var multi = ALL.nations.length > 1 && !state.nation;
    var shown = state.showAllDivisions ? list : list.slice(0, DIV_LIMIT);
    var html = shown.map(function (d, i) {
      var units = d.units.map(function (pair) {
        var label = pair[1] + ' ' + pair[0];
        return '<span class="div-unit" title="' + esc(label) + '">' + icon(pair[0], 20, { alt: true }) + '<span>' + pair[1] + '</span></span>';
      }).join('');
      return '<div class="div-row">' +
        '<span class="div-rank">' + String(i + 1).padStart(2, '0') + '</span>' +
        '<span class="div-name">' + esc(d.name) + (multi ? ' <span class="nation-tag">· ' + esc(d.nation) + '</span>' : '') + '</span>' +
        '<span class="div-total">' + (d.delta > 0 ? chip('+' + d.delta, '', 'xs') : '') + d.total + '</span>' +
        '<span></span>' +
        '<div class="div-bar"><div style="width:' + Math.round(d.total / max * 100) + '%"></div></div>' +
        '<div class="div-units">' + units + '</div>' +
        '</div>';
    }).join('');
    if (list.length > DIV_LIMIT) {
      html += '<div class="div-more"><button type="button" class="toggle" id="div-toggle">' +
        (state.showAllDivisions ? 'Show top ' + DIV_LIMIT : 'Show all ' + list.length + ' divisions') + '</button></div>';
    }
    $('divisions').innerHTML = html;
  }

  // ---------- Daily log ----------

  function renderLog(s) {
    var multi = ALL.nations.length > 1 && !state.nation;
    var days = s.perDay.filter(function (d) { return d.events.length; }).slice().reverse();
    if (!days.length) { $('log').innerHTML = '<p class="empty-note">No engagements logged yet.</p>'; return; }
    $('log').innerHTML = days.map(function (d) {
      var open = !!state.open[d.day];
      var meta = plural(d.engagements, 'engagement', 'engagements') + ' logged' + (LIVE && d.day === LATEST ? ' · in progress' : '');
      var events = d.events.map(function (e) {
        var units = e.units.map(function (u) {
          return '<span class="event-unit">' + icon(u.name, 20) + '<span><b>' + u.count + '</b> ' + esc(u.name) + '</span></span>';
        }).join('');
        return '<div class="event"><span class="event-time">' + esc(e.time) + '</span>' +
          '<div class="event-body"><span class="event-div">' + esc(e.division) +
          (e.ship ? ' <span class="nick">“' + esc(e.ship) + '”</span>' : '') +
          (multi ? ' <span class="nick">· ' + esc(e.nation) + '</span>' : '') + '</span>' +
          '<div class="event-units">' + units +
          (e.location ? '<span class="event-where">over the ' + esc(e.location) + '</span>' : '') +
          '</div></div></div>';
      }).join('');
      return '<div class="log-day">' +
        '<button type="button" class="log-head" data-day="' + d.day + '" aria-expanded="' + open + '" aria-controls="log-' + d.day + '">' +
          '<span class="log-day-label">Day ' + d.day + '</span>' +
          '<span class="log-meta">' + esc(meta) + '</span>' +
          '<span class="log-spacer"></span>' +
          '<span class="log-total">+' + d.total + '</span>' +
          '<span class="log-chevron" aria-hidden="true">' + (open ? '▲' : '▼') + '</span>' +
        '</button>' +
        '<div class="log-events" id="log-' + d.day + '"' + (open ? '' : ' hidden') + '>' + events + '</div>' +
        '</div>';
    }).join('');
  }

  // ---------- Unparsed lines ----------

  function renderUnparsed() {
    var box = $('unparsed');
    var lines = parsed.unparsed;
    box.hidden = !lines.length;
    if (!lines.length) { box.innerHTML = ''; return; }
    box.open = true;
    box.innerHTML = '<summary>' + plural(lines.length, 'unparsed line', 'unparsed lines') + ' · not counted</summary><ul>' +
      lines.map(function (l) { return '<li><span>Day ' + l.day + '</span>' + esc(l.line) + '</li>'; }).join('') + '</ul>';
  }

  // ---------- Wiring ----------

  function render() {
    var s = state.nation ? P.summarize(parsed, state.nation, ROSTER) : ALL;
    renderHeader();
    renderTabs();
    renderHero(s);
    renderUnits(s);
    renderChart(s);
    renderDivisions(s);
    renderLog(s);
    renderUnparsed();
  }

  $('tabs').addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-tab]');
    if (!b) return;
    var id = b.getAttribute('data-tab');
    if (id) location.hash = id;
    else if (location.hash) {
      try { history.pushState(null, '', location.pathname + location.search); } catch (e) { location.hash = ''; }
    }
    readHash();
    render();
  });
  window.addEventListener('hashchange', function () { readHash(); render(); });
  window.addEventListener('popstate', function () { readHash(); render(); });

  $('zero-toggle').addEventListener('click', function () {
    state.showZero = !state.showZero;
    renderUnits(state.nation ? P.summarize(parsed, state.nation, ROSTER) : ALL);
  });

  $('divisions').addEventListener('click', function (ev) {
    if (!ev.target.closest('#div-toggle')) return;
    state.showAllDivisions = !state.showAllDivisions;
    renderDivisions(state.nation ? P.summarize(parsed, state.nation, ROSTER) : ALL);
  });

  $('log').addEventListener('click', function (ev) {
    var b = ev.target.closest('.log-head');
    if (!b) return;
    var day = b.getAttribute('data-day');
    var open = !state.open[day];
    state.open[day] = open;
    b.setAttribute('aria-expanded', String(open));
    b.querySelector('.log-chevron').textContent = open ? '▲' : '▼';
    $('log-' + day).hidden = !open;
  });

  // Absolute link-preview URLs for scrapers that run JS (the build also rewrites them statically).
  if (typeof SITE_URL === 'string' && SITE_URL && SITE_URL.indexOf('YOUR-SITE') < 0) {
    var base = SITE_URL.replace(/\/+$/, '');
    [['meta[property="og:url"]', base + '/'], ['meta[property="og:image"]', base + '/og-image.png'], ['meta[name="twitter:image"]', base + '/og-image.png']]
      .forEach(function (m) { var el = document.querySelector(m[0]); if (el) el.setAttribute('content', m[1]); });
  }

  readHash();
  render();
  setInterval(renderUpdated, 60000);

  // Console summary.
  console.log('[Casualty Report] ' + ALL.perDay.map(function (d) { return 'Day ' + d.day + ': ' + d.total; }).join(', ') +
    ' | cumulative: ' + ALL.total + ' | unparsed lines: ' + parsed.unparsed.length);
})();
