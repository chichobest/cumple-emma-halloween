// Configuración de Firebase leída de variables de entorno (ver .env.example).
// Sin ellas la app funciona en modo local con LocalStorage.
const env = import.meta.env;

const firebaseConfig = {
  apiKey: env.VITE_FIREBASE_API_KEY,
  authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId,
);

let firestorePromise = null;

// Firebase se carga bajo demanda: en modo local no se descarga ni un byte del SDK.
export function loadFirestore() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      import("firebase/app"),
      import("firebase/firestore"),
    ]).then(([appModule, fs]) => {
      const app =
        appModule.getApps()[0] ?? appModule.initializeApp(firebaseConfig);
      return { db: fs.getFirestore(app), fs };
    });
  }
  return firestorePromise;
}
