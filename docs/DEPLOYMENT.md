# Moving to this version (step by step)

This replaces the files in your existing `wa-greetings` repository with a rebuilt version. Your live address stays the same: `https://babatundeawo.github.io/wa-greetings/`. Allow about 40 minutes the first time. Nothing here needs a terminal.

**Your contacts are safe.** They live in Firebase, not in these files. Replacing the files does not touch them.

## Before you start

You need your Firebase **web app settings**. Open [Firebase Console](https://console.firebase.google.com/), pick your project, click the gear icon, then **Project settings**. Scroll to **Your apps**. You will use four values later: `apiKey`, `authDomain`, `projectId` and `appId`. Keep this tab open.

## Part 1: Put the new files in your repository

You will work in a normal folder on your computer. If you already have the repository cloned (for example with GitHub Desktop), use that folder. If not, in GitHub Desktop choose **File > Clone repository**, pick `babatundeawo/wa-greetings`, and click **Clone**.

1. Open the cloned folder in File Explorer (Windows) or Finder (Mac). In GitHub Desktop: **Repository > Show in Explorer** or **Show in Finder**.
2. **Show hidden files.** Windows: in File Explorer click **View > Show > Hidden items**. Mac: press `Cmd` + `Shift` + `.`.
3. **Delete everything in the folder EXCEPT the folder called `.git`.** Select all, then hold `Ctrl` (Windows) or `Cmd` (Mac) and click `.git` to un-select it, then delete. Do not delete `.git`: it is the repository's history.
4. Unzip `wa-greetings-rebuild.zip`. Open the unzipped `wa-greetings` folder, select **everything inside it** (including the hidden `.github` folder) and copy it into your repository folder.
5. Open GitHub Desktop. You will see many changed files. Type the summary `Rebuild: new design, self-hosted Firebase, safer rules` and click **Commit to main**. **Do not push yet.**

## Part 2: Add the secrets to GitHub

The site is built by GitHub, which needs your Firebase settings. They are stored as secrets so they are not in the code.

1. On GitHub open your repository, click **Settings**.
2. In the left menu click **Secrets and variables**, then **Actions**.
3. Click **New repository secret**. Add these four, one at a time. The **Name** must match exactly, and the **Secret** is the value from Firebase's Project settings (no quote marks, no spaces):

| Name | Value from Firebase |
| --- | --- |
| `FIREBASE_API_KEY` | `apiKey` (use the **new** key from [FIREBASE_SETUP.md](FIREBASE_SETUP.md), Part 1) |
| `FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `FIREBASE_PROJECT_ID` | `projectId` |
| `FIREBASE_APP_ID` | `appId` |

4. Later, when you set up App Check, you will add a fifth, `RECAPTCHA_SITE_KEY`. It is optional for now.

## Part 3: Make Pages use GitHub Actions

1. Repository **Settings > Pages**.
2. Under **Build and deployment**, set **Source** to **GitHub Actions**. (If it already says that, leave it.)

## Part 4: Do the Firebase steps BEFORE you push

Follow [FIREBASE_SETUP.md](FIREBASE_SETUP.md) Parts 1 to 3 now: restrict the key, find your user ID and publish the new rules. Publishing the rules is what makes the database safe, and the app will not read your contacts until your user ID is in them.

## Part 5: Publish

1. In GitHub Desktop click **Push origin**.
2. On GitHub open the **Actions** tab. Click the newest run called **Deploy site**. Wait for the green ticks (about 2 to 3 minutes).
   - If **Build the site** is red and says a secret is missing, redo Part 2.
3. Open `https://babatundeawo.github.io/wa-greetings/` and sign in.
4. If your phone has the old app installed, open it once. A **Refresh** bar appears. Tap it.

## Part 6: Clean old contact data out of the history (strongly recommended)

Older versions kept contact files in this repository. Deleting them does not remove them from the history, and the repository must be public for free Pages. Check: on GitHub open **Code**, click the commit count (for example "123 commits"), and look for old commits that touch files named `contacts`, `pending`, `sent` or `data/`. If you find any, the simplest safe fix is:

1. Download your contacts first: you can re-import them later from Google Contacts.
2. Repository **Settings**, scroll to the bottom, **Danger Zone**, **Delete this repository**. Type the name to confirm.
3. Create a new **public** repository called `wa-greetings` (same name, so the address is unchanged), then repeat Parts 1 to 5 with it. Clone the new empty repository for Part 1, and skip step 3 of Part 1.

Do this only after the new site works elsewhere or you have your files backed up. If you prefer to keep the history, tell me and I will write a history-rewriting guide instead. It is more delicate.

## If something goes wrong

- **Actions run is red:** click it, click the red step, and read the first message. Missing secrets are named in plain words.
- **Sign-in says "address is not authorised":** Firebase Console > Authentication > Settings > Authorized domains, add `babatundeawo.github.io`.
- **Sign-in works but contacts do not load:** your user ID in the rules is wrong or not published. Redo [FIREBASE_SETUP.md](FIREBASE_SETUP.md) Part 3.
- **Site shows the old design:** open the site, wait 10 seconds, and tap **Refresh** if the bar appears.
