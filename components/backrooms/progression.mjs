export const PROGRESS_KEY = "backrooms-br-a-campaign-v1";

// Sólo se conserva una cadena continua de niveles finalizados.
export function normalizeCompleted(levels, value) {
  if (!Array.isArray(value)) return [];
  const completed = [];
  for (const level of levels) {
    if (!value.includes(level.number)) break;
    completed.push(level.number);
  }
  return completed;
}

export function missingPrerequisites(levels, levelId, completed) {
  const index = levels.findIndex((level) => level.id === levelId);
  if (index < 0) return levels;
  return levels.slice(0, index).filter((level) => !completed.includes(level.number));
}

export function readProgress(levels, storage) {
  try {
    return normalizeCompleted(levels, JSON.parse(storage.getItem(PROGRESS_KEY) || "[]"));
  } catch {
    return [];
  }
}

export function saveProgress(levels, completed, storage) {
  try {
    storage.setItem(PROGRESS_KEY, JSON.stringify(normalizeCompleted(levels, completed)));
    return true;
  } catch {
    return false;
  }
}
