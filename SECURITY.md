# Security

## Reporting a vulnerability

Please report security problems privately. On the repository page, open the **Security** tab and choose **Report a vulnerability**. Do not post details in a public issue.

## What is public and what is not

- The values in `firebase-config.js` identify the Firebase project. They are designed to be public and are not passwords.
- Contacts and sent status are stored in a private Firestore database. The rules in `firestore.rules` allow access to signed-in users only.
- Contact lists, exports and service-account keys must never be committed to this repository. The deploy workflow stops if it finds contact files.
