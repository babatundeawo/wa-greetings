/**
 * Firebase setup (modular SDK, bundled into the site at build time).
 *
 * - Sign-in is kept in memory only: closing the app signs you out.
 * - The database cache is in memory only: contacts are never written to this device.
 * - App Check (reCAPTCHA v3) is switched on only when the build was given a site key.
 */
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';
import { initializeAuth, inMemoryPersistence } from 'firebase/auth';
import { initializeFirestore, memoryLocalCache } from 'firebase/firestore';

/* global __FIREBASE_CONFIG__, __APP_CHECK_SITE_KEY__ */
const config = __FIREBASE_CONFIG__;
const app = initializeApp(config);

if (__APP_CHECK_SITE_KEY__) {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(__APP_CHECK_SITE_KEY__),
    isTokenAutoRefreshEnabled: true,
  });
}

export const auth = initializeAuth(app, { persistence: inMemoryPersistence });
export const db = initializeFirestore(app, { localCache: memoryLocalCache() });
export const projectId = config.projectId;
