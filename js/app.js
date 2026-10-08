/**
 * Daily Greetings: main module.
 *
 * Data lives in Firestore behind sign-in:
 *   contactBook/part-NNN   the contact list, split into parts of PART_SIZE
 *   rotation/state         { sentPhones: [...] }  primary numbers already greeted
 *
 * All text from contacts is written with textContent, never innerHTML.
 */
import { greetingFor, themeNameFor, waLink } from './messages.js';
import { readContactsFile, diffContacts } from './importer.js';

/* global firebase, firebaseConfig */

// ---------------------------------------------------------------- Config
const DEFAULT_VISIBLE = 20;
const LOAD_MORE_OPTIONS = [10, 20, 50, 100];
const PART_SIZE = 800; // contacts per Firestore document, well under the 1 MB limit
const THEME_KEY = 'dg-theme';

// -------------------------------------------------------------- Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
const FieldValue = firebase.firestore.FieldValue;
const STATE_REF = db.collection('rotation').doc('state');
const BOOK = db.collection('contactBook');

// Sign in afresh on every open: no session is remembered between visits, and
// a forced sign-out clears any session an older version may have left behind.
const authReady = auth.setPersistence(firebase.auth.Auth.Persistence.NONE)
  .catch(() => {})
  .then(() => auth.signOut().catch(() => {}));

try {
  // Lets the list open from this device's cache when offline.
  db.enablePersistence({ synchronizeTabs: true }).catch(() => {});
} catch (e) { /* not supported in this browser */ }

// ----------------------------------------------------------------- State
let contacts = [];
let sentSet = new Set();
let labelCounts = [];
let loadError = null;
let loaded = false;

const selectedLabels = new Set();
let labelsOpen = false;
let searchQuery = '';
let viewMode = 'pending'; // 'pending' | 'sent' | 'all'
let visibleCount = DEFAULT_VISIBLE;
let firstRender = true;
let renderedDay = '';

const dirty = new Map(); // phone -> desired sent state, not yet saved
const edits = new Map(); // phone -> message the user edited, kept across re-renders
let pendingImport = null;

// -------------------------------------------------------------- Elements
const $ = (id) => document.getElementById(id);
const el = {
  login: $('login'), loginForm: $('loginForm'), loginEmail: $('loginEmail'),
  loginPassword: $('loginPassword'), loginError: $('loginError'), loginSubmit: $('loginSubmit'),
  togglePassword: $('togglePassword'),
  app: $('app'), topbar: $('topbar'), offline: $('offline'),
  list: $('list'), search: $('searchInput'), labelFilters: $('labelFilters'), tabs: $('viewTabs'),
  todayDay: $('todayDay'), todayTheme: $('todayTheme'),
  progressBar: $('progressBar'), progressFill: $('progressFill'),
  progressSent: $('progressSent'), progressPending: $('progressPending'),
  savebar: $('savebar'), savebarText: $('savebarText'), saveBtn: $('saveBtn'), discardBtn: $('discardBtn'),
  toasts: $('toasts'),
  themeBtn: $('themeBtn'), signOutBtn: $('signOutBtn'), importBtn: $('importBtn'), resetBtn: $('resetSentBtn'),
  importDialog: $('importDialog'), importFile: $('importFile'), importPreview: $('importPreview'),
  importError: $('importError'), importConfirm: $('importConfirm'), importCancel: $('importCancel'),
  statAdded: $('statAdded'), statKept: $('statKept'), statRemoved: $('statRemoved'),
  confirmDialog: $('confirmDialog'), confirmCancel: $('confirmCancel'), confirmReset: $('confirmReset'),
};

// --------------------------------------------------------------- Helpers
const SVG_NS = 'http://www.w3.org/2000/svg';

function h(tag, props = {}, ...children) {
  const node = document.createElement(tag);
  for (const [key, value] of Object.entries(props)) {
    if (value === undefined || value === null || value === false) continue;
    if (key === 'class') node.className = value;
    else if (key === 'text') node.textContent = value;
    else if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
    else node.setAttribute(key, value === true ? '' : value);
  }
  children.flat().forEach((c) => { if (c) node.append(c); });
  return node;
}

