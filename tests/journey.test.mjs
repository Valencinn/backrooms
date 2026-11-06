import test from "node:test";
import { bindFreeLook } from "../components/backrooms/freeLook.mjs";
import assert from "node:assert/strict";
import { createJourney, ENTRY_DOOR, CHANNELS } from "../components/backrooms/journey.mjs";
import { runCommand } from "../components/backrooms/terminalCommands.mjs";
import { missions } from "../data/missions.mjs";
import { normalizeCompleted, readProgress, saveProgress, PROGRESS_KEY } from "../components/backrooms/progression.mjs";

const level = {
  id: 0, number: "94721", name: "La hora prestada", theme: "hills",
  objective: "Encendé tres ventanas.", ending: "Amaneció.",
  stations: [{ x: -3, z: 3, label: "Ayer" }, { x: 3, z: -8, label: "Ahora" }, { x: -3, z: -21, label: "Mañana" }],
};

test("la cámara gira sin botones, no duplica movimiento capturado y limpia listeners", () => {
  const previousDocument = globalThis.document, previousWindow = globalThis.window;
  class Surface {
    listeners = new Map();
    addEventListener(type, fn) { this.listeners.set(type, fn); }
    removeEventListener(type) { this.listeners.delete(type); }
    emit(type, values = {}) { this.listeners.get(type)?.({ type, pointerType: "mouse", buttons: 0, ...values }); }
    focus() {}
    requestPointerLock() { globalThis.document.pointerLockElement = this; }
  }
  const canvas = new Surface(), doc = new Surface(), win = new Surface();
  win.matchMedia = () => ({ matches: true });
  doc.exitPointerLock = () => { doc.pointerLockElement = null; };
  globalThis.document = doc; globalThis.window = win;
  const movements = [];
  let active = true;
  try {
    const look = bindFreeLook(canvas, { active: () => active, rotate: (...delta) => movements.push(delta), clear() {} });
    canvas.emit("pointermove", { clientX: 100, clientY: 100 });
    canvas.emit("pointermove", { clientX: 125, clientY: 95 });
    assert.deepEqual(movements, [[25, -5]]);
    canvas.emit("pointerleave");
    canvas.emit("pointermove", { clientX: 900, clientY: 500 });
    assert.equal(movements.length, 1, "volver a la escena no hace saltar la cámara");
    canvas.emit("click");
    canvas.emit("pointermove", { movementX: 5, movementY: 3 });
    doc.emit("mousemove", { movementX: 5, movementY: 3 });
    assert.deepEqual(movements[1], [5, 3]);
    assert.equal(movements.length, 2);
    active = false;
    doc.emit("mousemove", { movementX: 50, movementY: 30 });
    assert.equal(movements.length, 2, "pausa impide mirar");
    look.dispose();
    assert.equal(doc.pointerLockElement, null);
    assert.equal(canvas.listeners.size + doc.listeners.size + win.listeners.size, 0);
  } finally {
    globalThis.document = previousDocument; globalThis.window = previousWindow;
  }
});
function activate(journey, station) {
  journey.update(station.x, station.z, false, 0);
  assert.equal(journey.interact(), true);
}

test("la puerta no permite regresar antes de completar el objetivo", () => {
  const journey = createJourney(level);
  journey.update(ENTRY_DOOR.x, ENTRY_DOOR.z, false, 5);
  assert.equal(journey.snapshot().finished, false);
  assert.match(journey.snapshot().prompt, /cerrada/);
  activate(journey, level.stations[0]);
  journey.update(ENTRY_DOOR.x, ENTRY_DOOR.z, false, 1);
  assert.equal(journey.snapshot().finished, false);
  assert.equal(journey.snapshot().objectiveComplete, false);
});

test("completar abre el regreso, pero exige volver a la entrada y no al antiguo umbral", () => {
  const journey = createJourney(level);
  for (const station of level.stations) activate(journey, station);
  assert.equal(journey.snapshot().objectiveComplete, true);
  assert.equal(journey.snapshot().finished, false);
  assert.match(journey.snapshot().prompt, /Volvé a la puerta/);
  journey.update(0, -28, false, 1);
  assert.equal(journey.snapshot().finished, false);
  journey.update(ENTRY_DOOR.x + 4, ENTRY_DOOR.z, false, 1);
  assert.equal(journey.snapshot().finished, false);
  journey.update(ENTRY_DOOR.x, ENTRY_DOOR.z, false, 1);
  assert.equal(journey.snapshot().finished, true);
  assert.equal(journey.snapshot().prompt, level.ending);
  assert.equal(journey.interact(), false);
});

