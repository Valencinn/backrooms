"use client";

import { useRef, useState } from "react";
import { levels } from "@/data/levels";
import { ENTRY_DOOR } from "./journey.mjs";
import { runCommand } from "./terminalCommands.mjs";
import TerminalHub from "./TerminalHub";
import ThreeViewer from "./ThreeViewer";
import "./backrooms.css";
import "./terminal.css";
import "./mission.css";

const initialView = { x: 0, z: 9, yaw: 0, seconds: 0, progress: 0 };
const welcome = "Enlace local establecido.\n\nNo abras una frecuencia que no estés dispuesto a recorrer.\nCompletá su objetivo y volvé a la puerta de entrada para regresar.\n\n94721  La hora prestada\n96308  El último turno\n98144  Jardín de espera\n\nEscribí entrar 94721 para comenzar, o ayuda para ver los comandos.";

export default function BackroomsExplorer({ onLeave }) {
  const [activeLevel, setActiveLevel] = useState(null);
  const [completed, setCompleted] = useState([]);
  const [transcript, setTranscript] = useState([{ type: "output", text: welcome }]);
  const [view, setView] = useState(initialView);
  const [paused, setPaused] = useState(false);
  const [effects, setEffects] = useState(true);
  const [notice, setNotice] = useState("");
  const viewport = useRef(null);
  const guide = useRef(null);
  const pausedBeforeGuide = useRef(false);
  const returned = useRef(false);

  function execute(raw) {
    const result = runCommand(raw, levels, completed);
    if (result.action === "clear") {
      setTranscript([]);
      return;
    }
    setTranscript((previous) => [...previous, { type: "command", text: raw }, ...(result.text ? [{ type: "output", text: result.text }] : [])].slice(-120));
    if (result.action === "leave") onLeave();
    if (result.action === "enter") {
      returned.current = false;
      setView(initialView);
      setPaused(false);
      setNotice("");
      setActiveLevel(levels.find((level) => level.id === result.levelId));
    }
  }

  function receiveTelemetry(sample) {
    setView(sample);
    if (!sample.finished || returned.current || !activeLevel) return;
    returned.current = true;
    setCompleted((previous) => previous.includes(activeLevel.number) ? previous : [...previous, activeLevel.number]);
    setTranscript((previous) => [...previous, {
      type: "output",
      text: "[ OK ] Regreso confirmado / " + activeLevel.number + "\nObjetivo completado. Puerta de entrada atravesada.\n\n" + activeLevel.ending + "\n\nLa terminal vuelve a estar disponible. Escribí niveles para continuar.",
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
      <TerminalHub active={!activeLevel} transcript={transcript} onCommand={execute} completedCount={completed.length} />
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
            <span>{view.objectiveComplete ? "OBJETIVO CUMPLIDO / REGRESÁ" : "OBJETIVO / " + view.progress + " DE " + activeLevel.stations.length}</span>
            <p>{view.prompt || activeLevel.objective}</p>
            <small>{view.objectiveComplete ? "Puerta de entrada · a " + distance + " m · marcada en el mapa" : "Completá el objetivo para desbloquear la puerta de regreso."}</small>
          </section>
          {paused && <div className="br-mission-paused" role="status">ENLACE EN PAUSA</div>}
          <span className="br-mission-crosshair" aria-hidden="true">+</span>
          <aside className="br-mission-map" aria-label="Mapa de regreso">
            <span>PUERTA / {view.objectiveComplete ? "ABIERTA" : "CERRADA"}</span>
            <svg viewBox="-12 -32 24 46" role="img" aria-label="Tu posición, objetos y puerta de entrada">
              <path d="M-11 13V-31H11V13" fill="none" stroke="currentColor" strokeWidth=".3" />
              {activeLevel.walls.map(([x, z, w, d], i) => <rect key={i} x={x-w/2} y={z-d/2} width={w} height={d} fill="currentColor" opacity=".35" />)}
              {activeLevel.stations.map((station, i) => <circle key={i} cx={station.x} cy={station.z} r=".65" fill={activeLevel.color} />)}
              <rect x="-1.4" y={ENTRY_DOOR.z - .4} width="2.8" height=".8" fill={view.objectiveComplete ? "#79f89a" : "#ce956d"} />
              <g transform={"translate(" + view.x + "," + view.z + ") rotate(" + -view.yaw * 180 / Math.PI + ")"}><path d="M0 -2L-1.2 1L0 .4L1.2 1Z" fill="#b8ffd0" /></g>
            </svg>
            <small>{distance} m hasta la entrada</small>
          </aside>
          <footer className="br-mission-footer"><span>WASD / FLECHAS · ARRASTRAR PARA MIRAR · E USAR</span><span className="br-mission-position">X <b>{view.x.toFixed(2)}</b> / Z <b>{view.z.toFixed(2)}</b></span></footer>
          {notice && <div className="br-mission-notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Cerrar aviso">×</button></div>}
          <dialog ref={guide} className="br-guide" onClose={() => setPaused(pausedBeforeGuide.current)}>
            <form method="dialog"><button className="br-guide-close" aria-label="Cerrar guía">×</button></form>
            <p className="br-eyebrow">BR-A / {activeLevel.number}</p><h2>Controles_</h2>
            <p>WASD o flechas para caminar. Arrastrá la escena para mirar. Usá E o el botón USAR junto a un objeto luminoso.</p>
            <p>{activeLevel.note}</p>
            <p>La puerta está detrás del punto donde apareciste. Se abre cuando completás las tres intervenciones. Volvé a cruzarla para recuperar la terminal.</p>
            <p>Pausa detiene el entorno. Esc cierra esta guía o la pantalla completa; el recorrido continúa al reanudar.</p>
          </dialog>
        </main>
      )}
    </>
  );
}
