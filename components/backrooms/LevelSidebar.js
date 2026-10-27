/**
 * Selector minimalista de niveles. No mantiene una selección propia:
 * recibe el nivel activo y comunica los clics al componente padre.
 */
"use client";

import { levels } from "@/data/levels";

export default function LevelSidebar({ activeLevel, onSelect }) {
  return (
    <aside className="br-sidebar" aria-label="Navegación de niveles">
      <p className="br-sidebar-label">~/frecuencias <span>[03]</span></p>
      <nav className="br-levels" aria-label="Niveles de los Backrooms">
        {/* Se genera un botón por nivel. aria-current identifica la selección y el nombre accesible incluye su número. */}
        {levels.map((level) => (
          <button
            key={level.id}
            className={`br-level ${level.id === activeLevel ? "is-active" : ""}`}
            onClick={() => onSelect(level.id)}
            aria-current={level.id === activeLevel ? "true" : undefined}
            aria-label={`Nivel ${level.number}: ${level.name}`}
          >
            <small>{level.number}</small>{level.name}
          </button>
        ))}
      </nav>
      <div className="br-terminal-session"><span>operador@liminal</span><p>archivo <b>BR-A</b></p><p>estado <b>conectado</b></p><p>salida <b>pendiente</b></p><small>Todo acceso deja un eco.</small></div>
    </aside>
  );
}
