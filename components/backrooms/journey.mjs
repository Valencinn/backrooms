// La misma posición alimenta la regla de regreso, la puerta 3D y el mapa.
export const ENTRY_DOOR = { x: 0, z: 11.5, radius: 1.3 };

export function createJourney(level) {
  const activated = new Set();
  let still = 0, nearest = -1, finished = false, nearDoor = false;
  return {
    update(x, z, moving, dt) {
      if (finished) return;
      const next = level.stations.findIndex((station, i) => !activated.has(i) && Math.hypot(x - station.x, z - station.z) < 2.3);
      still = next !== nearest || moving || next === -1 ? 0 : Math.min(3, still + dt);
      nearest = next;
      nearDoor = Math.hypot(x - ENTRY_DOOR.x, z - ENTRY_DOOR.z) < ENTRY_DOOR.radius;
      if (activated.size === level.stations.length && nearDoor) finished = true;
    },
    interact() {
      if (finished || nearest < 0 || (level.theme === "garden" && still < 3)) return false;
      activated.add(nearest); nearest = -1; still = 0;
      return true;
    },
    snapshot() {
      const objectiveComplete = activated.size === level.stations.length;
      const ready = nearest >= 0 && (level.theme !== "garden" || still >= 3);
      return {
        progress: activated.size, total: level.stations.length, finished, objectiveComplete, ready,
        prompt: finished ? level.ending : objectiveComplete
          ? "Objetivo cumplido. Volvé a la puerta por la que entraste para regresar a la terminal."
          : nearDoor ? "La puerta está cerrada. Primero completá el objetivo del nivel."
          : nearest >= 0 ? ready ? `E · ${level.stations[nearest].label}` : `No te muevas · señal ${Math.floor(still / 3 * 100)}%`
          : level.objective,
      };
    },
    activated,
  };
}
