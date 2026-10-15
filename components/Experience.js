/**
 * Coordinador original de SEÑAL 88, disponible en /archivo/*.
 * Combina rutas, evidencias, persistencia y un artefacto Three.js por capítulo.
 */
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { chapters } from "@/data/chapters";
import { useProgress } from "@/hooks/useProgress";
import AuthPanel from "@/components/AuthPanel";
import ThreeArtifact from "@/components/ThreeArtifact";

export default function Experience({ initialChapterId }) {
  // La URL determina el capítulo activo; sin identificador se selecciona el primero.
  const router = useRouter();
  const activeIndex = Math.max(
    chapters.findIndex((item) => item.id === initialChapterId),
    0,
  );
  const entered = Boolean(initialChapterId);
  const [flash, setFlash] = useState(false);
  const [authOpen, setAuthOpen] = useState(false);
  const [completionOpen, setCompletionOpen] = useState(false);
  // useProgress administra almacenamiento local y sincronización opcional con Firebase.
  const {
    authError,
    authLoading,
    authUser,
    continueAsGuest,
    discovered,
    discover,
    firebaseConfigured,
    ready,
    reset,
    signInWithGoogle,
    submitEmail,
    syncState,
  } = useProgress();
  const chapter = chapters[activeIndex];
  const isDiscovered = discovered.has(chapter.clueId);
  const discoveredCount = chapters.filter((item) =>
    discovered.has(item.clueId),
  ).length;

  // Desactiva el destello tras un descubrimiento y retira el temporizador al desmontar.
  useEffect(() => {
    if (!flash) return;
    const timeout = window.setTimeout(() => setFlash(false), 650);
    return () => window.clearTimeout(timeout);
  }, [flash]);

  // Registra una evidencia una sola vez; si completa la colección, abre el desenlace.
  function handleDiscover() {
    if (isDiscovered) return;
    const completesExperience = chapters.every(
      (item) => item.clueId === chapter.clueId || discovered.has(item.clueId),
    );

    discover(chapter.clueId);
    setFlash(true);
    if (completesExperience) setCompletionOpen(true);
  }

  // El primer capítulo está disponible; los siguientes requieren la evidencia del anterior.
  function canOpen(index) {
    return index === 0 || discovered.has(chapters[index - 1].clueId);
  }

  // Las acciones de navegación utilizan el router de Next.js para actualizar la URL.
  function enterExperience() {
    router.push(`/archivo/${chapters[0].id}`);
  }

  function openChapter(chapterId) {
    router.push(`/archivo/${chapterId}`);
  }

  function returnToStart() {
    router.push("/");
  }

  // Borra progreso local/remoto y vuelve al inicio, incluso si falla la sincronización remota.
  async function handleReset() {
    setCompletionOpen(false);
    try {
      await reset();
    } finally {
      router.push("/");
    }
  }

  // Espera la hidratación local antes de calcular el estado de desbloqueo de los capítulos.
  if (!ready) return <main className="loading">SINTONIZANDO…</main>;

  return (
    <main className={`experience ${flash ? "is-flashing" : ""}`}>
      <div className="noise" aria-hidden="true" />
      <div className="scanlines" aria-hidden="true" />

      {/* Introducción heredada: se muestra solamente si no llegó un capítulo inicial. */}
      {!entered && (
        <section className="intro">
          <p className="kicker">ARCHIVO NO AUTORIZADO / EXP. 06</p>
          <h1>
            SEÑAL <span>88</span>
          </h1>
          <p className="intro-copy">
            Una transmisión apareció donde no debía. Tres fragmentos siguen
            activos. Entrar altera el archivo.
          </p>
          <button className="enter-button" onClick={enterExperience}>
            <span>INICIAR RECEPCIÓN</span>
            <span aria-hidden="true">↗</span>
          </button>
          <p className="microcopy">
            Usá auriculares. O fingí que este mensaje los recomendaba.
          </p>
        </section>
      )}

      <header className="topbar">
        <button className="brand" onClick={returnToStart}>
          S/88 <i>●</i>
        </button>
        <div className="status">
          <span>{syncState === "cloud" ? "NUBE" : "LOCAL"}</span>
          <span>
            SEÑAL {Math.round((discoveredCount / chapters.length) * 100)}%
          </span>
          {firebaseConfigured && (
            <button className="auth-trigger" onClick={() => setAuthOpen(true)}>
              {authUser?.isAnonymous
                ? "INVITADO"
                : authUser?.displayName || authUser?.email || "ACCEDER"}
            </button>
          )}
        </div>
      </header>

      {/* Navegación, relato y artefacto comparten el color del capítulo mediante una variable CSS. */}
      <section className="chapter-layout" style={{ "--signal": chapter.color }}>
        <aside
          className="chapter-nav"
          aria-label="Fragmentos de la transmisión"
        >
          {chapters.map((item, index) => {
            const unlocked = canOpen(index);
            return (
              <button
                key={item.id}
                className={index === activeIndex ? "active" : ""}
                disabled={!unlocked}
                onClick={() => openChapter(item.id)}
                aria-label={`${item.label}${unlocked ? "" : " bloqueado"}`}
              >
                <b>{item.number}</b>
                <span>{item.label}</span>
                <i>
                  {discovered.has(item.clueId) ? "◆" : unlocked ? "◇" : "×"}
                </i>
              </button>
            );
          })}
          <button className="reset-progress" onClick={handleReset}>
            <b>↺</b>
            <span>REINICIAR PROGRESO</span>
            <i>×</i>
          </button>
        </aside>

        <div className="narrative">
          <p className="kicker">{chapter.eyebrow}</p>
          <p className="chapter-number">FRAGMENTO {chapter.number}</p>
          <h2>{chapter.title}</h2>
          <p className="chapter-copy">{chapter.copy}</p>

          <div className={`clue-card ${isDiscovered ? "found" : ""}`}>
            <small>
              {isDiscovered ? "EVIDENCIA RECUPERADA" : "EVIDENCIA CIFRADA"}
            </small>
            <strong>{isDiscovered ? chapter.clueLabel : "██████ ████"}</strong>
          </div>
        </div>

        <div className="artifact-panel">
          <ThreeArtifact
            key={chapter.id}
            chapter={chapter}
            discovered={isDiscovered}
            onDiscover={handleDiscover}
          />
          <div className="artifact-caption">
            <span>[ OBJETO {chapter.number} ]</span>
            <p>{isDiscovered ? "Frecuencia aislada." : chapter.instruction}</p>
            {!isDiscovered && (
              <button onClick={handleDiscover}>INSPECCIONAR NÚCLEO</button>
            )}
          </div>
        </div>
      </section>

      <footer className="footer-bar">
        <span>UMAI / PROGRAMACIÓN III</span>
        <span>{new Date().toLocaleDateString("es-AR")}</span>
      </footer>

      {/* Desenlace y acceso son capas condicionales controladas por el estado React. */}
      {completionOpen && (
        <section className="completion" role="dialog" aria-modal="true">
          <button
            className="close"
            onClick={() => setCompletionOpen(false)}
            aria-label="Cerrar desenlace"
          >
            ×
          </button>
          <p className="kicker">TRANSMISIÓN RECONSTRUIDA</p>
          <h2>
            NO ERA UN ECO.
            <br />
            ERA UNA INVITACIÓN.
          </h2>
          <p>
            Fin del prototipo. La transmisión fue reconstruida por completo.
          </p>
        </section>
      )}

      {authOpen && (
        <AuthPanel
          authError={authError}
          authLoading={authLoading}
          onClose={() => setAuthOpen(false)}
          onContinueAsGuest={continueAsGuest}
          onGoogle={signInWithGoogle}
          onSubmitEmail={submitEmail}
          user={authUser}
        />
      )}
    </main>
  );
}
