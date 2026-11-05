// La misma posición alimenta la regla de regreso, la puerta 3D y el mapa.
export const ENTRY_DOOR = { x: 0, z: 11.5, radius: 1.3 };

export const CHANNELS = [881, 883, 887, 891, 906];

export function createJourney(level) {
  const stages = level.stages || [{ title: "Intervenciones", tasks: level.stations.map((station, i) => ({
    id: `station-${i}`, station: i, label: station.label, duration: level.theme === "garden" ? 3 : 0,
  })) }];
  const tasks = stages.flatMap((stage) => stage.tasks);
  const done = new Set(), activated = new Set(), inventory = new Set();
  const frequencies = level.stations.map(() => CHANNELS[0]);
  let still = 0, nearest = -1, finished = false, nearDoor = false, stageIndex = 0;
  const currentStage = () => stages[stageIndex];
  const currentTasks = () => {
    const stage = currentStage();
    if (!stage) return [];
    const pending = stage.tasks.filter((task) => !done.has(task.id));
    return stage.ordered ? pending.slice(0, 1) : pending;
  };
  const nearbyTask = () => currentTasks().find((task) => task.station === nearest);
  const tuned = (task) => !task?.frequency || frequencies[task.station] === task.frequency;
  const ready = (task) => !!task && tuned(task) && still >= (task.duration || 0) && (!task.consumes || inventory.has(task.consumes));

  return {
    update(x, z, moving, dt) {
      if (finished) return;
      let next = -1, distance = 1.8;
      level.stations.forEach((station, i) => {
        const candidate = Math.hypot(x - station.x, z - station.z);
        if (candidate < distance) { next = i; distance = candidate; }
      });
      const changed = next !== nearest;
      nearest = next;
      const task = nearbyTask();
      still = changed || moving || !task || !tuned(task) ? 0 : Math.min(task.duration || 0, still + Math.max(0, dt));
      nearDoor = Math.hypot(x - ENTRY_DOOR.x, z - ENTRY_DOOR.z) < ENTRY_DOOR.radius;
      if (done.size === tasks.length && nearDoor) finished = true;
    },
    tune(direction) {
      if (finished || nearest < 0 || !level.stations[nearest].frequency) return false;
      const index = CHANNELS.indexOf(frequencies[nearest]);
      frequencies[nearest] = CHANNELS[(index + (direction > 0 ? 1 : -1) + CHANNELS.length) % CHANNELS.length];
      still = 0;
      return true;
    },
    interact() {
      const task = nearbyTask();
      if (finished || !ready(task)) return false;
      done.add(task.id);
      if (task.consumes) inventory.delete(task.consumes);
      if (task.gives) inventory.add(task.gives);
      if (tasks.filter((item) => item.station === nearest).every((item) => done.has(item.id))) activated.add(nearest);
      if (currentStage().tasks.every((item) => done.has(item.id))) stageIndex++;
      still = 0;
      return true;
    },
    snapshot() {
      const objectiveComplete = done.size === tasks.length;
      const task = nearbyTask(), stage = currentStage();
      const wait = task?.duration || 0;
      let prompt = stage?.hint || level.objective;
      if (nearest >= 0 && !objectiveComplete) {
        if (task) {
          prompt = !tuned(task) ? `Q / R · Sintonizá ${(task.frequency / 10).toFixed(1)} MHz para recibir la señal.`
            : ready(task) ? `E · ${task.label}`
            : `No te muevas · ${task.label} · ${Math.floor(still / wait * 100)}%`;
        } else {
          const pending = tasks.some((item) => item.station === nearest && !done.has(item.id));
          prompt = pending ? `${level.stations[nearest].label}: todavía sin habilitar. ${currentTasks()[0]?.label || "Completá la etapa actual"}.`
            : `${level.stations[nearest].label} · intervención completada.`;
        }
      }
      if (nearDoor && !objectiveComplete) prompt = "La puerta está cerrada. Primero completá todas las etapas de la misión.";
      if (objectiveComplete) prompt = "Objetivo cumplido. Volvé a la puerta por la que entraste para regresar a la terminal.";
      if (finished) prompt = level.ending;
      return {
        progress: done.size, total: tasks.length, finished, objectiveComplete, ready: ready(task), prompt,
        stageIndex, stageCount: stages.length, stageTitle: stage?.title || "Regreso a la terminal", hint: stage?.hint,
        checklist: stage?.tasks.map((item) => ({ id: item.id, label: item.label, done: done.has(item.id), station: item.station + 1 })) || [],
        inventory: [...inventory], activated: [...activated], available: currentTasks().map((item) => item.station),
        signal: wait && task && tuned(task) ? still / wait : 0,
        frequency: nearest >= 0 && level.stations[nearest].frequency ? (frequencies[nearest] / 10).toFixed(1) : null,
      };
    },
    activated, done,
  };
}
