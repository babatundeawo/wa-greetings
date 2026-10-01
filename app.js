// ---- Configuration ----
const BATCH_SIZE = 20;

// All greetings are deliberately written WITHOUT using the contact's name —
// a generic respectful salutation is used instead ("Good morning", "Dear
// beloved", etc.) so the message reads appropriately whether the recipient
// is older, younger, a stranger, or well known to you.
//
// Bible verses quoted below are King James Version (KJV) wording, which is
// public domain, cited by reference.

// ---- Day-of-week themed templates ----
// Date.getDay(): 0 = Sunday ... 6 = Saturday. Sunday is treated as the
// first day of the week here (the "new week" theme sits on Sunday, not
// Monday), matching how the week is reckoned for these greetings.
const WEEKDAY_TEMPLATES = {
  0: [ // Sunday — first day of the week: worship, rest, a fresh week ahead
    "Good {timeOfDay} to you. As a new week begins, I pray it is filled with God's peace and direction. \"This is the day which the LORD hath made; we will rejoice and be glad in it.\" — Psalm 118:24 (KJV). Happy new week, and a blessed Sunday. 🙏",
    "Good {timeOfDay}. Wishing you a restful and worshipful Sunday as a brand new week opens up before you. \"Come unto me, all ye that labour and are heavy laden, and I will give you rest.\" — Matthew 11:28 (KJV). 🌿",
    "Good {timeOfDay} to you. May this new week bring fresh grace and renewed strength your way. \"They that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles.\" — Isaiah 40:31 (KJV). Happy new week! 🙏",
  ],
  1: [ // Monday — carrying the week's momentum forward
    "Good {timeOfDay} to you. I pray the week continues to unfold in your favour, with strength for every task ahead. \"I can do all things through Christ which strengtheneth me.\" — Philippians 4:13 (KJV). 💪",
    "Good {timeOfDay}. May this day be marked by clarity and steady progress in all you set your hand to. \"Commit thy works unto the LORD, and thy thoughts shall be established.\" — Proverbs 16:3 (KJV). 🙏",
  ],
  2: [ // Tuesday — diligence
    "Good {timeOfDay} to you. Wishing you diligence and fruitfulness in all your labour today. \"And whatsoever ye do, do it heartily, as to the Lord, and not unto men.\" — Colossians 3:23 (KJV). 🌟",
    "Good {timeOfDay}. May today's efforts be met with God's blessing and good success. \"Whatsoever thy hand findeth to do, do it with thy might.\" — Ecclesiastes 9:10 (KJV). 🙌",
  ],
  3: [ // Wednesday — midweek encouragement, wisdom
    "Good {timeOfDay} to you, halfway through the week. May you be granted wisdom for every decision today. \"If any of you lack wisdom, let him ask of God, that giveth to all men liberally.\" — James 1:5 (KJV). 🙏",
    "Good {timeOfDay}. Wishing you renewed strength for the rest of the week. \"But they that wait upon the LORD shall renew their strength.\" — Isaiah 40:31 (KJV). 🌿",
  ],
  4: [ // Thursday — gratitude
    "Good {timeOfDay} to you. Wishing you a heart full of gratitude today, no matter how the week has gone so far. \"In every thing give thanks: for this is the will of God.\" — 1 Thessalonians 5:18 (KJV). 💛",
    "Good {timeOfDay}. May today be filled with reasons to be thankful and moments of real joy. \"This is the day which the LORD hath made; we will rejoice and be glad in it.\" — Psalm 118:24 (KJV). ✨",
  ],
  5: [ // Friday — grace, closing the week well
    "Good {timeOfDay} to you. As the week draws to a close, may God's grace carry you well into the weekend. \"My grace is sufficient for thee: for my strength is made perfect in weakness.\" — 2 Corinthians 12:9 (KJV). Happy Friday! 🎉",
    "Good {timeOfDay}. Wishing you a well-deserved rest as this week comes to an end. \"The LORD shall preserve thy going out and thy coming in.\" — Psalm 121:8 (KJV). 😊",
  ],
  6: [ // Saturday — rest, family
    "Good {timeOfDay} to you. Wishing you a restful Saturday and good time with loved ones. \"Six days shalt thou labour... but the seventh day is the sabbath... in it thou shalt not do any work.\" — Exodus 20:9-10 (KJV). 🌿",
    "Good {timeOfDay}. May today bring you true rest and refreshing. \"Come unto me, all ye that labour and are heavy laden, and I will give you rest.\" — Matthew 11:28 (KJV). 🙏",
  ],
};

