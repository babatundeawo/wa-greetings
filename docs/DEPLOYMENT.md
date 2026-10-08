# Deployment guide

For the site owner. Everything here happens on github.com and console.firebase.google.com. You never need a terminal.

## How deployment works

The site is a set of plain files on the `main` branch. Whenever something changes on `main`, a workflow called **Deploy site** checks the files and publishes them to GitHub Pages. This takes one to two minutes. Pull requests run the same checks but publish nothing, so the live site stays untouched until you merge.

## First-time move to the redesign

Do these in order. Use a computer: uploading folders is not practical from a phone.

### 1. Save your contacts file

Your contacts will move into the private database, and the old files will be deleted. Keep a copy first.

1. On github.com, open your repository, then the file `data/contacts.csv`.
2. Click the download icon (**Download raw file**) at the top right of the file view.
3. Save it somewhere only you can see. This is the file you will import in step 9.

### 2. Update the database rules in Firebase

1. Go to console.firebase.google.com and open your project.
2. In the left menu choose **Build > Firestore Database**, then the **Rules** tab.
3. Delete everything in the box, then paste the full contents of `firestore.rules` from the new files.
4. Click **Publish**. You should see a confirmation and a new "Last published" time.

Your current live site keeps working, because the rules still allow the data it uses.

### 3. Turn off public sign-up

1. In the Firebase Console choose **Authentication** (under **Security** or **Build**, depending on your layout), then the **Settings** tab.
2. Open **User actions**.
3. Untick **Enable create (sign-up)** and click **Save**.

Without this, anyone who finds your project's public key could create an account and read your contacts. Your own account keeps working.

### 4. Upload the new files and open a pull request

1. Unzip the delivered folder on your computer. If you cannot see a `.github` folder, show hidden files (Mac: **Cmd+Shift+.**, Windows: **View > Show > Hidden items**).
2. On github.com open your repository. Choose **Add file > Upload files**.
3. Drag in everything inside the unzipped folder, including the `.github` folder.
4. At the bottom, choose **Create a new branch for this commit and start a pull request**. Name it `rebrand/premium-redesign`.
5. Click **Propose changes**, then **Create pull request**.

If the `.github` folder will not upload, open **Add file > Create new file**, type `.github/workflows/deploy.yml` as the name, paste the file's contents, and repeat for `codeql.yml` and `dependabot.yml`. Use the same branch.

### 5. Delete the old files from the branch

Uploading cannot delete files. Remove these from the branch, one at a time: open the branch from the branch menu, open the file, click the three dots, choose **Delete file**, then **Commit directly to the rebrand/premium-redesign branch**.

`app.js`, `style.css`, `icon.svg`, `icon-180.png`, `icon-192.png`, `icon-512.png`, `contacts.json`, `pending.json`, `sent.json`, `ignored.json`, `data/contacts.csv`, `scripts/sync-contacts.js`, `package.json`, `.gitattributes`, `.github/workflows/sync-contacts.yml`

The checks will fail with a clear message until the contact files are gone. That is intentional.

### 6. Review

1. Open the pull request and scroll to the checks at the bottom. Wait for green ticks.
2. GitHub Pages cannot preview a pull request, so the page itself is not viewable until it is merged. The checks cover the code, links and accessibility. If anything looks wrong afterwards, step "Roll back" below undoes it in a minute.

### 7. Merge

Click **Merge pull request**, then **Confirm merge**.

### 8. Switch Pages to the workflow

1. Open **Settings > Pages**.
2. Under **Build and deployment > Source**, choose **GitHub Actions**.
3. Open the **Actions** tab, choose **Deploy site** on the left, then **Run workflow > Run workflow**.
4. Wait for a green tick, then open your site address.

### 9. Sign in and import

1. Sign in with your usual email and password.
2. Tap the upload icon at the top right and choose the CSV from step 1.
3. Check the counts and tap **Import**. People already marked as sent stay marked.

### 10. Privacy clean-up (important)

The old contact files are removed from the current version, but **GitHub keeps every earlier version in the repository history**. If the repository is public, anyone could still read them there, and they may already have been readable at your site address.

Pick one:

- **Best: start a clean repository.** Download a backup of the new files, delete the old repository (**Settings > Danger Zone > Delete this repository**), create a new one with the same name, and upload the new files. History starts fresh. Then repeat steps 8 and 9. Do this only after step 9 has worked.
- **Or make the repository private.** **Settings > General > Danger Zone > Change visibility**. GitHub Pages from a private repository needs a paid GitHub plan. History is still not erased.

Whichever you choose, treat the old phone numbers as having been exposed. Nothing in the new version stores contacts in the repository, and the deploy workflow refuses to run if contact files reappear.

## Everyday use

- **New contacts:** export from Google Contacts as CSV and use the upload icon in the app. Never upload contacts to GitHub.
- **Wording, colors, icons:** see [CUSTOMIZING.md](CUSTOMIZING.md).

## Check that a deployment worked

1. Open the **Actions** tab on your repository.
2. Find the newest **Deploy site** run. A green tick means published, a red cross means it failed, a yellow dot means it is still running.
3. Click the run, then **Publish**. The site address appears there.

## Reading an error

Click the failed run, then the red step. The last lines say what went wrong.

| Message | Fix |
| --- | --- |
| Contact data found in the repository | Delete the listed files (step 5 above). |
| Get Pages site failed / Pages not enabled | **Settings > Pages > Source > GitHub Actions** (step 8). |
| Branch is not allowed to deploy to github-pages | **Settings > Environments > github-pages > Deployment branches**: allow `main`. |
| Syntax error in a `.js` file | You edited a file and left out a quote, comma or bracket. Open the file, undo your last edit, and try again. |

Link and Lighthouse steps only report problems; they never block publishing. Lighthouse reports are saved on the run page under **Artifacts**.

## Roll back

- **Quickest:** on the **Actions** tab, open an older run with a green tick, then **Re-run all jobs**. That version goes live again.
- **Undo a pull request:** open **Pull requests > Closed**, open the one to undo, click **Revert**, then merge the new pull request it creates.

## Connect a custom domain

1. **Settings > Pages > Custom domain**, type your domain, **Save**.
2. At your domain registrar, add DNS records. For a bare domain (example.com) add four `A` records pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`. For `www`, add a `CNAME` pointing to `babatundeawo.github.io`.
3. When GitHub shows the check as done, tick **Enforce HTTPS**.
4. In the Firebase Console go to **Authentication > Settings > Authorized domains > Add domain** and add the new domain, or sign-in will fail.

## Turn on automatic secret scanning

1. **Settings > Code security** (named **Advanced Security** on some accounts).
2. Enable **Secret scanning** and **Push protection** where offered.

This warns you if a password or key is ever committed by mistake.

## About security headers

GitHub Pages cannot send custom response headers. The app uses a strict Content Security Policy through a page tag instead. Protection against being embedded in other sites (frame-ancestors) is the one thing a tag cannot do. If that matters to you, host on Firebase Hosting, which can set headers.
