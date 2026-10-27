import test from "node:test";
import assert from "node:assert/strict";
import { createJourney, ENTRY_DOOR } from "../components/backrooms/journey.mjs";
import { runCommand } from "../components/backrooms/terminalCommands.mjs";

const level = {
  id: 0, number: "94721", name: "La hora prestada", theme: "hills",
  objective: "Encendé tres ventanas.", ending: "Amaneció.",
  stations: [{ x: -3, z: 3, label: "Ayer" }, { x: 3, z: -8, label: "Ahora" }, { x: -3, z: -21, label: "Mañana" }],
};
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