function icon(name) {
  const svg = document.createElementNS(SVG_NS, 'svg');
  svg.setAttribute('class', 'icon');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(SVG_NS, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
}

function toast(message, kind = 'info', ms = 3600) {
  const node = h('div', { class: `toast toast--${kind}`, text: message });
  el.toasts.append(node);
  setTimeout(() => node.remove(), ms);
}

function describeError(err) {
  const code = err && err.code ? err.code : '';
  if (code === 'permission-denied') {
    return 'The database refused access. Publish the latest firestore.rules in Firebase, then try again.';
  }
  if (code === 'unavailable' || code === 'network-request-failed') {
    return 'Could not reach the database. Check your connection and try again.';
  }
  return 'Something went wrong. Try again in a moment.';
}

const dayKey = (d) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;

// ------------------------------------------------------------------ Data
async function loadSent() {
  const snap = await STATE_REF.get();
  const data = snap.exists ? snap.data() : {};
  const sent = new Set(data.sentPhones || []);
  // One-time cleanup: the old "ignored" status is folded into "sent".
  const ignored = data.ignoredPhones || [];
  if (ignored.length) {
    ignored.forEach((p) => sent.add(p));
    await STATE_REF.set({ sentPhones: [...sent], ignoredPhones: [] }, { merge: true });
  }
  return sent;
}

async function loadContacts() {
  const snap = await BOOK.orderBy('index').get();
  return snap.docs.flatMap((doc) => doc.data().list || []);
}

async function writeSent(add, remove) {
  if (add.length) {
    await STATE_REF.set({ sentPhones: FieldValue.arrayUnion(...add) }, { merge: true });
  }
  if (remove.length) {
    await STATE_REF.set({ sentPhones: FieldValue.arrayRemove(...remove) }, { merge: true });
  }
}

async function saveContacts(list) {
  const parts = [];
  for (let i = 0; i < list.length; i += PART_SIZE) parts.push(list.slice(i, i + PART_SIZE));
  const keep = new Set();
  const batch = db.batch();
  parts.forEach((part, i) => {
    const id = `part-${String(i + 1).padStart(3, '0')}`;
    keep.add(id);
    batch.set(BOOK.doc(id), { index: i, list: part, updatedAt: FieldValue.serverTimestamp() });
  });
  const existing = await BOOK.get();
  existing.docs.forEach((doc) => { if (!keep.has(doc.id)) batch.delete(doc.ref); });
  await batch.commit();
}

function buildLabelCounts() {
  const counts = new Map();
  contacts.forEach((c) => (c.labels || []).forEach((l) => counts.set(l, (counts.get(l) || 0) + 1)));
  labelCounts = [...counts.entries()]
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

async function loadAll() {
  loadError = null;
  loaded = false;
  renderList();
  try {
    [contacts, sentSet] = await Promise.all([loadContacts(), loadSent()]);
    buildLabelCounts();
    loaded = true;
  } catch (err) {
    loadError = describeError(err);
  }
  renderAll();
}

// ------------------------------------------------------------- Filtering
function matches(contact) {
  if (selectedLabels.size && !(contact.labels || []).some((l) => selectedLabels.has(l))) return false;
  if (searchQuery && !contact.name.toLowerCase().includes(searchQuery)) return false;
  return true;
}

function viewList() {
  return contacts.filter((c) => {
    const sent = sentSet.has(c.phone);
    if (viewMode === 'pending' && sent) return false;
    if (viewMode === 'sent' && !sent) return false;
    return matches(c);
  });
}

// ------------------------------------------------------------- Rendering
function renderAll() {
  renderToday();
  renderProgress();
  renderLabelFilters();
  renderTabs();
  renderList();
  renderSavebar();
}

function renderToday() {
  const now = new Date();
  renderedDay = dayKey(now);
  el.todayDay.textContent = now.toLocaleDateString(undefined, { weekday: 'long' });
  el.todayTheme.replaceChildren(
    'Theme today: ',
    h('strong', { text: themeNameFor(now) }),
    ` · ${now.toLocaleDateString(undefined, { day: 'numeric', month: 'long' })}`,
  );
}

function renderProgress() {
  const total = contacts.length;
  const sent = contacts.filter((c) => sentSet.has(c.phone)).length;
  const pct = total ? Math.round((sent / total) * 100) : 0;
  el.progressFill.style.setProperty('--p', `${pct}%`);
  el.progressBar.setAttribute('aria-valuenow', String(pct));
  el.progressSent.textContent = `${sent} sent`;
  el.progressPending.textContent = `${total - sent} pending of ${total}`;
}

function renderTabs() {
  const pool = contacts.filter(matches);
  const sent = pool.filter((c) => sentSet.has(c.phone)).length;
  const tabs = [
    ['pending', 'Pending', pool.length - sent],
    ['sent', 'Sent', sent],
    ['all', 'All', pool.length],
  ];
  el.tabs.replaceChildren(...tabs.map(([key, label, count]) => h('button', {
    type: 'button',
    'aria-pressed': String(viewMode === key),
    text: `${label} ${count}`,
    onclick: () => { viewMode = key; visibleCount = DEFAULT_VISIBLE; renderTabs(); renderList(); },
  })));
}

function renderLabelFilters() {
  const details = h('details', { class: 'dropdown' });
  details.open = labelsOpen;
  details.addEventListener('toggle', () => { labelsOpen = details.open; });

  const summary = h('summary', {},
    h('span', { text: 'Filter by label' }),
    selectedLabels.size ? h('span', { class: 'dropdown__count', text: String(selectedLabels.size) }) : null,
    icon('chevron'));
  const panel = h('div', { class: 'dropdown__panel' });

  if (!labelCounts.length) {
    panel.append(h('p', { class: 'dropdown__empty', text: 'No labels found in your contacts.' }));
  }
  labelCounts.forEach(({ label, count }) => {
    const input = h('input', { type: 'checkbox' });
    input.checked = selectedLabels.has(label);
    input.addEventListener('change', () => {
      if (input.checked) selectedLabels.add(label); else selectedLabels.delete(label);
      visibleCount = DEFAULT_VISIBLE;
      labelsOpen = true;
      renderLabelFilters(); renderTabs(); renderList();
    });
    panel.append(h('label', { class: 'option' }, input, h('span', { text: label }), h('span', { class: 'option__count', text: String(count) })));
  });
  if (selectedLabels.size) {
    panel.append(h('button', {
      type: 'button', class: 'text-btn', text: 'Clear label filters',
      onclick: () => {
        selectedLabels.clear(); visibleCount = DEFAULT_VISIBLE; labelsOpen = true;
        renderLabelFilters(); renderTabs(); renderList();
      },
    }));
  }
  details.append(summary, panel);
  el.labelFilters.replaceChildren(details);
}

function skeleton() {
  return h('div', { class: 'skeleton', 'aria-hidden': 'true' }, h('i'), h('i'), h('i'));
}

function stateBlock(title, text, action) {
  return h('div', { class: `state${action && action.error ? ' state--error' : ''}` },
    h('h3', { class: 'state__title', text: title }),
    h('p', { class: 'state__text', text }),
    action ? h('button', { type: 'button', class: 'btn', text: action.label, onclick: action.run }) : null);
}

function autosize(textarea) {
  textarea.style.height = 'auto';
  textarea.style.height = `${textarea.scrollHeight + 2}px`;
}

function renderCard(contact, now, index) {
  const wasSent = sentSet.has(contact.phone);
  const checked = dirty.has(contact.phone) ? dirty.get(contact.phone) : wasSent;
  const message = edits.get(contact.phone) ?? greetingFor(contact, now);

  const card = h('article', { class: `card${checked ? ' is-sent' : ''}${firstRender && index < 6 ? ' enter' : ''}` });
  if (firstRender && index < 6) card.style.setProperty('--i', String(index + 3));

  const toggle = h('input', { type: 'checkbox', class: 'switch__input' });
  toggle.checked = checked;

  const textarea = h('textarea', { class: 'bubble__text', rows: '3', 'aria-label': `Message for ${contact.name}`, spellcheck: 'true' });
  textarea.value = message;

  const send = h('a', {
    class: 'btn btn--send', target: '_blank', rel: 'noopener noreferrer',
    href: waLink(contact.phone, message),
  }, icon('send'), 'Send on WhatsApp');

  const altNumbers = (contact.phones || []).filter((p) => p !== contact.phone);
  const altLinks = altNumbers.map((p) => h('a', {
    target: '_blank', rel: 'noopener noreferrer', href: waLink(p, message), 'data-phone': p, text: `+${p}`,
  }));

  const syncLinks = () => {
    send.href = waLink(contact.phone, textarea.value);
    altLinks.forEach((a) => { a.href = waLink(a.dataset.phone, textarea.value); });
  };
  textarea.addEventListener('input', () => {
    edits.set(contact.phone, textarea.value);
    syncLinks();
    autosize(textarea);
  });

  toggle.addEventListener('change', () => {
    card.classList.toggle('is-sent', toggle.checked);
    if (toggle.checked === sentSet.has(contact.phone)) dirty.delete(contact.phone);
    else dirty.set(contact.phone, toggle.checked);
    renderSavebar();
  });

  // Tapping a send link marks the contact as sent straight away. The browser
  // cannot tell whether the chat opened or the number is on WhatsApp, so it
  // always marks. Untick Sent and save to undo.
  const markSent = async () => {
    toggle.checked = true;
    card.classList.add('is-sent');
    if (sentSet.has(contact.phone)) return;
    dirty.delete(contact.phone);
    sentSet.add(contact.phone);
    renderProgress(); renderTabs(); renderSavebar();
    try {
      await writeSent([contact.phone], []);
    } catch (err) {
      sentSet.delete(contact.phone);
      dirty.set(contact.phone, true);
      renderProgress(); renderTabs(); renderSavebar();
      toast('Could not save that one. It is still ticked, so tap Save changes to retry.', 'error', 5000);
    }
  };
  send.addEventListener('click', markSent);
  altLinks.forEach((a) => a.addEventListener('click', markSent));

  const labels = (contact.labels || []).length
    ? h('ul', { class: 'chips', 'aria-label': 'Labels' }, contact.labels.map((l) => h('li', { class: 'chip', text: l })))
    : null;

  card.append(
    h('div', { class: 'card__head' },
      h('div', { class: 'card__id' },
        h('h3', { class: 'card__name', text: contact.name }),
        h('p', { class: 'card__phone', text: `+${contact.phone}` }),
        labels),
      h('label', { class: 'switch' }, toggle, h('span', { class: 'switch__track' }), h('span', { class: 'switch__text', text: 'Sent' }))),
    h('div', { class: 'bubble' }, textarea),
    h('div', { class: 'card__actions' }, send),
    altNumbers.length
      ? h('div', { class: 'alt' }, h('span', { text: `Other number${altNumbers.length > 1 ? 's' : ''}:` }), altLinks)
      : '',
  );
  return card;
}

function renderList() {
  el.list.setAttribute('aria-busy', String(!loaded && !loadError));

  if (loadError) {
    el.list.replaceChildren(stateBlock('Contacts did not load', loadError, { label: 'Try again', error: true, run: loadAll }));
    return;
  }
  if (!loaded) {
    el.list.replaceChildren(skeleton(), skeleton(), skeleton(), skeleton());
    return;
  }
  if (!contacts.length) {
    el.list.replaceChildren(stateBlock('No contacts yet', 'Import a Google Contacts export to get started.', { label: 'Import contacts', run: openImport }));
    return;
  }

  const items = viewList();
  if (!items.length) {
    const label = viewMode === 'pending' ? 'No one is pending with these filters.' : 'No contacts match these filters.';
    el.list.replaceChildren(stateBlock('Nothing to show', label));
    return;
  }

  const now = new Date();
  const visible = items.slice(0, visibleCount);
  const nodes = [h('p', { class: 'list__live', text: `Showing ${visible.length} of ${items.length}` })];
  visible.forEach((c, i) => nodes.push(renderCard(c, now, i)));

  const remaining = items.length - visible.length;
  if (remaining > 0) {
    const more = h('div', { class: 'more' });
    LOAD_MORE_OPTIONS.forEach((n) => {
      if (n > remaining && n !== Math.min(...LOAD_MORE_OPTIONS)) return;
      more.append(h('button', {
        type: 'button', class: 'pill', text: `+${Math.min(n, remaining)} more`,
        onclick: () => { visibleCount += n; renderList(); },
      }));
    });
    more.append(h('button', {
      type: 'button', class: 'pill', text: `Show all ${items.length}`,
      onclick: () => { visibleCount = items.length; renderList(); },
    }));
    nodes.push(more);
  }

  el.list.replaceChildren(...nodes);
  requestAnimationFrame(() => el.list.querySelectorAll('.bubble__text').forEach(autosize));
  firstRender = false;
}

function renderSavebar() {
  const n = dirty.size;
  el.savebar.hidden = n === 0;
  el.savebarText.textContent = `${n} unsaved`;
}

// --------------------------------------------------------------- Actions
async function saveChanges() {
  if (!dirty.size) return;
  const add = [], remove = [];
  dirty.forEach((want, phone) => (want ? add : remove).push(phone));
  el.saveBtn.disabled = true;
  el.saveBtn.setAttribute('aria-busy', 'true');
  try {
    await writeSent(add, remove);
    add.forEach((p) => sentSet.add(p));
    remove.forEach((p) => sentSet.delete(p));
    dirty.clear();
    toast('Changes saved', 'success');
    renderAll();
  } catch (err) {
    toast(describeError(err), 'error', 5000);
  } finally {
    el.saveBtn.disabled = false;
    el.saveBtn.removeAttribute('aria-busy');
  }
}

function discardChanges() {
  dirty.clear();
  renderSavebar();
  renderList();
}

async function resetSent() {
  el.confirmReset.setAttribute('aria-busy', 'true');
  try {
    await STATE_REF.set({ sentPhones: [] }, { merge: true });
    sentSet = new Set();
    dirty.clear();
    el.confirmDialog.close();
    toast('Everyone is pending again', 'success');
    renderAll();
  } catch (err) {
    toast(describeError(err), 'error', 5000);
  } finally {
    el.confirmReset.removeAttribute('aria-busy');
  }
}

// ---------------------------------------------------------------- Import
function openImport() {
  pendingImport = null;
  el.importFile.value = '';
  el.importPreview.hidden = true;
  el.importError.textContent = '';
  el.importConfirm.disabled = true;
  el.importDialog.showModal();
}

async function onImportFile() {
  const file = el.importFile.files[0];
  pendingImport = null;
  el.importConfirm.disabled = true;
  el.importPreview.hidden = true;
  el.importError.textContent = '';
  if (!file) return;
  try {
    const incoming = await readContactsFile(file);
    const diff = diffContacts(contacts, incoming);
    el.statAdded.textContent = String(diff.added);
    el.statKept.textContent = String(diff.kept);
    el.statRemoved.textContent = String(diff.removed);
    el.importPreview.hidden = false;
    if (contacts.length && diff.removed > contacts.length / 2) {
      el.importError.textContent = 'This would remove more than half of your current contacts. Check you chose the right file.';
    }
    pendingImport = incoming;
    el.importConfirm.disabled = false;
  } catch (err) {
    el.importError.textContent = err.message || 'That file could not be read.';
  }
}

async function confirmImport() {
  if (!pendingImport) return;
  el.importConfirm.disabled = true;
  el.importConfirm.setAttribute('aria-busy', 'true');
  try {
    await saveContacts(pendingImport);
    contacts = pendingImport;
    loaded = true;
    loadError = null;
    buildLabelCounts();
    el.importDialog.close();
    toast(`Imported ${contacts.length} contacts`, 'success');
    renderAll();
  } catch (err) {
    el.importError.textContent = describeError(err);
    el.importConfirm.disabled = false;
  } finally {
    el.importConfirm.removeAttribute('aria-busy');
  }
}

// ----------------------------------------------------------------- Theme
function currentMode() {
  const set = document.documentElement.getAttribute('data-theme');
  if (set) return set;
  return matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function syncThemeUi() {
  const mode = currentMode();
  el.themeBtn.dataset.mode = mode;
  el.themeBtn.setAttribute('aria-label', mode === 'dark' ? 'Switch to light theme' : 'Switch to dark theme');
  const colour = mode === 'dark' ? '#0c0e22' : '#f4f5fb';
  document.querySelectorAll('meta[name="theme-color"]').forEach((m, i) => {
    if (i === 0) { m.removeAttribute('media'); m.setAttribute('content', colour); } else m.remove();
  });
}

el.themeBtn.addEventListener('click', () => {
  const next = currentMode() === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', next);
  try { localStorage.setItem(THEME_KEY, next); } catch (e) { /* ignore */ }
  syncThemeUi();
});

// ------------------------------------------------------------------ Auth
const AUTH_MESSAGES = {
  'auth/invalid-email': 'That email address does not look right.',
  'auth/invalid-credential': 'Email or password is incorrect.',
  'auth/wrong-password': 'Email or password is incorrect.',
  'auth/user-not-found': 'Email or password is incorrect.',
  'auth/user-disabled': 'This account has been disabled in Firebase.',
  'auth/too-many-requests': 'Too many attempts. Wait a few minutes, then try again.',
  'auth/network-request-failed': 'No connection. Check your internet and try again.',
  'auth/unauthorized-domain': 'This web address is not authorised in Firebase. See the setup guide.',
  'auth/api-key-not-valid.-please-pass-a-valid-api-key.': 'The Firebase configuration is not valid. See the setup guide.',
};

el.loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  el.loginError.textContent = '';
  const email = el.loginEmail.value.trim();
  const password = el.loginPassword.value;
  if (!email || !password) {
    el.loginError.textContent = 'Enter your email and password.';
    return;
  }
  el.loginSubmit.disabled = true;
  el.loginSubmit.setAttribute('aria-busy', 'true');
  try {
    await auth.signInWithEmailAndPassword(email, password);
  } catch (err) {
    el.loginError.textContent = AUTH_MESSAGES[err.code] || 'Sign-in failed. Check your details and try again.';
  } finally {
    el.loginSubmit.disabled = false;
    el.loginSubmit.removeAttribute('aria-busy');
  }
});

el.togglePassword.addEventListener('click', () => {
  const show = el.loginPassword.type === 'password';
  el.loginPassword.type = show ? 'text' : 'password';
  el.togglePassword.setAttribute('aria-pressed', String(show));
  el.togglePassword.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
  el.togglePassword.replaceChildren(icon(show ? 'eye-off' : 'eye'));
});

el.signOutBtn.addEventListener('click', () => auth.signOut());

function showSignedOut() {
  // Drop everything held in memory and in the page so nothing lingers after sign-out.
  contacts = []; sentSet = new Set(); labelCounts = []; loaded = false; loadError = null;
  dirty.clear(); edits.clear(); selectedLabels.clear(); pendingImport = null;
  el.list.replaceChildren();
  el.loginPassword.value = '';
  el.app.hidden = true;
  el.login.hidden = false;
  firstRender = true;
}

function showSignedIn() {
  el.login.hidden = true;
  el.app.hidden = false;
  renderToday();
  loadAll();
}

// ---------------------------------------------------------------- Wiring
let searchTimer = null;
el.search.addEventListener('input', () => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    searchQuery = el.search.value.trim().toLowerCase();
    visibleCount = DEFAULT_VISIBLE;
    renderTabs(); renderList();
  }, 200);
});

