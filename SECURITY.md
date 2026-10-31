# Security

This is a private, single-owner app. If you find a problem, please contact the owner directly instead of opening a public issue.

## How the app protects contacts

- Contacts are stored only in Firebase Cloud Firestore. Rules allow one user ID and refuse everyone else.
- Sign-in and the database cache are held in memory only. Nothing about your contacts is written to the device.
- A strict Content Security Policy limits where scripts, styles and connections can come from.
- Optional Firebase App Check (reCAPTCHA) blocks requests that do not come from this site.
- No contact files are accepted in the repository: the build stops if one is committed.

## Keys in this repository

The Firebase settings (API key, project ID, app ID) are supplied to the build as GitHub secrets and are not stored in the code. They identify your project and are not passwords, but treat the API key as rotatable: restrict it to your site address in Google Cloud Console (see `docs/FIREBASE_SETUP.md`).
