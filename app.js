// ---- Configuration ----
const BATCH_SIZE = 10;

const GREETING_TEMPLATES = [
  "Good {timeOfDay}, {name}! Just checking in to say hello and wish you a wonderful day ahead. 🙏",
  "Hi {name}, hope you're doing well! Sending you a quick {timeOfDay} greeting and lots of good wishes. 😊",
  "Dear {name}, good {timeOfDay}! Thinking of you today — wishing you peace, health and joy. ✨",
  "Hello {name}! Just wanted to reach out and say I appreciate you. Have a great {timeOfDay}! 🌿",
  "Good {timeOfDay}, {name}. Wishing you a productive and blessed day today. Take care! 🙌",
  "Hi {name}, hope all is well with you and your family. Sending warm {timeOfDay} greetings your way! 💛",
];

// ---- Firebase setup ----
// firebaseConfig comes from firebase-config.js, loaded before this file.
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
try {
  // Lets the app keep working (read-only, from cache) briefly offline.
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
} catch (e) { /* not supported in this browser, ignore */ }

// Single doc holds the whole rotation state: which phone numbers have been
// greeted this round, and which round we're on. A subcollection holds one
// doc per calendar date, locking in that day's batch of 10 phone numbers.
const STATE_REF = db.collection('rotation').doc('state');
function batchRef(dateKey) {
  return STATE_REF.collection('batches').doc(dateKey);
}

let contacts = [];
let contactsByPhone = {};
let dayOffset = 0; // 0 = today (live), +1/-1 = preview only, never persisted
let busy = false; // guards against double-taps while a Firestore write is in flight

const listEl = document.getElementById('list');
const dateLabelEl = document.getElementById('dateLabel');
const progressEl = document.getElementById('progress');

function dateOnly(d) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function fmtDateKey(d) {
  const dd = dateOnly(d);
  return `${dd.getFullYear()}-${String(dd.getMonth() + 1).padStart(2, '0')}-${String(dd.getDate()).padStart(2, '0')}`;
}