el.saveBtn.addEventListener('click', saveChanges);
el.discardBtn.addEventListener('click', discardChanges);
el.resetBtn.addEventListener('click', () => el.confirmDialog.showModal());
el.confirmCancel.addEventListener('click', () => el.confirmDialog.close());
el.confirmReset.addEventListener('click', resetSent);
el.importBtn.addEventListener('click', openImport);
el.importCancel.addEventListener('click', () => el.importDialog.close());
el.importFile.addEventListener('change', onImportFile);
el.importConfirm.addEventListener('click', confirmImport);

// Close the label dropdown on outside click or Escape.
document.addEventListener('click', (e) => {
  const open = el.labelFilters.querySelector('details[open]');
  if (open && !open.contains(e.target)) { open.open = false; labelsOpen = false; }
});
document.addEventListener('keydown', (e) => {
  const open = el.labelFilters.querySelector('details[open]');
  if (e.key === 'Escape' && open) { open.open = false; labelsOpen = false; open.querySelector('summary').focus(); }
});

// Frosted top bar gains a border once the page scrolls.
addEventListener('scroll', () => el.topbar.classList.toggle('is-scrolled', scrollY > 4), { passive: true });

// Keep message boxes sized to their text when the width changes.
let resizeTimer = null;
addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => el.list.querySelectorAll('.bubble__text').forEach(autosize), 150);
});

// Offline banner.
const syncOnline = () => { el.offline.hidden = navigator.onLine; };
addEventListener('online', syncOnline);
addEventListener('offline', syncOnline);
syncOnline();

// A new day means new messages: refresh when the app returns to the foreground.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible' && !el.app.hidden && renderedDay !== dayKey(new Date())) {
    edits.clear();
    renderAll();
  }
});

syncThemeUi();
authReady.then(() => {
  auth.onAuthStateChanged((user) => (user ? showSignedIn() : showSignedOut()));
});

if ('serviceWorker' in navigator) {
  addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => {}); });
}