// ---- New-month templates ----
// Used only on the 1st of each month, in place of the day-of-week pool —
// Nigerian church custom of sending "Happy New Month" prayers on day one.
const NEW_MONTH_TEMPLATES = [
  "Good {timeOfDay} to you, and happy new month of {month}! I pray this month is marked by God's mercy and faithfulness in your life. \"It is of the LORD's mercies that we are not consumed, because his compassions fail not. They are new every morning: great is thy faithfulness.\" — Lamentations 3:22-23 (KJV). 🙏",
  "Good {timeOfDay}. As {month} begins, may it bring you fresh grace, good health, and open doors. \"The LORD will give grace and glory: no good thing will he withhold from them that walk uprightly.\" — Psalm 84:11 (KJV). Happy new month! 🌟",
  "Good {timeOfDay} to you. Welcoming {month} with a prayer that all your needs are met abundantly this month. \"But my God shall supply all your need according to his riches in glory by Christ Jesus.\" — Philippians 4:19 (KJV). Happy new month! 💛",
];

// Simple, dependency-free string hash so the "random" pick is deterministic
// per contact+day (stable if you reload the page) but varies across
// contacts and across days, without needing to store anything extra.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 31 + str.charCodeAt(i)) >>> 0;
  }
  return hash;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

// ---- Firebase setup ----
// firebaseConfig comes from firebase-config.js, loaded before this file.
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
try {
  // Lets the app keep working (read-only, from cache) briefly offline.
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
} catch (e) { /* not supported in this browser, ignore */ }

// Single doc holds the whole rotation state: which phone numbers have been
// greeted this round, and which round we're on. A subcollection holds one
// doc per calendar date, locking in that day's batch of phone numbers.
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
const appEl = document.getElementById('app');
const loginEl = document.getElementById('login');
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');
const signOutBtn = document.getElementById('signOutBtn');

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

function greetingFor(contact, viewDate) {
  const isFirstOfMonth = viewDate.getDate() === 1;
  const pool = isFirstOfMonth ? NEW_MONTH_TEMPLATES : (WEEKDAY_TEMPLATES[viewDate.getDay()] || []);
  const dateKey = fmtDateKey(viewDate);
  const idx = hashString(contact.phone + '|' + dateKey) % pool.length;
  const template = pool[idx];
  return template
    .replace(/{timeOfDay}/g, timeOfDay())
    .replace(/{month}/g, MONTH_NAMES[viewDate.getMonth()]);
}

function waLink(phone, message) {
  return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
}

// ---- Firestore-backed state ----

async function getState() {
  const snap = await STATE_REF.get();
  if (!snap.exists) return { sentPhones: [], ignoredPhones: [], round: 1 };
  const data = snap.data();
  return {
    sentPhones: data.sentPhones || [],
    ignoredPhones: data.ignoredPhones || [],
    round: data.round || 1,
  };
}

