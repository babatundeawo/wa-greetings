/**
 * Contact importer.
 *
 * Reads a Google Contacts CSV export (or a JSON list in this app's own
 * format) entirely in the browser. Nothing is uploaded anywhere until the
 * signed-in owner confirms the import, and then it goes straight to
 * Firestore.
 *
 * Each contact is { name, phone, phones, labels } where `phone` is the
 * primary number. Sent status is tracked against that primary number.
 */

const PHONE_COLUMNS = Array.from({ length: 10 }, (_, i) => `Phone ${i + 1} - Value`);
const MAX_FILE_BYTES = 8 * 1024 * 1024;

/** Parses RFC 4180 CSV text (quoted fields, escaped quotes, embedded newlines). */
export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') { field += '"'; i++; } else { inQuotes = false; }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      row.push(field); field = '';
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(field); field = '';
      if (row.some((cell) => cell !== '')) rows.push(row);
      row = [];
    } else {
      field += ch;
    }
  }
  row.push(field);
  if (row.some((cell) => cell !== '')) rows.push(row);

  if (rows.length === 0) return [];
  const header = rows[0].map((h) => h.replace(/^\uFEFF/, '').trim());
  return rows.slice(1).map((cells) => {
    const record = {};
    header.forEach((name, idx) => { record[name] = cells[idx] ?? ''; });
    return record;
  });
}

function cleanNumber(raw) {
  if (!raw) return null;
  const digits = raw.replace(/[^0-9]/g, '');
  if (!digits || digits.length < 7) return null;
  if (raw.trim().startsWith('+')) return digits;
  if (digits.startsWith('0') && digits.length === 11) return `234${digits.slice(1)}`;
  if (digits.length >= 10 && digits.length <= 15) return digits;
  return null;
}

// Google Contacts can put several values in one cell, separated by " ::: ".
function numbersFromCell(raw) {
  if (!raw) return [];
  return raw.split(':::').map(cleanNumber).filter(Boolean);
}

function titleCaseIfAllCaps(name) {
  if (name !== name.toUpperCase()) return name;
  return name.replace(/\S+/g, (word) => word.charAt(0) + word.slice(1).toLowerCase());
}

function labelsFromCell(raw) {
  if (!raw) return [];
  return raw
    .split(':::')
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((s) => s.toLowerCase() !== '* mycontacts');
}

/** Turns CSV records into contacts. Skips rows without a name or a valid number. */
export function contactsFromRecords(records) {
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

    const numbers = [];
    const seenHere = new Set();
    for (const col of PHONE_COLUMNS) {
      for (const n of numbersFromCell(row[col])) {
        if (!seenHere.has(n)) { seenHere.add(n); numbers.push(n); }
      }
    }
    if (numbers.length === 0) continue;

    const primary = numbers[0];
    if (seenPrimary.has(primary)) continue;
    seenPrimary.add(primary);

    contacts.push({
      name: titleCaseIfAllCaps(name),
      phone: primary,
      phones: numbers,
      labels: labelsFromCell(row.Labels),
    });
  }
  return contacts;
}

/** Validates a JSON list that is already in { name, phone, phones, labels } form. */
export function contactsFromJson(data) {
  if (!Array.isArray(data)) throw new Error('The JSON file must contain a list of contacts.');
  const seen = new Set();
  const contacts = [];
  for (const item of data) {
    if (!item || typeof item.name !== 'string' || !/^\d{7,15}$/.test(String(item.phone))) continue;
    const phone = String(item.phone);
    if (seen.has(phone)) continue;
    seen.add(phone);
    const phones = Array.isArray(item.phones)
      ? item.phones.map(String).filter((p) => /^\d{7,15}$/.test(p))
      : [];
    if (!phones.includes(phone)) phones.unshift(phone);
    const labels = Array.isArray(item.labels) ? item.labels.map(String).filter(Boolean) : [];
    contacts.push({ name: item.name.trim(), phone, phones, labels });
  }
  return contacts;
}

/** Reads a File chosen by the owner and returns the contacts inside it. */
export async function readContactsFile(file) {
  if (file.size > MAX_FILE_BYTES) throw new Error('That file is larger than 8 MB. Check that it is the right export.');
  const text = await file.text();
  const isJson = /\.json$/i.test(file.name) || text.trimStart().startsWith('[');
  const contacts = isJson
    ? contactsFromJson(JSON.parse(text))
    : contactsFromRecords(parseCsv(text));
  if (contacts.length === 0) {
    throw new Error('No contacts with a valid phone number were found in that file.');
  }
  return contacts;
}

/** Compares an incoming list with the current one, by primary number. */
export function diffContacts(current, incoming) {
  const currentPhones = new Set(current.map((c) => c.phone));
  const incomingPhones = new Set(incoming.map((c) => c.phone));
  return {
    added: incoming.filter((c) => !currentPhones.has(c.phone)).length,
    removed: current.filter((c) => !incomingPhones.has(c.phone)).length,
    kept: incoming.filter((c) => currentPhones.has(c.phone)).length,
  };
}
