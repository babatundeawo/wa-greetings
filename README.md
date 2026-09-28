# Daily Greetings

A small installable web app (PWA) that gives you 20 people to send a WhatsApp
greeting to each day, cycling through your contact list so everyone eventually
gets a turn. Who's already been greeted is tracked in Firebase (Firestore),
so it auto-syncs — no manual bookkeeping, and it survives you re-uploading an
updated contact list.

## How it works day to day

- `contacts.json` holds your contacts (name + phone number).
- Each day the app shows the next 20 contacts who **haven't been greeted yet
  this round**, tracked by phone number in Firestore. Mark someone sent and
  they won't reappear until everyone's had a turn, at which point a new
  round starts automatically.
- Each contact gets a personalized, editable greeting and a
  **Send on WhatsApp** button — it opens WhatsApp with that contact's chat
  and the message already typed in. Browsers can't send WhatsApp messages
  automatically, so this one tap is as close as it gets.
- "Reset rotation" (under the progress line) clears everyone's sent status.
- "← Yesterday" / "Tomorrow →" only *preview* another day's batch based on
  current sent status — they don't lock anything in.
- If you only get through some of the 20 (say you send to and mark 10),
  the rest simply carry over — they'll be at the front of tomorrow's batch
  again, topped up with fresh people to reach 20. Nothing is skipped. The
  flip side: the app only knows someone's "sent" because you tapped
  **Mark sent** — there's no way for it to detect an actual WhatsApp send,
  so if you send but forget to mark it, that person will show up again.

## One-time setup

You'll do three things once: create a Firebase project, host the app on
GitHub Pages, and add a GitHub secret so the sync script can talk to
Firebase. All free at this scale.

### 1. Create a Firebase project

1. Go to [console.firebase.google.com](https://console.firebase.google.com)
   and click **Add project**. Name it anything (e.g. `daily-greetings`).
   You can skip Google Analytics — not needed here.
2. Once created, in the left sidebar go to **Build → Firestore Database →
   Create database**. Choose **Start in production mode**, pick any
   location close to you, and create it.
3. Go to **Firestore Database → Rules** tab, delete what's there, and paste
   in the contents of `firestore.rules` from this folder, then **Publish**.
   This keeps the database locked to only the rotation data this app uses —
   nothing else is reachable even with an open rule.
4. Go to **Project settings** (gear icon, top left) → **General** tab →
   scroll to "Your apps" → click the **`</>`** (web) icon to register a
   web app. Give it any nickname, no need for Firebase Hosting.
5. Firebase will show you a `firebaseConfig` object. Copy those values into
   `firebase-config.js` in this folder (it's fine that this file is public —
   these values identify your project, they aren't secret; your data is
   protected by the Firestore rules from step 3 instead).

### 2. Generate a service account key (for the sync script)

The GitHub Action needs its own, more privileged way to talk to Firestore
(separate from the open rules the web app uses):

1. In Firebase, go to **Project settings → Service accounts**.
2. Click **Generate new private key** — this downloads a `.json` file.
   **Keep this file secret and never commit it to the repo.**
3. In your GitHub repo, go to **Settings → Secrets and variables →
   Actions → New repository secret**.
4. Name it `FIREBASE_SERVICE_ACCOUNT`, and paste the **entire contents**
   of the downloaded JSON file as the value. Save.

### 3. Push everything to GitHub and enable Pages

1. Create a GitHub repository (e.g. `daily-greetings`) and push every file
   in this folder to it, including the `.github/workflows/` folder,
   `data/contacts.csv`, `package.json`, and your filled-in
   `firebase-config.js`.
2. In the repo, go to **Settings → Pages**, set **Source** to "Deploy from
   a branch", pick `main` and `/ (root)`, save.
3. After a minute or two your app is live at:
   `https://<your-username>.github.io/daily-greetings/`

### 4. Install it on your phone

Open the link above in your phone's browser, then use
**"Add to Home Screen"** (iOS Safari) or **"Install app"** (Android Chrome).
It'll open like a normal app.

## Updating the contact list

From now on, updating is fully automatic:

1. Export a fresh CSV from Google Contacts (or edit the existing one).
2. Replace `data/contacts.csv` in the GitHub repo with the new file
   (via the GitHub web UI's "upload file", or `git add`/`commit`/`push`).
3. That's it. Pushing a change to `data/contacts.csv` triggers the
   **Sync contacts from CSV** GitHub Action automatically, which:
   - Re-parses the CSV into `contacts.json`.
   - Reads Firestore to see who's already been greeted this round.
   - Writes `pending.json` (not yet greeted) and `sent.json` (already
     greeted) for your own reference.
   - Commits all three files back to the repo — GitHub Pages redeploys on
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

You can check `pending.json` / `sent.json` any time after a sync to see
exactly who's left — they're generated for your own visibility, but the
live app doesn't depend on them; it talks to Firestore directly.

### If you want to run the sync manually instead

You don't normally need to — the GitHub Action handles it — but if you ever
want to test it locally:

```bash
npm install
export FIREBASE_SERVICE_ACCOUNT="$(cat /path/to/your/serviceAccountKey.json)"
node scripts/sync-contacts.js
```

## Customizing greetings

Open `app.js` and edit the `GENERIC_TEMPLATES` array (and the day-specific
ones in `WEEKDAY_TEMPLATES`) near the top. `{name}` becomes the contact's
first name, `{timeOfDay}` becomes "morning", "afternoon", or "evening"
based on when you open the app. Each contact gets a message picked based on
their phone number and the date, so it varies from person to person and
day to day without needing you to track anything.

## A note on the open Firestore rules

You chose open (no sign-in) access to keep things simple, which is
reasonable here since the contact list itself is already public in this
repo. The rules in `firestore.rules` scope that openness to just the
`rotation` collection, so even with open access, nothing else in the
database is reachable. If you ever want to lock it down further (e.g. if
you stop being comfortable with the contact list being public), the
straightforward next step is adding Firebase Authentication and changing
the rules to require `request.auth != null` — worth revisiting if this
app's purpose or audience changes.
