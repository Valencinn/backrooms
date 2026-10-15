/**
 * Persistencia y autenticación del archivo SEÑAL 88; no se usa en el explorador Backrooms.
 * Hidrata localStorage y combina evidencias con Firestore si está configurado.
 * Las refs evitan lecturas de estado viejo dentro de callbacks asíncronos.
 */
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { chapters } from "@/data/chapters";
import { getFirebaseServices, hasFirebaseConfig } from "@/lib/firebase";

// Una clave propia separa el progreso de esta experiencia del resto del navegador.
const STORAGE_KEY = "signal-88-progress";
const VALID_CLUE_IDS = new Set(chapters.map((chapter) => chapter.clueId));

// Descarta datos desconocidos y duplicados antes de aceptar progreso local o remoto.
function normalizeClues(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((clueId) => VALID_CLUE_IDS.has(clueId)))];
}

// Si el almacenamiento no puede leerse o contiene JSON inválido, devuelve una colección vacía.
function readLocal() {
  try {
    return normalizeClues(
      JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "[]"),
    );
  } catch {
    return [];
  }
}

// Serializa las evidencias para conservarlas entre visitas.
function saveLocal(clues) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(clues));
}

// Identifica el proveedor de acceso que se guardará junto al perfil.
function getProvider(user) {
  if (user.isAnonymous) return "anonymous";
  return user.providerData[0]?.providerId || "password";
}

// Actualiza el perfil mediante merge; createdAt se agrega solamente al crear el documento.
async function saveUserProfile(user, db) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  const profile = {
    userId: user.uid,
    email: user.email || null,
    displayName: user.displayName || null,
    photoURL: user.photoURL || null,
    isAnonymous: user.isAnonymous,
    authProvider: getProvider(user),
    lastLoginAt: serverTimestamp(),
  };

  if (!snapshot.exists()) profile.createdAt = serverTimestamp();
  await setDoc(userRef, profile, { merge: true });
}

// Expone evidencias, estado de conexión y acciones de autenticación a los componentes.
export function useProgress() {
  const [clues, setClues] = useState([]);
  const cluesRef = useRef([]);
  const [ready, setReady] = useState(false);
  const [syncState, setSyncState] = useState("local");
  const [remoteUser, setRemoteUser] = useState(null);
  const remoteUserRef = useRef(null);
  const [authUser, setAuthUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Al montar, restaura la copia local y observa cambios de sesión si hay configuración Firebase.
  useEffect(() => {
    const localClues = readLocal();
    cluesRef.current = localClues;

    // Difiere la hidratación al siguiente turno del navegador; el cleanup cancela el temporizador.
    const hydrateLocal = window.setTimeout(() => {
      setClues(localClues);
      saveLocal(localClues);
      setReady(true);
    }, 0);

    if (!hasFirebaseConfig) return () => window.clearTimeout(hydrateLocal);

    const { auth, db } = getFirebaseServices();
    // Cada cambio de usuario inicia el perfil y sincroniza sus evidencias.
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      // Sin cuenta activa, intenta iniciar un invitado anónimo; ante un fallo se mantiene el modo local.
      if (!user) {
        remoteUserRef.current = null;
        setRemoteUser(null);
        setAuthUser(null);
        try {
          setSyncState("connecting");
          await signInAnonymously(auth);
        } catch (error) {
          console.warn("No se pudo iniciar la sesion anonima.", error);
          setAuthError(error.code || "auth/anonymous-sign-in-failed");
          setSyncState("local");
        }
        return;
      }

      try {
        setSyncState("connecting");
        await saveUserProfile(user, db);

        const progressRef = doc(db, "progress", user.uid);
        const snapshot = await getDoc(progressRef);
        const remoteClues = normalizeClues(
          snapshot.exists() ? snapshot.data().clues : [],
        );
        // La unión conserva evidencias obtenidas en cualquiera de las dos copias.
        const mergedClues = normalizeClues([
          ...cluesRef.current,
          ...remoteClues,
        ]);

        cluesRef.current = mergedClues;
        setClues(mergedClues);
        saveLocal(mergedClues);
        remoteUserRef.current = user;
        setRemoteUser(user);
        setAuthUser(user);
        setAuthError("");
        setSyncState("cloud");
      } catch (error) {
        console.warn("No se pudo sincronizar con Firebase.", error);
        setAuthUser(user);
        setAuthError(error.code || "firestore/sync-failed");
        setSyncState("local");
      }
    });

    return () => {
      window.clearTimeout(hydrateLocal);
      unsubscribe();
    };
  }, []);

  // Con la hidratación y la cuenta listas, publica los cambios de evidencias en Firestore.
  useEffect(() => {
    if (!ready || !remoteUser) return;
    const { db } = getFirebaseServices();
    setDoc(
      doc(db, "progress", remoteUser.uid),
      {
        userId: remoteUser.uid,
        authProvider: getProvider(remoteUser),
        clues,
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    ).catch((error) =>
      console.warn("No se pudo sincronizar el progreso.", error),
    );
  }, [clues, ready, remoteUser]);

  // Registra solo ids válidos y aún no descubiertos; useCallback conserva la identidad de esta acción.
  const discover = useCallback((clueId) => {
    if (!VALID_CLUE_IDS.has(clueId) || cluesRef.current.includes(clueId))
      return;

    const nextClues = [...cluesRef.current, clueId];
    cluesRef.current = nextClues;
    saveLocal(nextClues);
    setClues(nextClues);
  }, []);

  // Vacía primero la copia local y después el documento de progreso de la cuenta conectada.
  const reset = useCallback(async () => {
    cluesRef.current = [];
    saveLocal([]);
    setClues([]);

    const user = remoteUserRef.current;
    if (!user || !hasFirebaseConfig) return;

    const { db } = getFirebaseServices();
    await setDoc(
      doc(db, "progress", user.uid),
      {
        userId: user.uid,
        authProvider: getProvider(user),
        clues: [],
        updatedAt: serverTimestamp(),
      },
      { merge: true },
    );
  }, []);

  // Abre Google y usa finally para restaurar el estado de carga tanto en éxito como en error.
  const signInWithGoogle = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      await signInWithPopup(auth, new GoogleAuthProvider());
    } catch (error) {
      setAuthError(error.code || "auth/google-sign-in-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Elige creación o ingreso según el modo y propaga errores para evitar cerrar el formulario.
  const submitEmail = useCallback(async ({ email, password, mode }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      const action =
        mode === "signup"
          ? createUserWithEmailAndPassword
          : signInWithEmailAndPassword;
      await action(auth, email, password);
    } catch (error) {
      setAuthError(error.code || "auth/email-sign-in-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Al cerrar sesión, el observador de autenticación inicia una cuenta anónima.
  const continueAsGuest = useCallback(async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const { auth } = getFirebaseServices();
      await signOut(auth);
    } catch (error) {
      setAuthError(error.code || "auth/sign-out-failed");
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  // Un Set acelera consultas de pertenencia; se recalcula solamente cuando cambian las evidencias.
  const discovered = useMemo(() => new Set(clues), [clues]);

  return {
    authError,
    authLoading,
    authUser,
    clearAuthError: () => setAuthError(""),
    continueAsGuest,
    discover,
    discovered,
    firebaseConfigured: hasFirebaseConfig,
    ready,
    reset,
    signInWithGoogle,
    submitEmail,
    syncState,
  };
}
