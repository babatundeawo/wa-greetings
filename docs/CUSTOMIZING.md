# Customizing

Everything here can be edited on github.com. Open the file, click the **pencil icon** (Edit this file), make the change, then click **Commit changes**. Changes on `main` publish automatically within a couple of minutes. To try a change first, choose **Create a new branch for this commit and start a pull request** instead.

After a change goes live, the app updates the next time you open it. If you still see the old version, close the app fully and open it again.

## Colors

File: `css/tokens.css`

- The light palette is at the top, inside `:root { ... }`. Change the hex codes (for example `--primary: #3a3fb8;`).
- Dark theme colors are in two places: the `@media (prefers-color-scheme: dark)` block and the `:root[data-theme="dark"]` block. Keep both in step.
- `--primary` is the main brand color, `--accent` is the marigold used sparingly, and `--send` is the green on the Send button.
- Keep text readable: dark text on light backgrounds and the reverse. Test any new pair at webaim.org/resources/contrastchecker (aim for 4.5 or higher).

## Text on screen

File: `index.html`. Search for the words you want to change (press **Ctrl+F** or **Cmd+F** in the editor). Only change the words between `>` and `<`, not the tags around them.

## The greetings

File: `js/messages.js`

| What | Where in the file |
| --- | --- |
| Opening phrases (`Good {timeOfDay}.`) | `OPENERS` |
| Closing emoji | `CLOSERS` |
| Weekday lines and verses | `THEMES`, numbered 0 (Sunday) to 6 (Saturday) |
| "New month" lines and verses | `NEW_MONTH_THEME` (use `{month}` for the month name) |
| Theme names shown on screen | `THEME_NAMES` |

`{timeOfDay}` becomes morning, afternoon or evening. Keep every entry inside quotes and followed by a comma. Adding more entries to any list makes the messages more varied.

## How many contacts show at once

File: `js/app.js`, near the top: `DEFAULT_VISIBLE` (starts at 20) and `LOAD_MORE_OPTIONS` (the "+10 more" style buttons).

## Logo and icons

Folder: `icons/`. Replace a file by opening the folder, choosing **Add file > Upload files**, and uploading a new file with **the same name**.

| File | Size |
| --- | --- |
| `icon.svg` | Any size (vector logo, also the browser tab icon) |
| `icon-192.png`, `icon-512.png` | 192 and 512 pixels square |
| `icon-maskable-512.png` | 512 pixels square, with the logo inside the central 60% so phones can crop it |
| `apple-touch-icon.png` | 180 pixels square, no transparent areas |
| `favicon-32.png` | 32 pixels square |

## Fonts

Fonts are files in `fonts/` and are set up at the top of `css/tokens.css` (`@font-face`) and in `--font-display` and `--font-body`. To swap a font, upload a free-to-use `.woff2` file to `fonts/`, point `src: url(...)` at it, and keep the font's license file next to it. Update the credit in the README.

## Spacing, corners and motion

Also in `css/tokens.css`: `--space-*`, `--radius-*`, `--shadow-*` and the motion timings `--dur-*`. Animations switch off automatically for people who ask their device to reduce motion.
