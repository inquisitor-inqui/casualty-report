// Run with: node tests/parse.test.js  (no dependencies)
'use strict';
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.join(__dirname, '..');
const { parseCasualtyData, summarize, parseLine } = require(path.join(root, 'parse.js'));
const { UNITS } = require(path.join(root, 'icons.js'));

// Data files are browser scripts that assign window.CASUALTY_DATA.
function loadData(file) {
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
  return sandbox.window.CASUALTY_DATA;
}

let passed = 0, failed = 0;
function test(name, fn) {
  try { fn(); passed++; console.log('  ok   ' + name); }
  catch (e) { failed++; console.log('  FAIL ' + name + '\n       ' + e.message); }
}

// Capture console.warn so expected warnings don't clutter output.
function quietly(fn) {
  const warns = [], orig = console.warn;
  console.warn = (...a) => warns.push(a.join(' '));
  try { return { result: fn(), warns }; } finally { console.warn = orig; }
}

// Exact numbers are checked against a frozen fixture, never against data.js,
// which changes every day.
const data = loadData(path.join(__dirname, 'fixtures', 'sample-data.js'));
const parsed = parseCasualtyData(data);
const s = summarize(parsed);
const day = (n) => s.perDay.find((d) => d.day === n);
const div = (name) => s.divisions.find((d) => d.name === name);
const divUnits = (name) => Object.fromEntries(div(name).units);

console.log('fixture (tests/fixtures/sample-data.js)');

test('liveDay is 9', () => assert.strictEqual(data.liveDay, 9));
test('Day 8 total = 10', () => assert.strictEqual(day(8).total, 10));
test('Day 9 total = 41', () => assert.strictEqual(day(9).total, 41));
test('cumulative = 51', () => assert.strictEqual(s.total, 51));
test('days tracked = 2', () => assert.strictEqual(s.daysTracked, 2));
test('divisions with losses = 17', () => assert.strictEqual(s.divisionsHit, 17));
test('all 10 Day-9 divisions are first-time hits', () => assert.strictEqual(s.newDivisionsLatest, 10));
test('unparsed lines = 0', () => assert.deepStrictEqual(parsed.unparsed, []));
test('no unknown units', () => assert.deepStrictEqual(parsed.unknownUnits, []));

const expected = {
  'Anti Air': [7, 7], 'Light Tank': [7, 6], 'Medium Tank': [7, 5], 'Motorized Infantry': [6, 2],
  'Battleship': [5, 5], 'Infantry': [4, 4], 'Submarine': [4, 4], 'Destroyer': [3, 3],
  'Armored Car': [3, 2], 'Cruiser': [1, 1], 'Rocket Artillery': [1, 1], 'Strategic Bomber': [1, 1],
  'Aircraft Carrier': [1, 0], 'Naval Bomber': [1, 0],
};
test('unit totals and Day 9 deltas', () => {
  for (const u of UNITS) {
    const got = s.units.get(u.name);
    const [total, delta] = expected[u.name] || [0, 0];
    assert.strictEqual(got ? got.total : 0, total, u.name + ' total');
    assert.strictEqual(got ? got.delta : 0, delta, u.name + ' delta');
  }
});

