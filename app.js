// ---- Configuration ----

// How many contacts to show at once by default, and the quick "load more"
// increments. There is no daily cap any more — load more adds onto what's
// already shown, any number of times, in one sitting or across many.
const DEFAULT_VISIBLE = 20;
const LOAD_MORE_OPTIONS = [10, 20, 50, 100];

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

// Single doc holds everything: which primary phone numbers have been sent
// to, and which are permanently ignored (no WhatsApp, asked not to be
// contacted, etc). No day-based locking — you can send to as many people
// as you want in one sitting, any time.
const STATE_REF = db.collection('rotation').doc('state');

let contacts = [];          // full list from contacts.json
let contactsByPhone = {};   // keyed by each contact's PRIMARY phone number
let allLabelCounts = [];    // [{label, count}], sorted by frequency desc

let selectedLabels = new Set(); // labels currently filtering the list (OR match)
let searchQuery = '';
let viewMode = 'pending'; // 'pending' | 'sent' | 'ignored' | 'all'
let visibleCount = DEFAULT_VISIBLE;
let busy = false; // guards against double-taps while a Firestore write is in flight

const listEl = document.getElementById('list');
const summaryEl = document.getElementById('summary');
const labelFiltersEl = document.getElementById('labelFilters');
const viewTabsEl = document.getElementById('viewTabs');
const searchInputEl = document.getElementById('searchInput');
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
  if (!snap.exists) return { sentPhones: [], ignoredPhones: [] };
  const data = snap.data();
  return {
    sentPhones: data.sentPhones || [],
    ignoredPhones: data.ignoredPhones || [],
  };
}

// Applies a batch of checkbox changes (sent + ignore) in one atomic write,
// so checking many boxes and tapping "Save changes" once only costs a
// single round-trip to Firestore instead of one write per person.
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
    }, { merge: true });
  });
}

async function resetAllSent() {
  // Clears everyone's "sent" status so the whole list is eligible again.
  // Ignored contacts stay ignored — this never touches ignoredPhones.
  await STATE_REF.set({ sentPhones: [] }, { merge: true });
}

// ---- Filtering ----

function buildLabelCounts() {
  const counts = new Map();
  contacts.forEach((c) => {
    (c.labels || []).forEach((l) => counts.set(l, (counts.get(l) || 0) + 1));
  });
  allLabelCounts = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count);
}

function matchesFilters(contact) {
  if (selectedLabels.size > 0) {
    const labels = contact.labels || [];
    if (!labels.some((l) => selectedLabels.has(l))) return false;
  }
  if (searchQuery) {
    if (!contact.name.toLowerCase().includes(searchQuery)) return false;
  }
  return true;
}

// Returns the list of contacts for the current view (pending/sent/ignored/all),
// given the current sent/ignored sets and label+search filters.
function computeViewList(sentSet, ignoredSet) {
  return contacts.filter((c) => {
    const isIgnored = ignoredSet.has(c.phone);
    const isSent = sentSet.has(c.phone);
    if (viewMode === 'pending' && (isIgnored || isSent)) return false;
    if (viewMode === 'sent' && (isIgnored || !isSent)) return false;
    if (viewMode === 'ignored' && !isIgnored) return false;
    // 'all' shows everyone regardless of sent/ignored
    return matchesFilters(c);
  });
}

// ---- Rendering ----

