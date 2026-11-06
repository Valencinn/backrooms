"use client";

import { useEffect, useRef, useState } from "react";
import { levels } from "@/data/levels";
import { createJourney, ENTRY_DOOR } from "./journey.mjs";
import { normalizeCompleted, readProgress, saveProgress } from "./progression.mjs";
import { runCommand } from "./terminalCommands.mjs";
import TerminalHub from "./TerminalHub";
import ThreeViewer from "./ThreeViewer";
import "./backrooms.css";
import "./terminal.css";
import "./mission.css";

const initialView = { x: 0, z: 9, yaw: 0, seconds: 0, progress: 0 };
const welcome = "Enlace local establecido.\n\nTres frecuencias. Un único camino de regreso.\nCompletá cada misión y cruzá su puerta para habilitar la siguiente.\nLos recorridos completados se guardan en este navegador.\n\nEscribí niveles para consultar tu acceso, info <número> para leer\nel expediente, o ayuda para ver los comandos.";

export default function BackroomsExplorer({ onLeave }) {
  const [activeLevel, setActiveLevel] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [progressReady, setProgressReady] = useState(false);
  const [transcript, setTranscript] = useState([{ type: "output", text: welcome }]);
  const [view, setView] = useState(initialView);
  const [paused, setPaused] = useState(false);
  const [effects, setEffects] = useState(false);
  const [notice, setNotice] = useState("");
  const viewport = useRef(null);
  const guide = useRef(null);
  const pausedBeforeGuide = useRef(false);
  const returned = useRef(false);

  useEffect(() => {
    let cancelled = false;
    queueMicrotask(() => {
      if (cancelled) return;
      try { setCompleted(readProgress(levels, window.localStorage)); }
      catch { setNotice("El almacenamiento local no está disponible. El progreso durará esta sesión."); }
      setProgressReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  function execute(raw) {
    if (!progressReady) return;
    const result = runCommand(raw, levels, completed);
    if (result.action === "clear") {
      setTranscript([]);
      return;
    }
    setTranscript((previous) => [...previous, { type: "command", text: raw }, ...(result.text ? [{ type: "output", text: result.text }] : [])].slice(-120));
    if (result.action === "leave") onLeave();
    if (result.action === "enter") {
      const nextLevel = levels.find((level) => level.id === result.levelId);
      returned.current = false;
      setView({ ...initialView, ...createJourney(nextLevel).snapshot() });
      setPaused(false);
      setNotice("");
      setActiveLevel(nextLevel);
    }
  }

  function receiveTelemetry(sample) {
    setView(sample);
    if (!sample.finished || returned.current || !activeLevel) return;
    returned.current = true;
    const nextCompleted = normalizeCompleted(levels, [...completed, activeLevel.number]);
    setCompleted(nextCompleted);
    let saved = false;
    try { saved = saveProgress(levels, nextCompleted, window.localStorage); } catch { /* Sesión sin almacenamiento. */ }
    const nextLevel = levels[nextCompleted.length];
    setTranscript((previous) => [...previous, {
      type: "output",
      text: "[ OK ] Regreso confirmado / " + activeLevel.number + "\nTodas las etapas completadas. Puerta de entrada atravesada.\n\n" + activeLevel.ending + "\n\n" + (nextLevel ? `ACCESO HABILITADO: ${nextLevel.number} · ${nextLevel.name}\nEscribí entrar ${nextLevel.number} para continuar.` : "CAMPAÑA COMPLETADA · recuperaste las tres frecuencias.\nPodés volver a recorrer cualquier nivel.") + (saved ? "\nProgreso guardado en este navegador." : "\nAlmacenamiento no disponible: progreso conservado durante esta sesión."),
    }].slice(-120));
    setPaused(false);
    setActiveLevel(null);
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (viewport.current?.requestFullscreen) await viewport.current.requestFullscreen();
      else setNotice("Pantalla completa no disponible en este navegador.");
    } catch {
      setNotice("No se pudo activar la pantalla completa.");
    }
  }

  const distance = Math.hypot(view.x - ENTRY_DOOR.x, view.z - ENTRY_DOOR.z).toFixed(1);
  return (
    <>
      <TerminalHub active={!activeLevel} transcript={transcript} onCommand={execute} completed={completed} levels={levels} ready={progressReady} notice={notice} />
      {activeLevel && (
        <main className={"br-mission has-effects" + (effects ? " br-mission-effects" : "")} ref={viewport} aria-label={"Nivel " + activeLevel.number + ": " + activeLevel.name}>
          <ThreeViewer level={activeLevel} exploring={true} paused={paused} effects={effects} onTelemetry={receiveTelemetry} />
          {effects && <><div className="br-crt" aria-hidden="true" /><div className="br-vignette" aria-hidden="true" /></>}
          <header className="br-mission-header">
            <div><span>ENLACE ACTIVO / BR-A · {activeLevel.number}</span><h1>{activeLevel.name}</h1></div>
            <nav aria-label="Controles de experiencia">
              <button onClick={() => setPaused(!paused)} aria-pressed={paused}>{paused ? "REANUDAR" : "PAUSA"}</button>
              <button onClick={() => { pausedBeforeGuide.current = paused; setPaused(true); guide.current.showModal(); }}>CONTROLES</button>
              <button onClick={() => setEffects(!effects)} aria-pressed={effects}>CRT {effects ? "ON" : "OFF"}</button>
              <button onClick={fullscreen} aria-label="Alternar pantalla completa">⛶</button>
            </nav>
          </header>
          <section className={"br-mission-objective" + (view.objectiveComplete ? " is-complete" : "")} aria-label="Objetivo" role="status">
            <span>{view.objectiveComplete ? "OBJETIVO CUMPLIDO / REGRESÁ" : `ETAPA ${view.stageIndex + 1} / ${view.stageCount} · ${view.progress}/${view.total} ACCIONES`}</span>
            <h2>{view.stageTitle}</h2>
            <div className="br-mission-progress" role="progressbar" aria-label="Progreso de la misión" aria-valuemin={0} aria-valuemax={view.total} aria-valuenow={view.progress}><i style={{ width: `${view.progress / view.total * 100}%` }} /></div>
            <ul className="br-mission-checklist">{view.checklist?.map((task) => <li key={task.id} className={task.done ? "is-done" : ""}><span>{task.done ? "✓" : String(task.station).padStart(2, "0")}</span>{task.label}</li>)}</ul>
            <p>{view.prompt || activeLevel.objective}</p>
            {view.signal > 0 && !view.ready && <div className="br-mission-progress is-signal"><i style={{ width: `${view.signal * 100}%` }} /></div>}
            {(view.objectiveComplete || view.prompt !== view.hint) && <small>{view.objectiveComplete ? "Puerta de entrada · a " + distance + " m · marcada en el mapa" : view.hint}</small>}
          </section>
          {!!view.inventory?.length && <aside className="br-mission-inventory" aria-label="Objetos recuperados"><span>INVENTARIO / {view.inventory.length}</span><p>{view.inventory.join(" · ")}</p></aside>}
          {view.frequency && <div className="br-mission-frequency" role="status">RECEPTOR LOCAL <strong>{view.frequency} <small>MHz</small></strong><span>Q / R · cambiar canal · E recibir</span></div>}
          {paused && <div className="br-mission-paused" role="status">ENLACE EN PAUSA</div>}
          <span className="br-mission-crosshair" aria-hidden="true">+</span>
          <aside className="br-mission-map" aria-label="Mapa de regreso">
            <span>PUERTA / {view.objectiveComplete ? "ABIERTA" : "CERRADA"}</span>
            <svg viewBox="-12 -32 24 46" role="img" aria-label="Tu posición, objetos y puerta de entrada">
              <path d="M-11 13V-31H11V13" fill="none" stroke="currentColor" strokeWidth=".3" />
              {activeLevel.walls.map(([x, z, w, d], i) => <rect key={i} x={x-w/2} y={z-d/2} width={w} height={d} fill="currentColor" opacity=".35" />)}
              {activeLevel.stations.map((station, i) => <g key={i} opacity={view.activated?.includes(i) ? .35 : 1}><circle cx={station.x} cy={station.z} r={view.available?.includes(i) ? 1 : .65} fill={view.available?.includes(i) ? activeLevel.color : "#66786e"} /><text x={station.x + 1} y={station.z + .5} fill="#e4f0dc" fontSize="1.5">{i + 1}</text></g>)}
              <rect x="-1.4" y={ENTRY_DOOR.z - .4} width="2.8" height=".8" fill={view.objectiveComplete ? "#79f89a" : "#ce956d"} />
              <g transform={"translate(" + view.x + "," + view.z + ") rotate(" + -view.yaw * 180 / Math.PI + ")"}><path d="M0 -2L-1.2 1L0 .4L1.2 1Z" fill="#b8ffd0" /></g>
            </svg>
            <small>● Color: objetivo habilitado<br />{distance} m hasta la entrada</small>
          </aside>
          <footer className="br-mission-footer"><span>WASD / FLECHAS · MOUSE LIBRE · ESC CURSOR · E USAR</span><span className="br-mission-position">X <b>{view.x.toFixed(2)}</b> / Z <b>{view.z.toFixed(2)}</b></span></footer>
          {notice && <div className="br-mission-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso">×</button></div>}
          <dialog ref={guide} className="br-guide" onClose={() => setPaused(pausedBeforeGuide.current)}>
            <form method="dialog"><button className="br-guide-close" aria-label="Cerrar guía">×</button></form>
            <p className="br-eyebrow">BR-A / {activeLevel.number}</p><h2>Controles_</h2>
            <p>WASD o flechas para caminar. Mové el mouse sobre la escena para mirar sin mantener botones. Un clic captura el cursor para girar sin límites; Esc lo libera. En pantallas táctiles, arrastrá para mirar. Usá E o el botón USAR junto a un objeto luminoso.</p>
            <p>{activeLevel.note}</p>
            <p>El mapa numera cada estación. Los objetivos habilitados aparecen en color; las próximas etapas permanecen bloqueadas. El inventario guarda cartas, herramientas y mensajes.</p>
            <p>La puerta está detrás del punto donde apareciste. Completá todas las etapas y volvé a cruzarla para guardar el recorrido y habilitar el próximo nivel.</p>
            <p>Pausa detiene el entorno. Esc cierra esta guía o la pantalla completa; el recorrido continúa al reanudar.</p>
          </dialog>
        </main>
      )}
    </>
  );
}