// NOTE: the spec listed 23rd Rocket Artillery Division = 11 and 6th Battleship
// Flotilla = 5. The pasted log gives 10 (the spec's own breakdown sums to 10)
// and 6 (D1+S1, S1, B1+S1, B1). Per-division totals must sum to Day 9's 41.
test('23rd Rocket Artillery Division = 10 with breakdown', () => {
  assert.strictEqual(div('23rd Rocket Artillery Division').total, 10);
  assert.deepStrictEqual(divUnits('23rd Rocket Artillery Division'), {
    'Infantry': 3, 'Anti Air': 1, 'Rocket Artillery': 1, 'Motorized Infantry': 1,
    'Light Tank': 1, 'Armored Car': 1, 'Medium Tank': 2,
  });
});
test('30th Mot. Infantry Division = 9', () => assert.strictEqual(div('30th Mot. Infantry Division').total, 9));
test('39th Medium Tank Division = 5', () => assert.strictEqual(div('39th Medium Tank Division').total, 5));
test('6th Battleship Flotilla = 6', () => assert.strictEqual(div('6th Battleship Flotilla').total, 6));
test('46th Battle Group = 1 Battleship', () => assert.deepStrictEqual(divUnits('46th Battle Group'), { 'Battleship': 1 }));
test('Day 9 division totals sum to 41', () => {
  const sum = s.divisions.filter((d) => d.firstDay === 9).reduce((a, d) => a + d.total, 0);
  assert.strictEqual(sum, 41);
});
test('divisions ranked by total, descending', () => {
  for (let i = 1; i < s.divisions.length; i++) assert.ok(s.divisions[i - 1].total >= s.divisions[i].total);
  assert.strictEqual(s.divisions[0].name, '23rd Rocket Artillery Division');
});
test('leading "The" dropped from division names', () => {
  assert.ok(parsed.events.every((e) => !/^the\s/i.test(e.division)));
});

test('Naval Bomber line parses with location "Pacific Ocean"', () => {
  const e = parsed.events.find((x) => x.units[0].name === 'Naval Bomber');
  assert.ok(e, 'event found');
  assert.strictEqual(e.location, 'Pacific Ocean');
  assert.strictEqual(e.division, '26th Naval Bomber Squadron');
  assert.strictEqual(e.total, 1);
});
test('ship names parse: Zaraza, Jaru, Igarassu', () => {
  const ships = new Set(parsed.events.map((e) => e.ship).filter(Boolean));
  assert.deepStrictEqual(Array.from(ships), ['Zaraza', 'Jaru', 'Igarassu']);
  const z = parsed.events.find((e) => e.ship === 'Zaraza');
  assert.strictEqual(z.division, '29th Battleship Flotilla');
  assert.strictEqual(z.nation, 'North Brazil');
});
test('last Day 8 event is the 8:49 am one (pasted order kept)', () => {
  const d8 = parsed.days.find((d) => d.day === 8).events;
  assert.strictEqual(d8[d8.length - 1].time, '8:49 am');
  assert.strictEqual(d8[d8.length - 1].division, '75th Mot. Infantry Regiment');
});
test('engagements per day = lines', () => {
  assert.strictEqual(day(8).engagements, 9);
  assert.strictEqual(day(9).engagements, 32);
});
test('one nation: North Brazil 51', () => assert.deepStrictEqual(s.nations, [{ name: 'North Brazil', total: 51 }]));

console.log('synthetic');

