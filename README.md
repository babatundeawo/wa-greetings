# Daily Greetings

A small installable web app (PWA) for sending WhatsApp greetings to your
contacts — as many as you want, whenever you want, with no daily cap.
Filter by Google Contacts label (RCCG, KBI Parents, Relatives, etc.) or
search by name, tick people off as you message them, and come back
whenever you like to pick up where you left off. Messages are elaborate
prayer-style greetings with a Bible verse (KJV), themed by day of the week
(and by new month on the 1st), and never use the recipient's name — so the
tone stays respectful whether they're older, younger, or someone you barely
know. Who's already been messaged is tracked in Firebase (Firestore), so it
auto-syncs across devices and survives re-uploading an updated contact
list. The app itself is locked behind a sign-in screen so random visitors
can't access it.

## How it works

- `contacts.json` holds your contacts — name, every phone number found for
  them, and their Google Contacts labels. The name is only shown to *you*
  in the app's list, never inserted into the message text itself.
- **No daily limit.** There's no "today's batch" any more — the list just
  shows contacts who are still **Pending**, and you work through as many as
  you want in one sitting. Running a "Load more" button repeatedly, or
  tapping "Show all", loads more of the list on demand — nothing is ever
  locked behind "come back tomorrow."
- **Filter by label**: the chips under the search box are pulled straight
  from your Google Contacts labels (RCCG, KBI Parents, Relatives, Businesses,
  etc. — whatever you've tagged people with), each showing how many
  contacts carry it. Tap one or more to only show people with at least one
  of the selected labels; tap "Clear label filters" to go back to
  everyone. The generic "myContacts" label every contact has is left out
  since it doesn't help filter anything.
- **Search by name** using the search box at the top — useful for jumping
  straight to one person instead of scrolling.
- **Four views** (tabs under the search box), each showing a live count:
  - **Pending** — not yet sent, not ignored (the default view).
  - **Sent** — already marked sent.
  - **Ignored** — permanently excluded (see below).
  - **All** — everyone, regardless of status.
- Each contact gets a personalized-by-day (not by name), editable greeting —
  a short prayer with a Bible verse reference — and a **Send on WhatsApp**
  button that opens WhatsApp with that contact's chat and the message
  already typed in. Browsers can't send WhatsApp messages automatically, so
  this one tap is as close as it gets.
- **Multiple phone numbers.** If someone has more than one number on file
  (common for shared family lines or multiple SIMs), every number is kept —
  none are silently dropped. The main **Send on WhatsApp** button uses
  their first/primary number; any other numbers appear underneath as
  "Other numbers on file" links using the same message, in case the
  primary one turns out not to be on WhatsApp. Sent/ignored status is
  tracked against the primary number only, so there's no risk of the same
  person getting double-greeted through a second number.
- Under each contact's message are two checkboxes: **Sent** and
  **Ignore (no WhatsApp / skip)**. Tick **Sent** for everyone you've
  messaged, tick **Ignore** for anyone who shouldn't be contacted at all,
  then tap the single **Save changes** button at the bottom once — this
  commits everything you've ticked in one go, rather than a round-trip per
  person.
- Ignored contacts are excluded permanently (not just today) until you
  switch to the **Ignored** tab and untick their box. They don't count
  toward the "pending" total either, and they're excluded from every other
  view.
- Greetings change with the day: Sunday carries a "new week" theme (the
  week is treated as starting on Sunday, not Monday), the other weekdays
  each carry their own theme (diligence, gratitude, grace, rest, etc.), and
  the 1st of every month switches to a "Happy New Month" prayer instead.
- **"Reset all 'sent' status"** (under the summary line) clears everyone's
  sent status so the whole pending list is available again — useful once
  you've worked all the way through everyone and want to start a fresh
  round. Ignored contacts stay ignored through a reset.
- The app only knows someone's "sent" because you ticked the box and
  saved — there's no way for it to detect an actual WhatsApp send, so if
  you send but forget to tick it, that person will show up again under
  Pending.
- You must sign in to see any of this — see "Login / access control" below.

## One-time setup

You'll do four things once: create a Firebase project, enable sign-in and
create your one login, host the app on GitHub Pages, and add a GitHub
secret so the sync script can talk to Firebase. All free at this scale.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and click **Add project**. Name it anything (e.g. `daily-greetings`).
   You can skip Google Analytics — not needed here.
2. Once created, in the left sidebar go to **Build → Firestore Database →
   Create database**. Choose **Start in production mode**, pick any
   location close to you, and create it.
3. Go to **Firestore Database → Rules** tab, delete what's there, and paste
   in the contents of `firestore.rules` from this folder, then **Publish**.
   This requires a signed-in user for any access to the rotation data, and
   blocks everything else in the database outright.
4. Go to **Project settings** (gear icon, top left) → **General** tab →
   scroll to "Your apps" → click the **`</>`** (web) icon to register a
   web app. Give it any nickname, no need for Firebase Hosting.
5. Firebase will show you a `firebaseConfig` object. Copy those values into
   `firebase-config.js` in this folder (it's fine that this file is public —
   these values identify your project, they aren't secret; your data is
   protected by the Firestore rules from step 3 and the login from step 2
   below instead).

### 2. Turn on sign-in and create your one account

This app has no sign-up page on purpose — there is exactly one account,
which you create yourself directly inside Firebase, not in any file in
this repo:

1. In Firebase, go to **Build → Authentication → Get started**.
2. Under **Sign-in method**, click **Email/Password**, toggle it **Enable**,
   and save.
3. Go to the **Users** tab (next to "Sign-in method") and click
   **Add user**.
4. Enter the email address you want to sign in with, and choose a password,
   directly in that form. Click **Add user**.

That's it — Firebase now stores that login securely on its own servers.
Nothing about it needs to be typed into any file in this project; the app
only ever asks Firebase "is this email/password combination valid?" and
shows or hides the app based on the answer. Use that same email and
password on the app's sign-in screen whenever you open it.

If you ever want to change the password, or add/remove who can sign in,
come back to this **Users** tab — there's no need to touch any code.

### 3. Generate a service account key (for the sync script)

This is separate from the login above — it's what lets the GitHub Action
talk to Firestore on your behalf when syncing a new CSV:

1. In Firebase, go to **Project settings → Service accounts**.
2. Click **Generate new private key** — this downloads a `.json` file.
   **Keep this file secret and never commit it to the repo.**
3. In your GitHub repo, go to **Settings → Secrets and variables →
   Actions → New repository secret**.
4. Name it `FIREBASE_SERVICE_ACCOUNT`, and paste the **entire contents**
   of the downloaded JSON file as the value. Save.

### 4. Push everything to GitHub and enable Pages

1. Create a GitHub repository (e.g. `daily-greetings`) and push every file
   in this folder to it, including the `.github/workflows/` folder,
   `data/contacts.csv`, `package.json`, and your filled-in
   `firebase-config.js`.
2. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from
   a branch", pick `main` and `/ (root)`, save.
3. After a minute or two your app is live at:
   `https://<your-username>.github.io/daily-greetings/`

### 5. Install it on your phone

Open the link above in your phone's browser.

**On Android (Chrome):** you should see an **"Install app"** option appear
either in the 3-dot menu, or as a small install icon in the address bar —
tap it, confirm, and it's added to your home screen and app drawer like any
other app, with its own icon. If you don't see the prompt right away, visit
the site once, then check the menu again — Chrome sometimes waits for a
first visit before offering it. (Other Android browsers like Samsung
Internet or Edge have an equivalent "Add page to" / "Install app" option in
their menu.)

**On iPhone (Safari):** tap the Share icon, scroll down, and tap
**"Add to Home Screen"** — iOS doesn't show an automatic install prompt the
way Android does.

Either way, it'll open like a normal app, showing the sign-in screen first.
Most phone browsers will offer to remember the password for you after the
first sign-in.

## Login / access control

- The app shows a sign-in screen before anything else. Only the single
  account you created in Firebase (Step 2 above) can get in — there's no
  public sign-up.
- Firestore itself also requires that same sign-in (`request.auth != null`
  in `firestore.rules`), so even someone who found your GitHub Pages URL
  and poked at the code couldn't read or write your rotation data without
  being signed in.
- There's a **Sign out** link in the top-right of the header once you're
  in, if you ever need it (e.g. before handing your phone to someone else).
- This repo and its public GitHub Pages URL do NOT contain your password
  anywhere — not in `firebase-config.js`, not anywhere else. It lives only
  in Firebase's own Authentication system.

## Updating the contact list

From now on, updating is fully automatic:

1. Export a fresh CSV from Google Contacts (or edit the existing one).
2. Replace `data/contacts.csv` in the GitHub repo with the new file
   (via the GitHub web UI's "upload file", or `git add`/`commit`/`push`).
3. That's it. Pushing a change to `data/contacts.csv` triggers the
   **Sync contacts from CSV** GitHub Action automatically, which:
   - Re-parses the CSV into `contacts.json` — extracting every phone
     number per person (not just the first one) and their Google Contacts
     labels.
   - Reads Firestore to see who's already been messaged, and who's been
     marked "Ignore" in the app.
   - Writes `pending.json`, `sent.json`, and `ignored.json` for your own
     reference.
   - Commits all four files back to the repo — GitHub Pages redeploys on
     its own shortly after.
4. Reopen the app — no other steps needed.

**Why nobody gets double-messaged after an update:** the app never decides
"who's sent" from the CSV or from list position — that always comes from
Firestore, matched by each contact's primary phone number. So:

- Anyone already marked sent in Firestore stays skipped, regardless of
  where they now sit in the file or how many contacts you have.
- New contacts (new primary phone numbers) automatically join Pending.
- If someone's removed from the CSV, they just vanish — no gap.
- If a contact's primary number itself changes, that counts as a new
  contact (matching is strictly by that number), so it'll show as pending
  again under the new number.
- Extra numbers for an existing contact (second, third phone columns) can
  change freely between syncs without affecting their sent/ignored status,
  since only the primary number is tracked.

You can check `pending.json` / `sent.json` / `ignored.json` any time after a
sync to see exactly who's left, who's done, and who's excluded — they're
generated for your own visibility, but the live app doesn't depend on them;
it talks to Firestore directly.

### If you want to run the sync manually instead

You don't normally need to — the GitHub Action handles it — but if you ever
want to test it locally:

```bash
npm install
export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/your/serviceAccountKey.json)"
node scripts/sync-contacts.js
```

## Customizing greetings

Open `app.js` and edit:

- `WEEKDAY_TEMPLATES` — the day-of-week themed messages (keyed 0 = Sunday
  through 6 = Saturday).
- `NEW_MONTH_TEMPLATES` — used only on the 1st of each month.

`{timeOfDay}` becomes "morning", "afternoon", or "evening"; `{month}` becomes
the current month's name. There's deliberately no `{name}` placeholder —
messages are written to read naturally without addressing anyone by name.
Each contact gets a message picked based on their phone number and the
date, so it varies from person to person and day to day without needing
you to track anything. Bible verses used are King James Version (public
domain) wording, cited by reference — feel free to swap in different verses
or wording of your own.

You can also change `DEFAULT_VISIBLE` (how many contacts show up before you
need to tap "Load more" — 20 by default) and `LOAD_MORE_OPTIONS` (the quick
"+N more" buttons offered — 10/20/50/100 by default) near the top of
`app.js` if you want different defaults.

## A note on very large loads

Tapping "Show all" on a big filtered list (hundreds of contacts) will
render that many cards at once, which is fine on a reasonably modern phone
but can feel sluggish on an older or low-memory device — if that happens,
prefer the smaller "+10 more" / "+20 more" buttons and work through the
list in chunks instead.
