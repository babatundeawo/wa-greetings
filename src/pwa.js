/**
 * Install prompt and update flow.
 *
 * - Chrome and Android: uses the browser's install event.
 * - iPhone and iPad Safari: shows a three-step "Add to Home Screen" guide.
 * - A new version waits until the person taps Refresh, so nobody loses work mid-task.
 */
const DISMISS_KEY = 'dg-install-dismissed';
const DISMISS_DAYS = 30;
const SHOW_DELAY_MS = 8000;

export function isStandalone() {
  return matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
}

function isIosSafari() {
  const ua = navigator.userAgent;
  const ios = /iphone|ipad|ipod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const safari = /safari/i.test(ua) && !/crios|fxios|edgios|chrome|android/i.test(ua);
  return ios && safari;
}

function recentlyDismissed() {
  try {
    const at = Number(localStorage.getItem(DISMISS_KEY));
    return at && Date.now() - at < DISMISS_DAYS * 86400000;
  } catch (e) { return false; }
}

export function setupInstall({ card, text, iosSteps, installBtn, dismissBtn }) {
  let deferred = null;
  let timer = null;

  const canShow = () => !isStandalone() && !recentlyDismissed() && (deferred || isIosSafari());

  const show = () => {
    if (!canShow()) return;
    if (deferred) {
      installBtn.hidden = false;
    } else {
      text.textContent = 'Add Daily Greetings to your home screen to open it like any other app.';
      iosSteps.hidden = false;
    }
    card.hidden = false;
  };

  addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault();
    deferred = event;
  });
  addEventListener('appinstalled', () => { card.hidden = true; deferred = null; });

  installBtn.addEventListener('click', async () => {
    if (!deferred) return;
    deferred.prompt();
    try { await deferred.userChoice; } catch (e) { /* ignore */ }
    deferred = null;
    card.hidden = true;
  });
  dismissBtn.addEventListener('click', () => {
    card.hidden = true;
    try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch (e) { /* ignore */ }
  });

  return {
    /** Call after sign-in. Waits a moment so the first screen stays calm. */
    schedule() {
      clearTimeout(timer);
      timer = setTimeout(show, SHOW_DELAY_MS);
    },
    cancel() {
      clearTimeout(timer);
      card.hidden = true;
    },
  };
}

export function registerServiceWorker(onUpdateReady) {
  if (!('serviceWorker' in navigator)) return;
  let refreshing = false;

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (refreshing) location.reload();
  });

  addEventListener('load', async () => {
    let registration;
    try {
      registration = await navigator.serviceWorker.register('sw.js');
    } catch (e) { return; }

    const offer = (worker) => onUpdateReady(() => {
      refreshing = true;
      worker.postMessage({ type: 'SKIP_WAITING' });
    });

    if (registration.waiting && navigator.serviceWorker.controller) offer(registration.waiting);
    registration.addEventListener('updatefound', () => {
      const worker = registration.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) offer(worker);
      });
    });

    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') registration.update().catch(() => {});
    });
  });
}
