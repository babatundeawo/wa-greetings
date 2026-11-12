# Customizing

You can do all of this from the GitHub website: open a file, click the pencil icon, edit, then **Commit changes**. Wait about two minutes for the site to rebuild. After each change, open the site on your phone: you will see a **Refresh** bar. Tap it.

## Change the greeting wording

Open `src/messages.js`. Everything is a list of lines. Add a new one by copying a line inside the same square brackets, changing the words between the quote marks, and keeping the comma at the end. Each line sits between double quote marks ("like this"). Do not type a double quote mark inside the words; apostrophes are fine.

The lists, from the top of the file:

- `OPENERS`: how a message starts.
- `CHECKINS`, `SEASON_LINES`, `BRIDGES`: small optional extras.
- `AMENS`, `WELL_WISHES`, `CLOSERS`: how a message ends.
- `TIME_PRAYERS`: a prayer for the morning, afternoon or evening.
- `INVOCATIONS`, `PRAYER_REQUESTS`, `PRAYER_TAILS`: pieces the app joins into extra prayers. Each request must start with a verb (for example "keep us safe"), so it reads well after "Lord," and after "We ask You, Lord, to".
- `GENERAL_REFLECTIONS`: thoughts that fit any ordinary day.
- `THEMES`: each weekday's own reflections and prayers (0 is Sunday).
- `NEW_MONTH_THEME`: used on the 1st of every month.
- `SPECIALS`: Good Friday, Easter, New Year, Christmas and other special days. Their dates are in `FIXED_SPECIALS`; Easter is worked out automatically.

Special words you can use inside a message: `{tod}` becomes morning, afternoon or evening; `{wish}` becomes the day's greeting (for example "Happy Monday"); `{month}` becomes the month name.

## Read or edit a message before sending

Each contact card stays short. Tap the eye button to open the message, read it and change it. Tap Send on WhatsApp without opening it if you do not need to read it.

## Change colours

Open `src/styles/tokens.css`. The two main colours are `--primary` (indigo) and `--accent` (marigold), once in the light block at the top and once in each dark block further down. If you change a colour, change it in all three places and check that text is still easy to read.

## Change the name

Search for "Daily Greetings" in `src/index.html`, `src/404.html`, `src/offline.html` and `public/manifest.webmanifest`, and edit each one.

## Stay signed in on your phone (optional)

By design the app signs you out whenever it closes. To remember sign-in instead, open `src/firebase.js`, replace both `inMemoryPersistence` with `browserLocalPersistence`. Be aware that this stores a sign-in token on that device.

## Update your screenshots

Take new screenshots, name them `desktop.png` and `mobile.png`, and upload them into `public/screenshots/` (use made-up contacts). Keep the sizes written in `public/manifest.webmanifest` in step with the new images.
