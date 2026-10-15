/**
 * Selector minimalista de niveles. No mantiene una selección propia:
 * recibe el nivel activo y comunica los clics al componente padre.
 */
"use client";

import { levels } from "@/data/levels";

export default function LevelSidebar({ activeLevel, onSelect }) {
  return (
    <aside className="br-sidebar" aria-label="Navegación de niveles">
      <p className="br-sidebar-label">NIVELES</p>
      <nav className="br-levels" aria-label="Niveles de los Backrooms">
        {/* Se genera un botón por nivel. aria-current identifica la selección y el nombre accesible incluye su número. */}
        {levels.map((level) => (
          <button
            key={level.id}
            className={`br-level ${level.id === activeLevel ? "is-active" : ""}`}
            onClick={() => onSelect(level.id)}
            aria-current={level.id === activeLevel ? "true" : undefined}
            aria-label={`Nivel ${level.id}: ${level.name}`}
          >
            {level.name}
          </button>
        ))}
      </nav>
    </aside>
  );
}
