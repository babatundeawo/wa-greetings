// scripts/sync-contacts.js
//
// Run automatically by .github/workflows/sync-contacts.yml whenever
// data/contacts.csv changes. Can also be run manually:
//   FIREBASE_SERVICE_ACCOUNT="$(cat serviceAccountKey.json)" node scripts/sync-contacts.js
//
// What it does:
//   1. Parses data/contacts.csv into { name, phone } contacts (same cleaning
//      rules as the original import: digits only, Nigerian 0XXXXXXXXXX
//      numbers get 234 prefixed, duplicates and unusable numbers dropped).
//   2. Writes the full list to contacts.json (this is what the web app loads).
//   3. Reads the current "already sent" phone numbers from Firestore
//      (rotation/state.sentPhones) and splits the contact list into:
//        - pending.json   -> contacts NOT yet sent this round
//        - sent.json      -> contacts already sent this round
//      These two files are for your own reference; the web app itself
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
  const first = raw.split(':::')[0].trim();
  const digits = first.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 7) return null;
  if (first.startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length === 11) return '234' + digits.slice(1);
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

function titleCaseIfAllCaps(name) {
  if (name !== name.toUpperCase()) return name;
  return name.replace(/\S+/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
}

function extractContacts(records) {
  const seen = new Set();
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

    let phone = null;
    for (const col of PHONE_COLS) {
      const val = row[col];
      if (val && val.trim()) {
        const cleaned = cleanNumber(val);
        if (cleaned) { phone = cleaned; break; }
      }
    }
    if (!phone || seen.has(phone)) continue;
    seen.add(phone);

    contacts.push({ name: titleCaseIfAllCaps(name), phone });
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

  fs.writeFileSync(CONTACTS_JSON, JSON.stringify(contacts));
  console.log(`contacts.json: wrote ${contacts.length} contacts.`);

  const rawServiceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!rawServiceAccount) {
    console.warn('FIREBASE_SERVICE_ACCOUNT not set — skipping Firebase sync, writing pending/sent as best-effort (everyone treated as pending).');
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

  console.log(`Firestore says ${sentPhones.size} phone numbers already greeted this round, ${ignoredPhones.size} ignored.`);
  console.log(`pending.json: ${pending.length} contacts. sent.json: ${sent.length} contacts. ignored.json: ${ignored.length} contacts.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
