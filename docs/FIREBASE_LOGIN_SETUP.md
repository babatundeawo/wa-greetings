# Firebase login setup

For a complete beginner. You need a Firebase project and a web browser. No terminal.

## What this is

**Firebase Authentication** is Google's sign-in service. It checks an email and password so that only you can open the app. **Firestore** is the private database where your contacts and "sent" list are stored. **Security rules** are instructions in Firestore that decide who may read or write. Together they keep your contacts private.

Your project is already connected, so most of this is a check-up. Use it if you ever set up a new project or something stops working.

## 1. Open your project

1. Go to console.firebase.google.com and sign in with the Google account that owns the project.
2. Click your project.

You should see the project overview page.

## 2. Register the web app and copy its settings

Skip this if sign-in already works. You only need it for a new project.

1. Click the gear icon beside **Project Overview**, then **Project settings**.
2. Under **Your apps** click the web icon `</>`, give the app a nickname, and click **Register app**.
3. You will see a block of settings (`apiKey`, `authDomain`, `projectId` and so on). Copy the values into `firebase-config.js` on GitHub (open it, click the pencil, replace the values, **Commit changes**).

These values identify your project. They are not passwords.

## 3. Turn on email and password sign-in

1. In the left menu choose **Authentication** (under **Build** or **Security**), then **Get started** if you see it.
2. Open the **Sign-in method** tab and click **Email/Password**.
3. Switch **Enable** on and click **Save**.

Email/Password should now show as **Enabled**. Google sign-in is not used by this app.

## 4. Create your one account

1. Open the **Users** tab and click **Add user**.
2. Enter your email and a long password (a phrase of four or more random words works well), then **Add user**.

Your email should appear in the list.

## 5. Turn off public sign-up

1. Open the **Settings** tab, then **User actions**.
2. Untick **Enable create (sign-up)** and click **Save**.

This stops strangers from creating accounts. The app has no sign-up page either, but this setting is what really enforces it.

## 6. Authorize your website address

1. Still in **Settings**, open **Authorized domains**.
2. Make sure `babatundeawo.github.io` is in the list. If you use your own domain, add it too with **Add domain**.

If the address is missing, sign-in fails with `auth/unauthorized-domain`.

## 7. Create the database and publish the rules

1. Choose **Firestore Database** in the left menu, then **Create database** if you see it. Pick a location near you and start in **production mode**.
2. Open the **Rules** tab. Delete everything, paste the full contents of `firestore.rules`, and click **Publish**.

You should see the rules saved with a new "Last published" time. The rules allow signed-in users only and refuse everything else.

## 8. GitHub secrets

This app needs **no** GitHub secrets. Do not add Firebase keys there.

If an older version created a secret named `FIREBASE_SERVICE_ACCOUNT`, remove it, because nothing uses it any more:

1. On GitHub open **Settings > Secrets and variables > Actions**.
2. Click the bin icon beside `FIREBASE_SERVICE_ACCOUNT` and confirm.
3. In the Firebase Console go to **Project settings > Service accounts**, click **Manage service account permissions**, open the service account, choose the **Keys** tab, and delete its keys.

## 9. Deploy

On GitHub open **Actions > Deploy site > Run workflow**. Wait for the green tick, then open your site.

## How to test that login works

1. Open the site. You should see the sign-in card.
2. Enter a wrong password. You should see "Email or password is incorrect."
3. Enter the right one. You should see the app with today's weekday and your contacts.
4. Tap the sign-out icon. You should return to the sign-in card, and the contacts disappear from the page.

## Common errors and fixes

| What you see | Cause and fix |
| --- | --- |
| This web address is not authorised (`auth/unauthorized-domain`) | Add the address under **Authentication > Settings > Authorized domains** (step 6). |
| Firebase configuration is not valid (`invalid API key`) | The values in `firebase-config.js` are wrong or incomplete. Copy them again (step 2). |
| The database refused access (`permission-denied`) | The rules are missing or old. Republish `firestore.rules` (step 7). Also check you are signed in. |
| Email or password is incorrect | Reset the password: **Authentication > Users**, click the three dots beside your email, **Reset password**. |
| Too many attempts | Wait a few minutes. Firebase slows down repeated wrong guesses. |
| Contacts did not load, then "No contacts yet" | The database is empty. Import your CSV with the upload icon. |
| Sign-in button does nothing, page is blank | JavaScript is blocked or the Firebase scripts did not load. Check your connection and any ad blocker. |

## Extra protection (optional)

- **Restrict the API key to your website.** In console.cloud.google.com open **APIs & Services > Credentials**, click the browser key, and under **Application restrictions** choose **Websites**. Add `https://babatundeawo.github.io/*` (and your own domain if you have one). Test sign-in straight after; if it breaks, set it back to **None**.
- **App Check** adds a check that requests come from your real site. It needs a reCAPTCHA key and a small code change, so it is a future improvement rather than part of this setup.
- **Usage limits:** the free Firestore quota is far above what this app uses (a few reads per visit). In **Usage and billing** you can set a budget alert.

## Glossary

- **API key:** a public identifier that tells Google which project a request belongs to. Not a password.
- **Authorized domain:** a website address allowed to use sign-in for your project.
- **Security rules:** the instructions in Firestore that decide who can read or write data.
- **Secret:** a private value, such as a key or password, stored in GitHub settings and never in files.
- **Custom claim:** a label attached to a user, often to mark an admin. This app has one user and does not need it.

## What NOT to share or commit

- Your password.
- Contact exports or contact files of any kind.
- Service-account key files (`.json` files with a `private_key` inside).
- Screenshots that show real phone numbers.