test('unknown unit counts and goes to Other', () => {
  const { result: p, warns } = quietly(() => parseCasualtyData({ days: { 1: '9:00 am The 1st Weird Brigade (North Brazil) lost: 3 Laser Tanks' } }));
  assert.strictEqual(p.unparsed.length, 0);
  assert.strictEqual(p.events[0].total, 3);
  assert.strictEqual(p.events[0].units[0].known, false);
  assert.deepStrictEqual(p.unknownUnits, ['Laser Tanks']);
  assert.strictEqual(warns.length, 1);
  assert.strictEqual(summarize(p).total, 3);
});
test('garbage line goes to unparsed and is excluded from stats', () => {
  const p = parseCasualtyData({ days: { 1: '\n  asdf qwer zxcv  \n9:00 am The 1st Rifle Division (North Brazil) lost: 2 Infantry\n' } });
  assert.strictEqual(p.unparsed.length, 1);
  assert.strictEqual(p.unparsed[0].line, 'asdf qwer zxcv');
  assert.strictEqual(summarize(p).total, 2);
});
test('second nation creates a second tab with its own totals', () => {
  const p = parseCasualtyData({ days: {
    1: '9:00 am The 1st Rifle Division (North Brazil) lost: 2 Infantry\n9:05 am The 2nd Panzer Division (South Peru) lost: 1 Heavy Tank, 2 Light Tanks',
  } });
  const all = summarize(p);
  assert.deepStrictEqual(all.nations.map((n) => n.name), ['North Brazil', 'South Peru']);
  assert.strictEqual(all.total, 5);
  const peru = summarize(p, 'South Peru');
  assert.strictEqual(peru.total, 3);
  assert.strictEqual(peru.units.get('Light Tank').total, 2);
  assert.strictEqual(peru.divisionsHit, 1);
});
test('plural "s", case-insensitive names, trailing period, stray whitespace', () => {
  const e = parseLine('   1:05 PM   The 3rd Tank Brigade (North Brazil)   lost:  2 light tanks ,  1 ANTI AIR.  ');
  assert.ok(e);
  assert.deepStrictEqual(e.units.map((u) => [u.name, u.count, u.known]), [['Light Tank', 2, true], ['Anti Air', 1, true]]);
  assert.strictEqual(e.division, '3rd Tank Brigade');
});
test('identical lines are not de-duplicated', () => {
  const line = '9:00 am The 1st Rifle Division (North Brazil) lost: 1 Infantry';
  const p = parseCasualtyData({ days: { 1: line + '\n' + line } });
  assert.strictEqual(summarize(p).total, 2);
});
test('day keys are sorted numerically, events never sorted by time', () => {
  const p = parseCasualtyData({ days: {
    10: '11:00 pm The A Division (X) lost: 1 Infantry\n1:00 am The B Division (X) lost: 1 Infantry',
    9: '9:00 am The C Division (X) lost: 1 Infantry',
  } });
  assert.deepStrictEqual(p.days.map((d) => d.day), [9, 10]);
  assert.deepStrictEqual(p.days[1].events.map((e) => e.division), ['A Division', 'B Division']);
});

// data.js: only checks that hold for any data you paste. Unparsed lines don't
// fail the build (the page lists them); they're printed so you can spot them.
console.log('data.js (sanity checks only)');

let live = null;
test('data.js loads and defines CASUALTY_DATA.days', () => {
  live = loadData(path.join(root, 'data.js'));
  assert.ok(live && typeof live === 'object', 'window.CASUALTY_DATA is missing');
  assert.ok(live.days && typeof live.days === 'object', 'days is missing');
});
if (live && live.days) {
  const lp = quietly(() => parseCasualtyData(live)).result;
  const ls = summarize(lp);
  test('day keys are whole numbers', () => {
    for (const k of Object.keys(live.days)) assert.ok(/^\d+$/.test(k), 'bad day key: ' + k);
  });
  test('liveDay is null or one of the days', () => {
    const days = lp.days.map((d) => d.day);
    assert.ok(live.liveDay == null || days.includes(Number(live.liveDay)),
      'liveDay ' + live.liveDay + ' is not one of the days (' + days.join(', ') + ')');
  });
  test('updatedAt is empty or a valid date', () => {
    assert.ok(!live.updatedAt || !isNaN(new Date(live.updatedAt).getTime()), 'bad updatedAt: ' + live.updatedAt);
  });
  test('totals agree across days, units, divisions and nations', () => {
    let units = 0;
    ls.units.forEach((u) => { units += u.total; });
    assert.strictEqual(units, ls.total, 'unit totals');
    assert.strictEqual(ls.divisions.reduce((a, d) => a + d.total, 0), ls.total, 'division totals');
    assert.strictEqual(ls.nations.reduce((a, n) => a + n.total, 0), ls.total, 'nation totals');
  });
  console.log('       ' + ls.perDay.map((d) => 'Day ' + d.day + ': ' + d.total).join(', ') + ' | cumulative: ' + ls.total);
  if (lp.unknownUnits.length) console.log('  note unrecognised units, counted under Other: ' + lp.unknownUnits.join(', '));
  if (lp.unparsed.length) {
    console.log('  note ' + lp.unparsed.length + ' unparsed line(s), not counted:');
    for (const u of lp.unparsed) console.log('         Day ' + u.day + ': ' + u.line);
  }
}

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
