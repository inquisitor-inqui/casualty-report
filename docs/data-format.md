# Data format (`data.js`)

`data.js` is the only file that changes day to day. Everything on the site is computed from it.

```js
window.CASUALTY_DATA = {
  liveDay: 10,       // the game day in progress, or null once it's final
  updatedAt: "",     // leave "" and the build stamps the current time
  days: {
    9: `
...Day 9 log, pasted unchanged...
`,
    10: `
...Day 10 log, pasted unchanged...
`
  }
};
```

## Rules

- **Paste the raw game log unchanged**, one block per game day, under the day number.
- **Updating a day that's still in progress: replace that day's whole block with the full latest log. Don't append.** Identical lines can be real events, so the site never de-duplicates them. Appending a fresh copy of the log would count everything twice.
- Game days roll over at about 14:30 IST. When a new day starts, add a new block and set `liveDay` to it.
- Set `liveDay: null` when the latest day is final.
- `liveDay` must be one of the day numbers in `days`; the tests fail otherwise.
- Keep the backticks (`` ` ``) around each block and the comma between blocks.

## What the parser understands

Each line is one engagement:

```
<time> The <division> (<nation>) lost: <n> <Unit>, <n> <Unit>, ...
<time> The <division> (<nation>) "<ship name>" lost: <n> <Unit>
<time> The <division> (<nation>) lost <n> <Unit> over the <place>.
```

- The leading "The" is dropped from division names; names with periods ("30th Mot. Infantry Division") are fine.
- Unit names match the 34-unit roster case-insensitively, with or without a plural "s".
- Nations come from the parentheses, so several enemy nations each get their own tab.
- Events keep the order they were pasted in. They're never sorted by clock time, because game days don't line up with midnight.
- Blank lines and stray whitespace are ignored.

## When something doesn't fit

- **Unknown unit name:** still counted. It appears under "Other" with a generic icon, and the browser console shows a warning.
- **Line that can't be read at all:** not counted. It's listed in a small "unparsed lines" box at the bottom of the page so you can fix it.

## Page rules worth knowing

- "Latest day" is the highest day number in `days`. "+N" chips are that day's own count.
- When `liveDay` equals the latest day, the header says "Day N in progress" with a pulsing dot, and the chart draws that day's bar striped.
