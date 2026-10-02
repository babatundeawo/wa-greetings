// scripts/sync-contacts.js
//
// Run automatically by .github/workflows/sync-contacts.yml whenever
// data/contacts.csv changes. Can also be run manually:
//   FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccountKey.json)" node scripts/sync-contacts.js
//
// What it does:
//   1. Parses data/contacts.csv into contacts, each shaped as:
//        { name, phone, phones: [all numbers for this person], labels: [...] }
//      "phone" is the PRIMARY number (the first valid one found) — this is
//      the canonical ID used everywhere else (Firestore sent/ignored
//      tracking, the app's contact lookup). "phones" additionally holds
//      every other valid number found for that person, so none are lost
//      even if they have several lines/SIMs on file.
//      Google "Labels" (e.g. "RCCG", "KBI Parents", "Relatives") are kept
//      as an array so the app can filter by them. The catch-all
//      "* myContacts" label every contact gets is dropped since it carries
//      no filtering value; other "* "-prefixed labels (starred, family)
//      are kept since they do carry meaning.
//   2. Writes the full list to contacts.json (this is what the web app loads).
//   3. Reads the current "already sent" / "ignored" phone numbers from
//      Firestore (rotation/state) and splits the contact list into:
//        - pending.json  -> not yet sent, not ignored
//        - sent.json     -> already sent
//        - ignored.json  -> excluded from the rotation
//      These three files are for your own reference; the web app itself
//      always reads contacts.json + Firestore directly, so it stays correct
//      even if you don't look at these files.

const fs = require('fs');
const path = require('path');
const { parse } = require('csv-parse/sync');
const admin = require('firebase-admin');

const ROOT = path.join(__dirname, '..');
const CSV_PATH = path.join(ROOT, 'data', 'contacts.csv');
const CONTACTS_JSON = path.join(ROOT, 'contacts.json');
const PENDING_JSON = path.join(ROOT, 'pending.json');
const SENT_JSON = path.join(ROOT, 'sent.json');
const IGNORED_JSON = path.join(ROOT, 'ignored.json');

const PHONE_COLS = Array.from({ length: 10 }, (_, i) => `Phone ${i + 1} - Value`);

function cleanNumber(raw) {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 7) return null;
  if (raw.trim().startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '234' + digits.slice(1);
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

// A single "Phone N - Value" cell can itself contain several numbers
// separated by " ::: " (Google Contacts does this for some rows) — split
// on that before cleaning each piece, so none of them get dropped.
function cleanNumbersFromCell(raw) {
  if (!raw) return [];
  return raw
    .split(':::')
    .map((piece) => cleanNumber(piece))
    .filter(Boolean);
}

function titleCaseIfAllCaps(name) {
  if (name !== name.toUpperCase()) return name;
  return name.replace(/\S+/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
}

function extractLabels(raw) {
  if (!raw) return [];
  return raw
    .split(':::')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.toLowerCase() !== '* mycontacts');
}

function extractContacts(records) {
  const seenPrimary = new Set();
  const contacts = [];

  for (const row of records) {
    let name = (row['File As'] || '').trim();
    if (!name) {
      name = [row['First Name'], row['Middle Name'], row['Last Name']]
        .filter(Boolean)
        .map((s) => s.trim())
        .filter(Boolean)
        .join(' ');
    }
    name = name.replace(/\s+/g, ' ').trim();
    if (!name || name.toLowerCase() === 'voicemail') continue;

    // Gather every valid number across all phone columns, in column order,
    // deduped within this one contact.
    const numbersForThisContact = [];
    const seenHere = new Set();
    for (const col of PHONE_COLS) {
      const val = row[col];
      if (!val || !val.trim()) continue;
      for (const n of cleanNumbersFromCell(val)) {
        if (!seenHere.has(n)) {
          seenHere.add(n);
          numbersForThisContact.push(n);
        }
      }
    }
    if (numbersForThisContact.length === 0) continue;

    const primary = numbersForThisContact[0];
    if (seenPrimary.has(primary)) continue; // same primary number already used by an earlier row
    seenPrimary.add(primary);

    const labels = extractLabels(row['Labels']);

    contacts.push({
      name: titleCaseIfAllCaps(name),
      phone: primary,
      phones: numbersForThisContact,
      labels,
    });
  }
  return contacts;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(`Expected CSV at ${CSV_PATH} — did you upload it to data/contacts.csv?`);
  }

  const csvRaw = fs.readFileSync(CSV_PATH, 'utf-8');
  const records = parse(csvRaw, { columns: true, skip_empty_lines: true, relax_column_count: true });
  const contacts = extractContacts(records);

  const totalNumbers = contacts.reduce((sum, c) => sum + c.phones.length, 0);
  fs.writeFileSync(CONTACTS_JSON, JSON.stringify(contacts));
  console.log(`contacts.json: wrote ${contacts.length} contacts (${totalNumbers} phone numbers total, including extra numbers per person).`);

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawServiceAccount) {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — skipping Firebase sync, writing pending/sent/ignored as best-effort (everyone treated as pending).');
    fs.writeFileSync(PENDING_JSON, JSON.stringify(contacts, null, 2));
    fs.writeFileSync(SENT_JSON, JSON.stringify([], null, 2));
    fs.writeFileSync(IGNORED_JSON, JSON.stringify([], null, 2));
    return;
  }

  const serviceAccount = JSON.parse(rawServiceAccount);
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
  const db = admin.firestore();

  const stateSnap = await db.collection('rotation').doc('state').get();
  const sentPhones = new Set(stateSnap.exists ? (stateSnap.data().sentPhones || []) : []);
  const ignoredPhones = new Set(stateSnap.exists ? (stateSnap.data().ignoredPhones || []) : []);

  const active = contacts.filter((c) => !ignoredPhones.has(c.phone));
  const pending = active.filter((c) => !sentPhones.has(c.phone));
  const sent = active.filter((c) => sentPhones.has(c.phone));
  const ignored = contacts.filter((c) => ignoredPhones.has(c.phone));

  fs.writeFileSync(PENDING_JSON, JSON.stringify(pending, null, 2));
  fs.writeFileSync(SENT_JSON, JSON.stringify(sent, null, 2));
  fs.writeFileSync(IGNORED_JSON, JSON.stringify(ignored, null, 2));

  console.log(`Firestore says ${sentPhones.size} phone numbers already greeted, ${ignoredPhones.size} ignored.`);
  console.log(`pending.json: ${pending.length} contacts. sent.json: ${sent.length} contacts. ignored.json: ${ignored.length} contacts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