// Applies a batch of checkbox changes (sent + ignore) in one atomic write,
// so checking 20 boxes and tapping "Save changes" once only costs a single
// round-trip to Firestore instead of one write per person.
async function commitChanges({ sentAdd, sentRemove, ignoreAdd, ignoreRemove }) {
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(STATE_REF);
    const data = snap.exists ? snap.data() : {};
    const sentSet = new Set(data.sentPhones || []);
    const ignoredSet = new Set(data.ignoredPhones || []);

    sentAdd.forEach((p) => sentSet.add(p));
    sentRemove.forEach((p) => sentSet.delete(p));
    ignoreAdd.forEach((p) => ignoredSet.add(p));
    ignoreRemove.forEach((p) => ignoredSet.delete(p));

    tx.set(STATE_REF, {
      sentPhones: [...sentSet],
      ignoredPhones: [...ignoredSet],
      round: data.round || 1,
    }, { merge: true });
  });
}

// Picks the next BATCH_SIZE contacts that are neither sent nor ignored this
// round (auto-starts a new round if everyone active has been done).
// Ignored contacts are excluded permanently, not just for this round.
async function computeNextBatch(forPreviewOnly) {
  const state = await getState();
  let sentSet = new Set(state.sentPhones);
  const ignoredSet = new Set(state.ignoredPhones);
  const activeContacts = contacts.filter((c) => !ignoredSet.has(c.phone));
  let unsent = activeContacts.filter((c) => !sentSet.has(c.phone));
  let round = state.round;

  if (unsent.length === 0 && activeContacts.length > 0) {
    round += 1;
    if (!forPreviewOnly) {
      await STATE_REF.set({ sentPhones: [], round }, { merge: true });
    }
    unsent = activeContacts.slice();
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
    const ignoredSet = new Set(state.ignoredPhones);
    const already = new Set(phones);
    const fillers = contacts
      .filter((c) => !sentSet.has(c.phone) && !ignoredSet.has(c.phone) && !already.has(c.phone))
      .slice(0, BATCH_SIZE - phones.length)
      .map((c) => c.phone);
    phones = phones.concat(fillers);
    await ref.set({ phones }, { merge: true });
  }
  return phones;
}

