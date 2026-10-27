export function runCommand(raw, levels, completed) {
  const parts = raw.trim().toLowerCase().split(/\s+/);
  const [command, argument] = parts;
  const output = (text) => ({ action: "output", text });
  if (["ayuda", "help", "?"].includes(command)) return output(
    "COMANDOS DISPONIBLES\n\nniveles / ls      Listar las frecuencias\ninfo <número>     Leer el objetivo de un nivel\nentrar <número>   Entrar a un nivel\nestado            Ver tus recorridos completados\nlimpiar / clear   Limpiar esta consola\nsalir            Dejar la computadora\n\nDentro de un nivel: completá el objetivo y volvé\na la puerta de entrada. Ese es el regreso a la terminal."
  );
  if (["niveles", "ls", "listar"].includes(command)) return output(
    "FRECUENCIAS / BR-A\n\n" + levels.map((level) => `${completed.includes(level.number) ? "[✓]" : "[ ]"} ${level.number}  ${level.name}`).join("\n") + "\n\nUsá entrar <número> para establecer el enlace."
  );
  if (["estado", "status"].includes(command)) return output(
    `RECORRIDOS RECUPERADOS: ${completed.length}/${levels.length}\n\n` + (completed.length ? levels.filter((level) => completed.includes(level.number)).map((level) => `[ OK ] ${level.number} · ${level.name}`).join("\n") : "Todavía no regresaste de ningún nivel.")
  );
  if (["limpiar", "clear"].includes(command) && parts.length === 1) return { action: "clear" };
  if (["salir", "exit"].includes(command) && parts.length === 1) return { action: "leave" };
  const direct = /^\d+$/.test(command) && parts.length === 1;
  if (direct || ["entrar", "open", "nivel", "info", "cat"].includes(command)) {
    const number = direct ? command : argument;
    if ((!direct && parts.length !== 2) || !number) return output(`Uso: ${command} <número>. Probá niveles para ver las frecuencias.`);
    const level = levels.find((item) => item.number === number);
    if (!level) return output(`Frecuencia ${number} no encontrada. Escribí niveles para consultar el registro.`);
    if (["info", "cat"].includes(command)) return output(`${level.number} / ${level.name}\n\n${level.description}\n\nOBJETIVO: ${level.objective}\n\n${level.note}\n\nLa puerta de entrada se abre al completar el objetivo.`);
    return { action: "enter", levelId: level.id, text: `Enlace establecido: ${level.number} / ${level.name}\nLa terminal esperará tu regreso.` };
  }
  return output(`Comando desconocido: ${command}. Escribí ayuda para ver los comandos.`);
}
