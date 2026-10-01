# Daily Greetings

A small installable web app (PWA) that gives you 20 people to send a WhatsApp
greeting to each day, cycling through your contact list so everyone eventually
gets a turn. Messages are elaborate prayer-style greetings with a Bible verse
(KJV), themed by day of the week (and by new month on the 1st), and never use
the recipient's name — so the tone stays respectful whether they're older,
younger, or someone you barely know. Who's already been greeted is tracked
in Firebase (Firestore), so it auto-syncs and survives re-uploading an
updated contact list. The app itself is locked behind a sign-in screen so
random visitors can't access it.

## How it works day to day

- `contacts.json` holds your contacts (name + phone number) — the name is
  only shown to *you* in the app's list, never inserted into the message
  text itself.
- Each day the app shows the next 20 contacts who **haven't been greeted yet
  this round**, tracked by phone number in Firestore. Mark someone sent and
  they won't reappear until everyone's had a turn, at which point a new
  round starts automatically.
- Each contact gets a personalized-by-day (not by name), editable greeting —
  a short prayer with a Bible verse reference — and a **Send on WhatsApp**
  button that opens WhatsApp with that contact's chat and the message
  already typed in. Browsers can't send WhatsApp messages automatically,
  so this one tap is as close as it gets.
- Under each contact's message are two checkboxes: **Sent** and
  **Ignore (no WhatsApp / skip)**. Tick **Sent** for everyone you've
  messaged, tick **Ignore** for anyone who shouldn't be in the rotation at
  all (no WhatsApp, asked not to be contacted, etc.), then tap the single
  **Save changes** button at the bottom of the list once — this commits
  everything you've ticked in one go, rather than tapping something after
  every single person.
- Ignored contacts are excluded from the rotation permanently (not just for
  today) until you come back and untick their "Ignore" box and save again.
  They don't count toward the "X/Y greeted" total either.
- Greetings change with the day: Sunday carries a "new week" theme (the
  week is treated as starting on Sunday, not Monday), the other weekdays
  each carry their own theme (diligence, gratitude, grace, rest, etc.), and
  the 1st of every month switches to a "Happy New Month" prayer instead.
- "Reset rotation" (under the progress line) clears everyone's sent status
  so a new round begins — ignored contacts stay ignored through a reset.
- "← Yesterday" / "Tomorrow →" only *preview* another day's batch based on
  current sent/ignored status — the checkboxes are disabled on preview days
  and "Save changes" only appears on "Today".
- If you only get through some of the batch (say you tick and save 10 out
  of 20), the rest simply carry over — they'll be at the front of
  tomorrow's batch again, topped up with fresh people to reach 20. Nothing
  is skipped. The flip side: the app only knows someone's "sent" because
  you ticked the box and saved — there's no way for it to detect an actual
  WhatsApp send, so if you send but forget to tick it, that person will
  show up again.
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
   - Re-parses the CSV into `contacts.json`.
   - Reads Firestore to see who's already been greeted this round, and who's
     been marked "Ignore" in the app.
   - Writes `pending.json` (not yet greeted), `sent.json` (already
     greeted), and `ignored.json` (excluded from the rotation) for your own
     reference.
   - Commits all four files back to the repo — GitHub Pages redeploys on
     its own shortly after.
4. Reopen the app — no other steps needed.

**Why nobody gets double-greeted after an update:** the app never decides
"who's sent" from the CSV or from list position — that always comes from
Firestore, matched by phone number. So:

- Anyone already marked sent in Firestore stays skipped, regardless of
  where they now sit in the file or how many contacts you have.
- New contacts (new phone numbers) automatically join the queue.
- If someone's removed from the CSV, they just vanish — no gap.
- If a contact's number itself changes, that counts as a new contact
  (matching is strictly by number), so it'll be greeted again fresh.

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
