# Firebase setup (free Spark plan)

Do these once. Each part says what you are doing and why.

## Part 1: Lock down your API key

Your old key was visible in the public repository, so replace it and restrict it.

1. Open [Google Cloud Console credentials](https://console.cloud.google.com/apis/credentials) and choose your Firebase project in the top bar.
2. Find the key named **Browser key** or **Web API key** (the one starting with `AIza`). Click its name.
3. Under **Application restrictions**, choose **Websites**. Under **Website restrictions** click **Add** and enter `https://babatundeawo.github.io/*`. Add `http://localhost/*` too if you test locally.
4. Under **API restrictions** choose **Restrict key** and tick: **Identity Toolkit API**, **Token Service API** and **Cloud Firestore API**. If you later switch on App Check, also tick **Firebase App Check API**.
5. Click **Save**.
6. To replace the exposed key: on the same page click **Add API key**, name it `wa-greetings-web`, apply the same two restrictions, and **Save**. Copy the new key into the GitHub secret `FIREBASE_API_KEY`. Once the new site works, go back and **delete the old key**.

## Part 2: Turn off public sign-up

1. Firebase Console > **Authentication** > **Settings** > **User actions**.
2. Untick **Enable create (sign-up)**. This stops strangers creating accounts. Your own account already exists.
3. Under **Authorized domains** make sure `babatundeawo.github.io` is listed.

## Part 3: Publish the new database rules

The rules say only you may read or write.

1. Firebase Console > **Authentication** > **Users**. Next to your email, copy the **User UID** (a long mix of letters and numbers).
2. In your repository on GitHub open `firestore.rules` and click the pencil icon. Replace `PASTE_YOUR_USER_ID_HERE` with your User UID. Keep the quote marks. Do not touch anything else. Do not commit yet: copy the whole file's text (select all, copy) first.
3. Firebase Console > **Firestore Database** > **Rules** tab. Select everything in the editor, paste the text you copied, and click **Publish**.
4. Commit the same change on GitHub so the file in the repository matches.

Test it: sign in and check the contacts load. They should. To confirm the lock works, the **Rules Playground** in the same tab lets you simulate a read as a different user. It should be denied.

## Part 4: Add App Check (optional, free, recommended)

App Check proves requests come from your real site, not from a copy of your key.

1. Go to [Google reCAPTCHA admin](https://www.google.com/recaptcha/admin) and click **+** to create a site. Name it `wa-greetings`. Choose **reCAPTCHA v3**. Add the domain `babatundeawo.github.io`. Submit.
2. Copy the **Secret key** (not the site key) to a safe note.
3. Firebase Console > **App Check** > **Apps** tab. Click your web app, choose **reCAPTCHA**, paste the **Secret key**, and click **Save**.
4. Copy the reCAPTCHA **Site key** (the public one). In GitHub add a repository secret named `RECAPTCHA_SITE_KEY` with that value (same place as the other secrets in [DEPLOYMENT.md](DEPLOYMENT.md) Part 2).
5. Repository **Actions** tab > **Deploy site** > **Run workflow** to rebuild.
6. Use the app for a day. In Firebase Console > App Check > **APIs** tab, click **Cloud Firestore**. Once the graph shows your requests as **Verified**, click **Enforce**.

Do **not** enforce App Check for Authentication on the free plan: Firebase requires an upgrade for that, and it is not needed. Enforcing only Firestore protects the data.

## Free-plan limits (Spark)

Cloud Firestore's no-cost plan includes 1 GiB stored, 50,000 document reads, 20,000 writes and 20,000 deletes per day. Opening the app reads one document per 800 contacts plus one more, so it uses a handful of reads. Check **Firestore Database > Usage** if you ever worry. Limits can change, and Firebase shows the current ones.

The app must use the database named `(default)`. Named databases do not get the free allowance.

## Add the secrets to GitHub

See [DEPLOYMENT.md](DEPLOYMENT.md) Part 2 for the exact click path.
