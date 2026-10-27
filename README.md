# Casualty Report

Live site: <https://casualties.99helpers.site>

## How to update the site

Everything happens on github.com. Nothing to install.

1. Open [`data.js`](data.js) and click the **pencil** icon (Edit this file).
2. Find today's day number, for example ``10: ` ``, and **replace everything between its two backticks** with the full log copied from the game.
   - New day? Copy the last block, change the number, and paste the new log inside.
   - Set `liveDay` at the top to today's day number (or `null` once the day is over).
3. Click **Commit changes…**, then **Propose changes**, then **Create pull request**.
4. Wait for the green tick ✅ (about 20 seconds), then click **Merge pull request** → **Confirm merge**.

The site updates about a minute later. That's it.

### Three rules

- **Replace the whole day, don't add to it.** Paste the full latest log every time; adding lines on top counts them twice.
- **Keep the backticks** (`` ` ``) around each day and the **comma** after each block.
- **Red cross ❌ instead of a green tick?** Something in the file is off (often `liveDay` is a day that isn't in the list). Click **Details** to see what, fix it in the same pull request, and the check runs again.

## Example

```js
window.CASUALTY_DATA = {
  liveDay: 10,
  updatedAt: "",
  days: {
    9: `
10:48 am The 29th Battleship Flotilla (North Brazil) "Zaraza" lost: 1 Cruiser
...
`,
    10: `
1:42 pm The 23rd SP Anti Air Brigade (North Brazil) lost: 1 SP Anti Air
`
  }
};
```

## More

- [Data format and parsing rules](docs/data-format.md)
- [Deployment, workflows and repo settings](docs/deployment.md)
- [Development: building, tests, files](docs/development.md)