async function render() {
  contactsByPhone = {};
  contacts.forEach((c) => { contactsByPhone[c.phone] = c; });

  const state = await getState();
  const sentSet = new Set(state.sentPhones);
  const ignoredSet = new Set(state.ignoredPhones);
  const activeContacts = contacts.filter((c) => !ignoredSet.has(c.phone));

  renderLabelFilters();
  renderViewTabs(sentSet, ignoredSet);

  summaryEl.innerHTML =
    `${contacts.length} contacts total · ${activeContacts.length - activeContacts.filter((c) => sentSet.has(c.phone)).length} pending · ` +
    `${sentSet.size} sent · ${ignoredSet.size} ignored` +
    `<br><button id="resetSentBtn" class="link-btn">Reset all "sent" status</button>`;
  const resetBtn = document.getElementById('resetSentBtn');
  if (resetBtn) {
    resetBtn.addEventListener('click', async () => {
      if (confirm('Reset "sent" status for everyone? Ignored contacts stay ignored. This cannot be undone.')) {
        await resetAllSent();
        render();
      }
    });
  }

  const viewList = computeViewList(sentSet, ignoredSet);
  const viewDate = new Date();

  listEl.innerHTML = '';
  if (viewList.length === 0) {
    listEl.innerHTML = '<p class="loading">No contacts match the current filters.</p>';
    return;
  }

  const visible = viewList.slice(0, visibleCount);

  // Tracks each visible card's checkboxes so "Save changes" can read all of
  // them at once and diff against what was already stored.
  const cardStates = [];

  visible.forEach((contact, i) => {
    const message = greetingFor(contact, viewDate);
    const wasSent = sentSet.has(contact.phone);
    const wasIgnored = ignoredSet.has(contact.phone);

    const card = document.createElement('div');
    card.className = 'card' + (wasSent ? ' sent' : '') + (wasIgnored ? ' ignored' : '');

    const top = document.createElement('div');
    top.className = 'card-top';
    const labelsHtml = (contact.labels || []).length
      ? `<div class="card-labels">${contact.labels.map((l) => `<span class="label-chip-mini">${escapeHtml(l)}</span>`).join('')}</div>`
      : '';
    top.innerHTML = `
      <div>
        <div class="card-name">${i + 1}. ${escapeHtml(contact.name)}</div>
        <div class="card-phone">+${contact.phone}</div>
        ${labelsHtml}
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
      altLinks.forEach((a) => { a.href = waLink(a.dataset.phone, textarea.value); });
    });
    actions.appendChild(sendBtn);
    card.appendChild(textarea);
    card.appendChild(actions);

    // Extra numbers for this same person — not separate greetings, just
    // alternate numbers to try the same message on if the primary one
    // isn't on WhatsApp.
    const altLinks = [];
    const altNumbers = (contact.phones || []).filter((p) => p !== contact.phone);
    if (altNumbers.length > 0) {
      const altWrap = document.createElement('div');
      altWrap.className = 'alt-numbers';
      const label = document.createElement('span');
      label.className = 'alt-numbers-label';
      label.textContent = 'Other number' + (altNumbers.length > 1 ? 's' : '') + ' on file: ';
      altWrap.appendChild(label);
      altNumbers.forEach((p) => {
        const a = document.createElement('a');
        a.className = 'alt-link';
        a.target = '_blank';
        a.rel = 'noopener';
        a.dataset.phone = p;
        a.href = waLink(p, textarea.value);
        a.textContent = '+' + p;
        altLinks.push(a);
        altWrap.appendChild(a);
      });
      card.appendChild(altWrap);
    }

    const checks = document.createElement('div');
    checks.className = 'card-checks';

    const sentLabel = document.createElement('label');
    const sentCheckbox = document.createElement('input');
    sentCheckbox.type = 'checkbox';
    sentCheckbox.checked = wasSent;
    sentLabel.appendChild(sentCheckbox);
    sentLabel.appendChild(document.createTextNode(' Sent'));

    const ignoreLabel = document.createElement('label');
    const ignoreCheckbox = document.createElement('input');
    ignoreCheckbox.type = 'checkbox';
    ignoreCheckbox.checked = wasIgnored;
    ignoreLabel.appendChild(ignoreCheckbox);
    ignoreLabel.appendChild(document.createTextNode(' Ignore (no WhatsApp / skip)'));

    checks.appendChild(sentLabel);
    checks.appendChild(ignoreLabel);
    card.appendChild(checks);

    listEl.appendChild(card);

    cardStates.push({ phone: contact.phone, wasSent, wasIgnored, sentCheckbox, ignoreCheckbox });
  });

  // "Load more" — adds onto what's already shown, as many times as wanted.
  const remaining = viewList.length - visible.length;
  if (remaining > 0) {
    const loadWrap = document.createElement('div');
    loadWrap.className = 'load-more-wrap';
    LOAD_MORE_OPTIONS.forEach((n) => {
      if (n > remaining && n !== Math.min(...LOAD_MORE_OPTIONS)) return; // skip options that don't make sense, but always keep the smallest
      const btn = document.createElement('button');
      btn.className = 'ghost';
      btn.textContent = `+${Math.min(n, remaining)} more`;
      btn.addEventListener('click', () => {
        visibleCount += n;
        render();
      });
      loadWrap.appendChild(btn);
    });
    const allBtn = document.createElement('button');
    allBtn.className = 'ghost';
    allBtn.textContent = `Show all ${viewList.length}`;
    allBtn.addEventListener('click', () => {
      visibleCount = viewList.length;
      render();
    });
    loadWrap.appendChild(allBtn);
    listEl.appendChild(loadWrap);
  }

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

function renderLabelFilters() {
  labelFiltersEl.innerHTML = '';
  allLabelCounts.forEach(({ label, count }) => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'label-chip' + (selectedLabels.has(label) ? ' active' : '');
    chip.textContent = `${label} (${count})`;
    chip.addEventListener('click', () => {
      if (selectedLabels.has(label)) selectedLabels.delete(label); else selectedLabels.add(label);
      visibleCount = DEFAULT_VISIBLE;
      render();
    });
    labelFiltersEl.appendChild(chip);
  });
  if (selectedLabels.size > 0) {
    const clearBtn = document.createElement('button');
    clearBtn.type = 'button';
    clearBtn.className = 'label-chip clear';
    clearBtn.textContent = 'Clear label filters ✕';
    clearBtn.addEventListener('click', () => {
      selectedLabels.clear();
      visibleCount = DEFAULT_VISIBLE;
      render();
    });
    labelFiltersEl.appendChild(clearBtn);
  }
}

function renderViewTabs(sentSet, ignoredSet) {
  const activeContacts = contacts.filter((c) => !ignoredSet.has(c.phone) && matchesFilters(c));
  const allMatching = contacts.filter(matchesFilters);
  const tabs = [
    { key: 'pending', label: 'Pending', count: activeContacts.filter((c) => !sentSet.has(c.phone)).length },
    { key: 'sent', label: 'Sent', count: activeContacts.filter((c) => sentSet.has(c.phone)).length },
    { key: 'ignored', label: 'Ignored', count: allMatching.filter((c) => ignoredSet.has(c.phone)).length },
    { key: 'all', label: 'All', count: allMatching.length },
  ];
  viewTabsEl.innerHTML = '';
  tabs.forEach((t) => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'view-tab' + (viewMode === t.key ? ' active' : '');
    btn.textContent = `${t.label} (${t.count})`;
    btn.addEventListener('click', () => {
      viewMode = t.key;
      visibleCount = DEFAULT_VISIBLE;
      render();
    });
    viewTabsEl.appendChild(btn);
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

let searchDebounce = null;
searchInputEl.addEventListener('input', () => {
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(() => {
    searchQuery = searchInputEl.value.trim().toLowerCase();
    visibleCount = DEFAULT_VISIBLE;
    render();
  }, 200);
});

function loadContactsAndRender() {
  fetch('contacts.json')
    .then((r) => r.json())
    .then((data) => {
      contacts = data;
      buildLabelCounts();
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