async function resetRotation() {
  // Only resets who's been greeted this round — ignored contacts (no
  // WhatsApp, shouldn't be messaged, etc.) stay ignored across resets.
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
  const ignoredSet = new Set(state.ignoredPhones);
  const activeContacts = contacts.filter((c) => !ignoredSet.has(c.phone));
  const total = activeContacts.length;
  const greetedSoFar = activeContacts.filter((c) => sentSet.has(c.phone)).length;

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
      (ignoredSet.size ? ` · ${ignoredSet.size} ignored` : '') +
      (dayOffset !== 0 ? ' <em>(preview)</em>' : '') +
      `<br><button id="resetRound" class="link-btn">Reset rotation</button>`
    : '';
  const resetBtn = document.getElementById('resetRound');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset the rotation? Everyone (except ignored contacts) will be eligible to be greeted again from the top of the list.')) {
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

  // Tracks each visible card's checkboxes so "Save changes" can read all of
  // them at once and diff against what was already stored.
  const cardStates = [];

  phones.forEach((phone, i) => {
    const contact = contactsByPhone[phone];
    if (!contact) return;
    const message = greetingFor(contact, viewDate);
    const wasSent = sentSet.has(contact.phone);
    const wasIgnored = ignoredSet.has(contact.phone);

    const card = document.createElement('div');
    card.className = 'card' + (wasSent ? ' sent' : '') + (wasIgnored ? ' ignored' : '');

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
    actions.appendChild(sendBtn);

    const checks = document.createElement('div');
    checks.className = 'card-checks';

    const sentLabel = document.createElement('label');
    const sentCheckbox = document.createElement('input');
    sentCheckbox.type = 'checkbox';
    sentCheckbox.checked = wasSent;
    sentCheckbox.disabled = dayOffset !== 0; // only "Today" can actually be saved
    sentLabel.appendChild(sentCheckbox);
    sentLabel.appendChild(document.createTextNode(' Sent'));

    const ignoreLabel = document.createElement('label');
    const ignoreCheckbox = document.createElement('input');
    ignoreCheckbox.type = 'checkbox';
    ignoreCheckbox.checked = wasIgnored;
    ignoreCheckbox.disabled = dayOffset !== 0;
    ignoreLabel.appendChild(ignoreCheckbox);
    ignoreLabel.appendChild(document.createTextNode(' Ignore (no WhatsApp / skip)'));

    checks.appendChild(sentLabel);
    checks.appendChild(ignoreLabel);

    card.appendChild(textarea);
    card.appendChild(actions);
    card.appendChild(checks);
    listEl.appendChild(card);

    cardStates.push({ phone: contact.phone, wasSent, wasIgnored, sentCheckbox, ignoreCheckbox });
  });

  if (dayOffset === 0) {
    const saveWrap = document.createElement('div');
    saveWrap.className = 'save-wrap';
    const saveBtn = document.createElement('button');
    saveBtn.className = 'send-btn';
    saveBtn.textContent = 'Save changes';
    saveWrap.appendChild(saveBtn);
    const saveMsg = document.createElement('p');
    saveMsg.className = 'save-msg';
    saveWrap.appendChild(saveMsg);
    listEl.appendChild(saveWrap);

    saveBtn.addEventListener('click', async () => {
      if (busy) return;
      const sentAdd = [], sentRemove = [], ignoreAdd = [], ignoreRemove = [];
      cardStates.forEach((cs) => {
        if (cs.sentCheckbox.checked && !cs.wasSent) sentAdd.push(cs.phone);
        if (!cs.sentCheckbox.checked && cs.wasSent) sentRemove.push(cs.phone);
        if (cs.ignoreCheckbox.checked && !cs.wasIgnored) ignoreAdd.push(cs.phone);
        if (!cs.ignoreCheckbox.checked && cs.wasIgnored) ignoreRemove.push(cs.phone);
      });
      if (!sentAdd.length && !sentRemove.length && !ignoreAdd.length && !ignoreRemove.length) {
        saveMsg.textContent = 'No changes to save.';
        return;
      }
      busy = true;
      saveBtn.disabled = true;
      saveMsg.textContent = 'Saving…';
      try {
        await commitChanges({ sentAdd, sentRemove, ignoreAdd, ignoreRemove });
        await render();
      } catch (err) {
        saveMsg.textContent = 'Could not save — check your connection and try again.';
        saveBtn.disabled = false;
      } finally {
        busy = false;
      }
    });
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

document.getElementById('prevDay').addEventListener('click', () => { dayOffset -= 1; render(); });
document.getElementById('nextDay').addEventListener('click', () => { dayOffset += 1; render(); });
document.getElementById('resetToday').addEventListener('click', () => { dayOffset = 0; render(); });

function loadContactsAndRender() {
  fetch('contacts.json')
    .then((r) => r.json())
    .then((data) => {
      contacts = data;
      render();
    })
    .catch(() => {
      listEl.innerHTML = '<p class="loading">Could not load contacts.json.</p>';
    });
}

// ---- Authentication gate ----
// Only a signed-in Firebase user can see or interact with the app. There is
// no sign-up flow — the one allowed account is created directly in the
// Firebase Console (Authentication → Users), not in this code.

loginForm.addEventListener('submit', (e) => {
  e.preventDefault();
  loginError.textContent = '';
  const email = document.getElementById('loginEmail').value.trim();
  const password = document.getElementById('loginPassword').value;
  auth.signInWithEmailAndPassword(email, password).catch((err) => {
    loginError.textContent = 'Sign-in failed: ' + (err.message || 'check your email and password.');
  });
});

signOutBtn.addEventListener('click', () => {
  auth.signOut();
});

auth.onAuthStateChanged((user) => {
  if (user) {
    loginEl.style.display = 'none';
    appEl.style.display = '';
    loadContactsAndRender();
  } else {
    loginEl.style.display = '';
    appEl.style.display = 'none';
  }
});

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
