// Casualty log parser and stats. Pure functions, no DOM.
// Classic script: attaches window.CasualtyParse in the browser, module.exports in Node.
(function (root) {
  'use strict';

  // <time> The <division> (<nation>) ["ship"] lost[:] <units>[ over the <place>][.]
  const LINE_RE = /^(\d{1,2}:\d{2}(?::\d{2})?\s*(?:[ap]\.?\s?m\.?)?)\s+(?:the\s+)?(.+?)\s*\(([^()]+)\)\s*(?:"([^"]+)"|“([^”]+)”|'([^']+)')?\s*lost\s*(:?)\s*(.+?)$/i;
  const OVER_RE = /^(.+?)\s+over\s+(?:the\s+)?(.+?)$/i;
  const ITEM_RE = /^(\d+)\s*[x×]?\s+(.+)$/i;

  const norm = (s) => s.toLowerCase().replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const stripDot = (s) => s.replace(/[.\s]+$/, '');

  function defaultRoster() {
    if (root && root.CasualtyIcons) return root.CasualtyIcons.UNITS.map((u) => u.name);
    if (typeof require === 'function') return require('./icons.js').UNITS.map((u) => u.name);
    return [];
  }

  function makeMatcher(roster) {
    const byKey = new Map(roster.map((n) => [norm(n), n]));
    return function match(raw) {
      const k = norm(raw);
      if (byKey.has(k)) return byKey.get(k);
      if (k.endsWith('es') && byKey.has(k.slice(0, -2))) return byKey.get(k.slice(0, -2));
      if (k.endsWith('s') && byKey.has(k.slice(0, -1))) return byKey.get(k.slice(0, -1));
      return null;
    };
  }

  function parseUnits(text, match) {
    const units = [];
    for (const part of text.split(',')) {
      const p = stripDot(part.trim());
      if (!p) continue;
      const m = ITEM_RE.exec(p);
      if (!m) return null;
      const count = parseInt(m[1], 10);
      const raw = stripDot(m[2].trim());
      const known = match(raw);
      units.push({ name: known || raw, count, known: !!known });
    }
    return units.length ? units : null;
  }

  function parseLine(line, match) {
    const m = LINE_RE.exec(line);
    if (!m) return null;
    let rest = stripDot(m[8]);
    let location = '';
    if (!m[7]) {
      // No colon: "lost 1 Naval Bomber over the Pacific Ocean."
      const o = OVER_RE.exec(rest);
      if (o) { rest = o[1]; location = stripDot(o[2]); }
    } else {
      const o = OVER_RE.exec(rest);
      if (o && /^\d/.test(o[1])) { rest = o[1]; location = stripDot(o[2]); }
    }
    const units = parseUnits(rest, match);
    if (!units) return null;
    return {
      time: m[1].replace(/\s+/g, ' ').trim(),
      division: m[2].replace(/\s+/g, ' ').trim(),
      nation: m[3].replace(/\s+/g, ' ').trim(),
      ship: (m[4] || m[5] || m[6] || '').trim(),
      location,
      units,
      total: units.reduce((s, u) => s + u.count, 0),
    };
  }

  // Parse window.CASUALTY_DATA. Events keep pasted order within each day;
  // they are never sorted by clock time (game days don't align with midnight).
  function parseCasualtyData(data, roster) {
    const match = makeMatcher(roster || defaultRoster());
    const src = (data && data.days) || {};
    const dayNums = Object.keys(src).map(Number).filter((n) => Number.isFinite(n)).sort((a, b) => a - b);
    const days = [], events = [], unparsed = [], unknownUnits = [];
    for (const day of dayNums) {
      const block = src[day];
      const lines = typeof block === 'string' ? block.split(/\r?\n/) : [];
      const dayEvents = [];
      lines.forEach((rawLine, i) => {
        const line = rawLine.replace(/ /g, ' ').trim();
        if (!line) return;
        const ev = parseLine(line, match);
        if (!ev) { unparsed.push({ day, line, lineNo: i }); return; }
        ev.day = day;
        ev.index = dayEvents.length;
        ev.raw = line;
        for (const u of ev.units) if (!u.known && unknownUnits.indexOf(u.name) < 0) unknownUnits.push(u.name);
        dayEvents.push(ev);
        events.push(ev);
      });
      days.push({ day, events: dayEvents, total: dayEvents.reduce((s, e) => s + e.total, 0) });
    }
    if (unknownUnits.length && typeof console !== 'undefined') {
      console.warn('Casualty Report: unrecognised unit(s), shown under "Other": ' + unknownUnits.join(', '));
    }
    return { days, events, unparsed, unknownUnits, liveDay: data ? data.liveDay : null, updatedAt: (data && data.updatedAt) || '' };
  }

  // Aggregate stats, optionally for one nation. `roster` orders tie-breaks.
  function summarize(parsed, nation, roster) {
    roster = roster || defaultRoster();
    const order = new Map(roster.map((n, i) => [n, i]));
    const ord = (n) => (order.has(n) ? order.get(n) : 1000);
    const latestDay = parsed.days.length ? parsed.days[parsed.days.length - 1].day : null;
    const keep = (e) => !nation || e.nation === nation;

    const nations = [];
    for (const e of parsed.events) {
      let n = nations.find((x) => x.name === e.nation);
      if (!n) nations.push((n = { name: e.nation, total: 0 }));
      n.total += e.total;
    }

    const perDay = parsed.days.map((d) => {
      const evs = d.events.filter(keep);
      return { day: d.day, total: evs.reduce((s, e) => s + e.total, 0), engagements: evs.length, events: evs };
    });

    const units = new Map();   // name -> { name, known, total, delta }
    const divisions = new Map(); // nation|division -> {...}
    for (const e of parsed.events) {
      if (!keep(e)) continue;
      const isLatest = e.day === latestDay;
      const key = e.nation + '|' + e.division;
      let dv = divisions.get(key);
      if (!dv) divisions.set(key, (dv = { name: e.division, nation: e.nation, total: 0, delta: 0, firstDay: e.day, units: new Map() }));
      dv.total += e.total;
      if (isLatest) dv.delta += e.total;
      for (const u of e.units) {
        let x = units.get(u.name);
        if (!x) units.set(u.name, (x = { name: u.name, known: u.known, total: 0, delta: 0 }));
        x.total += u.count;
        if (isLatest) x.delta += u.count;
        dv.units.set(u.name, (dv.units.get(u.name) || 0) + u.count);
      }
    }

    // Stable sort: ties keep first-appearance order.
    const divList = Array.from(divisions.values())
      .map((d) => ({ ...d, units: Array.from(d.units.entries()).sort((a, b) => b[1] - a[1] || ord(a[0]) - ord(b[0])) }))
      .sort((a, b) => b.total - a.total);

    const total = perDay.reduce((s, d) => s + d.total, 0);
    const latest = perDay.length ? perDay[perDay.length - 1] : { day: null, total: 0, engagements: 0 };
    return {
      nations,
      latestDay,
      perDay,
      units,
      divisions: divList,
      total,
      latestTotal: latest.total,
      divisionsHit: divList.length,
      newDivisionsLatest: divList.filter((d) => d.firstDay === latestDay).length,
      daysTracked: parsed.days.length,
    };
  }

  const api = { parseCasualtyData, summarize, parseLine: (line, roster) => parseLine(String(line).replace(/ /g, ' ').trim(), makeMatcher(roster || defaultRoster())) };
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.CasualtyParse = api;
})(typeof window !== 'undefined' ? window : this);
