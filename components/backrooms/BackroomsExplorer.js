/**
 * Coordinador del explorador: React administra la interfaz y ThreeViewer administra la GPU.
 * El nivel activo alimenta el sidebar, la escena, el HUD y el minimapa.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { levels } from "@/data/levels";
import LevelSidebar from "./LevelSidebar";
import ThreeViewer from "./ThreeViewer";
import "./backrooms.css";

// Ícono SVG decorativo; el nombre accesible pertenece al botón que lo contiene.
function ExpandIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      aria-hidden="true"
    >
      <path d="M8 4H4v4m12-4h4v4M4 16v4h4m12-4v4h-4" />
    </svg>
  );
}

export default function BackroomsExplorer() {
  // Estado compartido: cambiar el índice selecciona un objeto de data/levels.js.
  const [activeLevel, setActiveLevel] = useState(0);
  const [exploring, setExploring] = useState(false);
  const [effects, setEffects] = useState(true);
  const [paused, setPaused] = useState(false);
  // Telemetría real de la cámara: posición horizontal, orientación en radianes y tiempo de escena.
  const [view, setView] = useState({ x: 0, z: 9, yaw: 0, seconds: 0 });
  const [notice, setNotice] = useState("");
  // Las referencias acceden al visor y al diálogo sin provocar renders. La tercera conserva la pausa previa.
  const viewport = useRef(null);
  const guide = useRef(null);
  const pausedBeforeGuide = useRef(false);
  const level = levels[activeLevel];

  // El aviso desaparece a los cuatro segundos; el cleanup evita temporizadores pendientes al desmontar.
  useEffect(() => {
    if (!notice) return;
    const timeout = setTimeout(() => setNotice(""), 4000);
    return () => clearTimeout(timeout);
  }, [notice]);

  // Reinicia la exploración y la telemetría antes de que el nuevo nivel cree su propio canvas.
  function selectLevel(id) {
    if (id === activeLevel) return;
    setExploring(false);
    setPaused(false);
    setView({ x: 0, z: 9, yaw: 0, seconds: 0 });
    setActiveLevel(id);
  }

  // La Fullscreen API requiere una acción del usuario y puede no estar disponible: el error se muestra en el HUD.
  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else if (viewport.current?.requestFullscreen)
        await viewport.current.requestFullscreen();
      else
        setNotice("La pantalla completa no está disponible en este navegador.");
    } catch {
      setNotice("El navegador no pudo activar la pantalla completa.");
    }
  }

  // Formato visual de cinta VHS. Este contador avanza con la escena, no con la hora del sistema.
  const timecode = `00:${String(Math.floor(view.seconds / 60)).padStart(2, "0")}:${String(view.seconds % 60).padStart(2, "0")}`;

  return (
    <main className="br-app" style={{ "--br-accent": level.color }}>
      {/* Identidad del archivo y acceso al diálogo. Abrir la guía guarda y activa temporalmente la pausa. */}
      <header className="br-header flex items-center justify-between">
        <Link
          className="br-brand flex items-center"
          href="/"
          aria-label="The Backrooms, inicio"
        >
          <span className="br-brand-mark" aria-hidden="true">
            <i />
            <i />
            <i />
          </span>
          <span>
            THE BACKROOMS<small>RESEARCH & EXPLORATION DIVISION</small>
          </span>
        </Link>
        <div className="br-header-right flex items-center">
          <span className="br-online">
            <i />
            CONEXIÓN ESTABLE
          </span>
          <span className="br-header-divider" />
          <button
            className="br-guide-button"
            onClick={() => {
              pausedBeforeGuide.current = paused;
              setPaused(true);
              guide.current.showModal();
            }}
          >
            <span aria-hidden="true">⌑</span> GUÍA DE CAMPO{" "}
            <span aria-hidden="true">↗</span>
          </button>
        </div>
      </header>

      <div className="br-workspace">
        {/* El sidebar avisa qué nivel se eligió; este componente sigue siendo la única fuente del estado activo. */}
        <LevelSidebar activeLevel={activeLevel} onSelect={selectLevel} />
        <section
          className="br-main min-w-0"
          aria-label="Explorador de los Backrooms"
        >
          <div className="br-section-heading flex items-end justify-between">
            <div>
              <p className="br-eyebrow">LO QUE QUEDA FUERA DE LA REALIDAD</p>
              <h1>
                Archivo de lo imposible<span>_</span>
              </h1>
            </div>
            <div className="br-archive-id">
              EXP. BR—1988
              <br />
              <span>ACCESO AUTORIZADO</span>
            </div>
          </div>
          <section
            ref={viewport}
            className={`br-viewport ${effects ? "has-effects" : ""} ${exploring ? "is-exploring" : ""}`}
            aria-label={`Visor 3D: ${level.name}`}
          >
            {/* La key cambia con el nivel: React desmonta la escena anterior y ejecuta su limpieza antes de recrearla. */}
            <ThreeViewer
              key={level.id}
              level={level}
              exploring={exploring}
              paused={paused}
              effects={effects}
              onTelemetry={setView}
            />
            {/* Capas CSS por encima del canvas: no interceptan puntero ni se anuncian a lectores de pantalla. */}
            <div className="br-film-grain" aria-hidden="true" />
            <div className="br-crt" aria-hidden="true" />
            <div className="br-vignette" aria-hidden="true" />
            <div className="br-camera-top flex justify-between">
              <span className="br-record">
                <i /> REC <span className="br-timecode">{timecode}</span>
              </span>
              <span className="br-camera-id">
                CAM_0{level.id + 1} <span>·</span> LIVE FEED
              </span>
            </div>
            <div className="br-scene-tag">
              <span>↳</span> TRANSMISIÓN EN DIRECTO / {level.code}
            </div>
            <div className="br-crosshair" aria-hidden="true">
              +
            </div>
            {/* Información narrativa del nivel. aria-live anuncia los cambios de contenido sin mover el foco. */}
            <div className="br-level-hud" aria-live="polite">
              <div className="br-hud-kicker">
                <span className="br-hud-line" />
                NIVEL {String(level.id).padStart(2, "0")}
                <span className="br-hud-class">{level.danger}</span>
              </div>
              <h2 className={level.id === 1 ? "br-long-title" : undefined}>
                {level.name}
                <span>.</span>
              </h2>
              <p className="br-subtitle">{level.subtitle}</p>
              <p className="br-description">{level.description}</p>
              <div className="br-hud-stats">
                <div>
                  <span>PELIGRO</span>
                  <strong>
                    <i className={`br-risk-dot risk-${level.id}`} />
                    {level.risk}
                  </strong>
                </div>
                <div>
                  <span>ENTIDADES</span>
                  <strong>{level.entities}</strong>
                </div>
              </div>
              <button
                className="br-explore-button flex justify-between items-center"
                aria-pressed={exploring}
                onClick={() => {
                  setExploring(!exploring);
                  setPaused(false);
                }}
              >
                <span>
                  {exploring ? "FINALIZAR EXPLORACIÓN" : "EXPLORAR NIVEL"}{" "}
                  <span aria-hidden="true">↗</span>
                </span>
                <span className="br-button-icon" aria-hidden="true">
                  {exploring ? "■" : "→"}
                </span>
              </button>
            </div>
            {/* Proyección superior SVG: reutiliza las paredes del modelo y transforma la flecha con la telemetría. */}
            <div className="br-minimap">
              <div className="flex justify-between">
                <span>MAPA PARCIAL</span>
                <span>⊕</span>
              </div>
              <svg
                viewBox="-12 -32 24 46"
                role="img"
                aria-label="Mapa del nivel y tu posición"
              >
                <defs>
                  <pattern
                    id={`grid-${level.id}`}
                    width="3"
                    height="3"
                    patternUnits="userSpaceOnUse"
                  >
                    <path
                      d="M 3 0 L 0 0 0 3"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth=".05"
                    />
                  </pattern>
                </defs>
                <rect
                  x="-12"
                  y="-32"
                  width="24"
                  height="46"
                  fill={`url(#grid-${level.id})`}
                />
                <path
                  d="M-11 13V-31H11V13"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth=".4"
                />
                {level.walls.map(([x, z, w, d], i) => (
                  <rect
                    key={i}
                    x={x - w / 2}
                    y={z - d / 2}
                    width={w}
                    height={d}
                    fill="currentColor"
                    opacity=".65"
                  />
                ))}
                <g
                  transform={`translate(${view.x},${view.z}) rotate(${(-view.yaw * 180) / Math.PI})`}
                >
                  <path d="M0 -3L-1.7 1.5L0 .7L1.7 1.5Z" fill="#eed391" />
                  <circle
                    r="3.5"
                    fill="none"
                    stroke="#eed391"
                    strokeWidth=".15"
                  />
                </g>
              </svg>
              <span className="br-map-caption">POSICIÓN APROXIMADA</span>
            </div>
            <div className="br-camera-bottom flex justify-between">
              <span>
                {exploring
                  ? "WASD / FLECHAS · ARRASTRÁ PARA MIRAR"
                  : "SEÑAL RECUPERADA · 04.17.1998"}
              </span>
              <span>
                SP <span className="br-tape-icon">▰▰</span> VHS
              </span>
            </div>
            {notice && (
              <div className="br-notice" role="status">
                {notice}
              </div>
            )}
          </section>
          {/* Controles de pausa, efectos y pantalla completa; aria-pressed comunica el estado de los interruptores. */}
          <div className="br-instrument-bar flex items-center justify-between">
            <div className="br-position">
              <span className="br-small-cross">⊕</span> X{" "}
              <b>{view.x.toFixed(2)}</b>
              <span>/</span> Z <b>{view.z.toFixed(2)}</b>
              <span className="br-instrument-divider" />
              <span>{level.temperature} °C</span>
            </div>
            <div className="br-view-controls flex items-center">
              <button
                aria-label={paused ? "Reanudar escena" : "Pausar escena"}
                aria-pressed={paused}
                onClick={() => setPaused(!paused)}
              >
                {paused ? "▷" : "Ⅱ"}
                <span>{paused ? "REANUDAR" : "PAUSAR"}</span>
              </button>
              <button
                aria-pressed={effects}
                onClick={() => setEffects(!effects)}
              >
                <span className="br-effect-icon">▤</span>VHS{" "}
                <span className={effects ? "br-on" : ""}>
                  {effects ? "ON" : "OFF"}
                </span>
              </button>
              <button
                onClick={toggleFullscreen}
                aria-label="Alternar pantalla completa"
              >
                <ExpandIcon />
              </button>
            </div>
          </div>
          <div className="br-log flex items-center">
            <span className="br-log-label">REGISTRO DEL SISTEMA</span>
            <span className="br-log-time">[{timecode}]</span>
            <p>{level.log}</p>
            <span
              className="br-signal-bars"
              aria-label={`Señal ${level.signal}%`}
            >
              ▂▃▅▆ <b>{level.signal}%</b>
            </span>
          </div>
        </section>
      </div>
      <footer className="br-footer flex justify-between">
        <span>NO DEBERÍAS ESTAR ACÁ.</span>
        <span>
          PROYECTO EXPERIMENTAL <i> / </i> NEXT.JS + THREE.JS{" "}
          <span className="br-footer-square">■</span>
        </span>
      </footer>
      {/* Diálogo nativo: gestiona foco y Escape. Al cerrar recupera el estado de pausa que tenía la escena. */}
      <dialog
        ref={guide}
        className="br-guide"
        onClose={() => setPaused(pausedBeforeGuide.current)}
      >
        <form method="dialog">
          <button className="br-guide-close" aria-label="Cerrar guía">
            ×
          </button>
        </form>
        <p className="br-eyebrow">DOCUMENTO BR / 001</p>
        <h2>
          Guía de campo<span>_</span>
        </h2>
        <p>
          Elegí un nivel del directorio y activá <strong>Explorar nivel</strong>{" "}
          para entrar. Cada nivel es una recreación procedural inspirada en la
          ficción colectiva de los Backrooms.
        </p>
        <dl>
          <dt>W A S D / ↑ ↓ ← →</dt>
          <dd>Desplazarte por el entorno.</dd>
          <dt>ARRASTRAR EL VISOR</dt>
          <dd>Mirar alrededor con mouse o pantalla táctil.</dd>
          <dt>CONTROLES EN PANTALLA</dt>
          <dd>Moverte desde un dispositivo táctil.</dd>
          <dt>VHS / PAUSA</dt>
          <dd>Desactivar efectos o detener la animación.</dd>
        </dl>
        <p className="br-guide-note">{level.note}</p>
        <small>
          Experiencia de ficción para un proyecto académico. No contiene audio
          ni requiere una cuenta.
        </small>
      </dialog>
    </main>
  );
}