function fmtDateLabel(d) {
  return d.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function timeOfDay() {
  const h = new Date().getHours();
  if (h < 12) return 'morning';
  if (h < 17) return 'afternoon';
  return 'evening';
}

function firstName(fullName) {
  return fullName.split(' ')[0];
}

function greetingFor(name, round) {
  const template = GREETING_TEMPLATES[round % GREETING_TEMPLATES.length];
  return template.replace(/{name}/g, firstName(name)).replace(/{timeOfDay}/g, timeOfDay());
}

function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ---- Firestore-backed state ----

async function getState() {
  const snap = await STATE_REF.get();
  if (!snap.exists) return { sentPhones: [], round: 1 };
  const data = snap.data();
  return { sentPhones: data.sentPhones || [], round: data.round || 1 };
}

async function markSent(phone) {
  await STATE_REF.set(
    { sentPhones: firebase.firestore.FieldValue.arrayUnion(phone) },
    { merge: true }
  );
}

async function unmarkSent(phone) {
  await STATE_REF.set(
    { sentPhones: firebase.firestore.FieldValue.arrayRemove(phone) },
    { merge: true }
  );
}

// Picks the next BATCH_SIZE contacts not yet greeted this round (auto-starts
// a new round if everyone's been done). Persists the new round if it starts one.
async function computeNextBatch(forPreviewOnly) {
  const state = await getState();
  let sentSet = new Set(state.sentPhones);
  let unsent = contacts.filter((c) => !sentSet.has(c.phone));
  let round = state.round;

  if (unsent.length === 0 && contacts.length > 0) {
    round += 1;
    if (!forPreviewOnly) {
      await STATE_REF.set({ sentPhones: [], round }, { merge: true });
    }
    unsent = contacts.slice();
  }

  return { phones: unsent.slice(0, BATCH_SIZE).map((c) => c.phone), round };
}

async function getOrCreateTodayBatch() {
  const dateKey = fmtDateKey(new Date());
  const ref = batchRef(dateKey);
  const snap = await ref.get();

  if (!snap.exists) {
    const { phones } = await computeNextBatch(false);
    await ref.set({ phones, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
    return phones;
  }

  // Drop any phone numbers no longer in contacts.json, top back up if room opened up.
  let phones = (snap.data().phones || []).filter((phone) => contactsByPhone[phone]);
  if (phones.length < BATCH_SIZE) {
    const state = await getState();
    const sentSet = new Set(state.sentPhones);
    const already = new Set(phones);
    const fillers = contacts
      .filter((c) => !sentSet.has(c.phone) && !already.has(c.phone))
      .slice(0, BATCH_SIZE - phones.length)
      .map((c) => c.phone);
    phones = phones.concat(fillers);
    await ref.set({ phones }, { merge: true });
  }
  return phones;
}

async function resetRotation() {
  await STATE_REF.set(
    { sentPhones: [], round: firebase.firestore.FieldValue.increment(1) },
    { merge: true }
  );
  await batchRef(fmtDateKey(new Date())).delete().catch(() => {});
}

// ---- Rendering ----

async function render() {
  const viewDate = new Date();
  viewDate.setDate(viewDate.getDate() + dayOffset);
  dateLabelEl.textContent = fmtDateLabel(viewDate) + (dayOffset === 0 ? ' (Today)' : '');

  contactsByPhone = {};
  contacts.forEach((c) => { contactsByPhone[c.phone] = c; });

  listEl.innerHTML = '<p class="loading">Loading…</p>';

  const state = await getState();
  const sentSet = new Set(state.sentPhones);
  const total = contacts.length;
  const greetedSoFar = contacts.filter((c) => sentSet.has(c.phone)).length;

  let phones, round;
  if (dayOffset === 0) {
    phones = await getOrCreateTodayBatch();
    round = (await getState()).round;
  } else {
    const result = await computeNextBatch(true);
    phones = result.phones;
    round = result.round;
  }

  progressEl.innerHTML = total
    ? `Round #${state.round} · ${greetedSoFar}/${total} greeted so far` +
      (dayOffset !== 0 ? ' <em>(preview)</em>' : '') +
      `<br><button id="resetRound" class="link-btn">Reset rotation</button>`
    : '';
  const resetBtn = document.getElementById('resetRound');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset the rotation? Everyone will be eligible to be greeted again from the top of the list.')) {
        await resetRotation();
        render();
      }
    });
  }

  listEl.innerHTML = '';
  if (phones.length === 0) {
    listEl.innerHTML = '<p class="loading">No contacts loaded.</p>';
    return;
  }

  phones.forEach((phone, i) => {
    const contact = contactsByPhone[phone];
    if (!contact) return;
    const message = greetingFor(contact.name, round - 1);
    const isSent = sentSet.has(contact.phone);

    const card = document.createElement('div');
    card.className = 'card' + (isSent ? ' sent' : '');

    const top = document.createElement('div');
    top.className = 'card-top';
    top.innerHTML = `
      <div>
        <div class="card-name">${i + 1}. ${escapeHtml(contact.name)}</div>
        <div class="card-phone">+${contact.phone}</div>
      </div>
    `;
    card.appendChild(top);

    const textarea = document.createElement('textarea');
    textarea.className = 'msg';
    textarea.value = message;

    const actions = document.createElement('div');
    actions.className = 'card-actions';

    const sendBtn = document.createElement('a');
    sendBtn.className = 'send-btn';
    sendBtn.target = '_blank';
    sendBtn.rel = 'noopener';
    sendBtn.textContent = 'Send on WhatsApp';
    sendBtn.href = waLink(contact.phone, textarea.value);
    textarea.addEventListener('input', () => {
      sendBtn.href = waLink(contact.phone, textarea.value);
    });

    const markBtn = document.createElement('button');
    markBtn.className = 'mark-btn';
    markBtn.textContent = isSent ? '✓ Sent' : 'Mark sent';
    markBtn.disabled = dayOffset !== 0; // only "Today" can actually mark sent
    markBtn.addEventListener('click', async () => {
      if (busy) return;
      busy = true;
      markBtn.disabled = true;
      try {
        if (isSent) await unmarkSent(contact.phone); else await markSent(contact.phone);
        await render();
      } finally {
        busy = false;
      }
    });

    actions.appendChild(sendBtn);
    actions.appendChild(markBtn);

    card.appendChild(textarea);
    card.appendChild(actions);
    listEl.appendChild(card);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('prevDay').addEventListener('click', () => { dayOffset -= 1; render(); });
document.getElementById('nextDay').addEventListener('click', () => { dayOffset += 1; render(); });
document.getElementById('resetToday').addEventListener('click', () => { dayOffset = 0; render(); });

fetch('contacts.json')
  .then((r) => r.json())
  .then((data) => {
    contacts = data;
    render();
  })
  .catch(() => {
    listEl.innerHTML = '<p class="loading">Could not load contacts.json.</p>';
  });

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
