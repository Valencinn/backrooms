/**
 * Inicialización opcional de Firebase para SEÑAL 88.
 * NEXT_PUBLIC_* se incluye en el cliente: es configuración pública.
 * La autorización real de los documentos se define en firestore.rules.
 */
import { getApps, initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Next.js reemplaza estas variables al compilar; .env.example lista sus nombres.
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Si falta la configuración mínima, la experiencia funciona con localStorage.
export const hasFirebaseConfig = Boolean(
  firebaseConfig.apiKey && firebaseConfig.projectId && firebaseConfig.appId,
);

// Caché compartida de Auth y Firestore para evitar instancias duplicadas.
let services = null;

// Inicialización bajo demanda; reutiliza una app existente para tolerar recargas de desarrollo.
export function getFirebaseServices() {
  if (!hasFirebaseConfig) return null;
  if (services) return services;

  const app = getApps()[0] ?? initializeApp(firebaseConfig);
  services = {
    auth: getAuth(app),
    db: getFirestore(app),
  };

  return services;
}