test("las intervenciones no se duplican, aceptan cualquier orden y el reinicio queda limpio", () => {
  const journey = createJourney(level);
  for (const index of [2, 0, 1]) {
    activate(journey, level.stations[index]);
    journey.update(level.stations[index].x, level.stations[index].z, false, 3);
    assert.equal(journey.interact(), false);
  }
  assert.equal(journey.snapshot().progress, 3);
  assert.equal(createJourney(level).snapshot().progress, 0);
});

test("el jardín exige quietud y caminar o cambiar de receptor reinicia la recepción", () => {
  const journey = createJourney({ ...level, theme: "garden" });
  const a = level.stations[0], b = level.stations[1];
  journey.update(a.x, a.z, false, 0);
  journey.update(a.x, a.z, false, 2.5);
  assert.equal(journey.interact(), false);
  journey.update(a.x, a.z, true, 0.1);
  journey.update(a.x, a.z, false, 2.5);
  assert.equal(journey.interact(), false);
  journey.update(b.x, b.z, false, 1);
  assert.equal(journey.interact(), false);
  journey.update(b.x, b.z, false, 3);
  assert.equal(journey.interact(), true);
  journey.update(ENTRY_DOOR.x, ENTRY_DOOR.z, false, 1);
  assert.equal(journey.snapshot().finished, false);
});

test("la terminal resuelve números y rechaza entradas inválidas", () => {
  assert.equal(runCommand("  ENTRAR   94721 ", [level], []).levelId, 0);
  assert.equal(runCommand("94721", [level], []).action, "enter");
  assert.equal(runCommand("info 94721", [level], []).action, "output");
  assert.match(runCommand("entrar 99999", [level], []).text, /no encontrada/);
  assert.equal(runCommand("entrar 94721 extra", [level], []).action, "output");
  assert.equal(runCommand("entrar 94721; salir", [level], []).action, "output");
  assert.equal(runCommand("clear", [level], []).action, "clear");
  assert.equal(runCommand("salir", [level], []).action, "leave");
  assert.match(runCommand("estado", [level], [level.number]).text, /1\/1/);
  assert.match(runCommand("ls", [level], [level.number]).text, /\[✓\] 94721/);
});

const campaign = [
  { ...level, ...missions.hills },
  { ...level, ...missions.pool, id: 1, number: "96308", name: "El último turno", theme: "pool" },
  { ...level, ...missions.garden, id: 2, number: "98144", name: "Jardín de espera", theme: "garden" },
];

function visit(journey, mission, station) {
  const target = mission.stations[station];
  journey.update(target.x, target.z, false, 0);
}

function completeTask(journey, mission, task) {
  visit(journey, mission, task.station);
  if (task.frequency) {
    for (let i = 0; i < CHANNELS.indexOf(task.frequency); i++) journey.tune(1);
  }
  const target = mission.stations[task.station];
  journey.update(target.x, target.z, false, task.duration || 0);
  assert.equal(journey.interact(), true, task.id);
}

test("todos los alias de acceso exigen completar todos los niveles anteriores", () => {
  for (const command of ["entrar", "open", "nivel", ""]) {
    for (const mission of campaign.slice(1)) {
      const result = runCommand(`${command} ${mission.number}`, campaign, []);
      assert.equal(result.action, "output");
      assert.match(result.text, /ACCESO BLOQUEADO/);
    }
  }
  assert.equal(runCommand("entrar 98144", campaign, ["96308"]).action, "output");
  assert.equal(runCommand("entrar 98144", campaign, ["94721"]).action, "output");
  assert.equal(runCommand("entrar 98144", campaign, ["94721", "96308"]).action, "enter");
  assert.equal(runCommand("entrar 94721", campaign, campaign.map((item) => item.number)).action, "enter");
  assert.equal(runCommand("info 98144", campaign, []).action, "output");
  assert.match(runCommand("niveles", campaign, []).text, /BLOQUEADO/);
});

