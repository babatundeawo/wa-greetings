# Customizing

You can do all of this from the GitHub website: open a file, click the pencil icon, edit, then **Commit changes**. Wait about two minutes for the site to rebuild. After each change, open the site on your phone: you will see a **Refresh** bar. Tap it.

## Change the greeting wording

Open `src/messages.js`. Each weekday has a list of reflections and prayers. Add a new one by copying a line inside the same square brackets, changing the words between the quote marks, and keeping the comma at the end. Each line sits between double quote marks ("like this"). Do not type a double quote mark inside the words; apostrophes are fine.

Special words you can use inside a message: `{tod}` becomes morning, afternoon or evening; `{wish}` becomes the day's greeting (for example "Happy Monday"); `{month}` becomes the month name.

## Change colours

Open `src/styles/tokens.css`. The two main colours are `--primary` (indigo) and `--accent` (marigold), once in the light block at the top and once in each dark block further down. If you change a colour, change it in all three places and check that text is still easy to read.

## Change the name

Search for "Daily Greetings" in `src/index.html`, `src/404.html`, `src/offline.html` and `public/manifest.webmanifest`, and edit each one.

## Stay signed in on your phone (optional)

By design the app signs you out whenever it closes. To remember sign-in instead, open `src/firebase.js`, replace both `inMemoryPersistence` with `browserLocalPersistence`. Be aware that this stores a sign-in token on that device.

## Update your screenshots

Take new screenshots, name them `desktop.png` and `mobile.png`, and upload them into `public/screenshots/` (use made-up contacts). Keep the sizes written in `public/manifest.webmanifest` in step with the new images.