test("el progreso persistente elimina duplicados, desconocidos y saltos de campaña", () => {
  assert.deepEqual(normalizeCompleted(campaign, ["96308", "98144"]), []);
  assert.deepEqual(normalizeCompleted(campaign, ["94721", "98144"]), ["94721"]);
  assert.deepEqual(normalizeCompleted(campaign, ["96308", "94721", "94721", "otro"]), ["94721", "96308"]);
  const values = new Map();
  const storage = { getItem: (key) => values.get(key), setItem: (key, value) => values.set(key, value) };
  assert.equal(saveProgress(campaign, ["94721", "96308"], storage), true);
  assert.deepEqual(readProgress(campaign, storage), ["94721", "96308"]);
  values.set(PROGRESS_KEY, "{JSON roto");
  assert.deepEqual(readProgress(campaign, storage), []);
  values.set(PROGRESS_KEY, '{"94721":true}');
  assert.deepEqual(readProgress(campaign, storage), []);
  const deniedStorage = { getItem() { throw Error("denied"); }, setItem() { throw Error("quota"); } };
  assert.deepEqual(readProgress(campaign, deniedStorage), []);
  assert.equal(saveProgress(campaign, ["94721"], deniedStorage), false);
});

test("las cartas se recogen libremente, se consumen al entregar y no permiten adelantar el reloj", () => {
  const mission = campaign[0], journey = createJourney(mission);
  visit(journey, mission, 6);
  journey.update(0, -28, false, 20);
  assert.equal(journey.interact(), false);
  for (const task of [...mission.stages[0].tasks].reverse()) completeTask(journey, mission, task);
  assert.equal(journey.snapshot().inventory.length, 3);
  const wrong = mission.stations[2];
  visit(journey, mission, 2);
  journey.update(wrong.x, wrong.z, false, 10);
  assert.equal(journey.interact(), false);
  assert.match(journey.snapshot().prompt, /sin habilitar/);
  completeTask(journey, mission, mission.stages[1].tasks[0]);
  assert.equal(journey.snapshot().inventory.includes("Carta del ayer"), false);
  assert.equal(journey.snapshot().inventory.length, 2);
  assert.equal(journey.interact(), false);
});

test("no se puede recibir sin energía o en otro canal; moverse y resintonizar reinician la señal", () => {
  const mission = campaign[2], journey = createJourney(mission);
  visit(journey, mission, 0);
  journey.tune(1);
  journey.update(-3, 3, false, 10);
  assert.equal(journey.interact(), false);
  for (const task of mission.stages[0].tasks) completeTask(journey, mission, task);
  visit(journey, mission, 0);
  journey.tune(1); // 88.7: incorrecto, aunque el tiempo transcurra.
  journey.update(-3, 3, false, 10);
  assert.equal(journey.interact(), false);
  journey.tune(-1); // 88.3.
  journey.update(-3, 3, false, 2.5);
  assert.equal(journey.interact(), false);
  journey.update(-3, 3, true, .1);
  journey.update(-3, 3, false, 2.5);
  assert.equal(journey.interact(), false);
  journey.tune(1);
  journey.tune(-1);
  assert.equal(journey.snapshot().signal, 0);
  journey.update(-3, 3, false, 3);
  assert.equal(journey.interact(), true);
  assert.deepEqual(journey.snapshot().inventory, ["Fragmento: el próximo"]);
});

for (const mission of campaign) {
  test(`${mission.number}: la misión completa exige todas las etapas y volver por la puerta`, () => {
    const journey = createJourney(mission);
    const tasks = mission.stages.flatMap((stage) => stage.tasks);
    for (const [index, task] of tasks.entries()) {
      completeTask(journey, mission, task);
      assert.equal(journey.snapshot().progress, index + 1);
      assert.equal(journey.snapshot().finished, false);
      journey.update(ENTRY_DOOR.x, ENTRY_DOOR.z, false, 1);
      assert.equal(journey.snapshot().finished, index === tasks.length - 1);
    }
    assert.equal(journey.snapshot().objectiveComplete, true);
    assert.equal(journey.snapshot().stageIndex, mission.stages.length);
    assert.equal(journey.interact(), false);
    assert.equal(createJourney(mission).snapshot().progress, 0);
    assert.deepEqual(createJourney(mission).snapshot().inventory, []);
  });
}
