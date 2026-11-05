"use client";

import { useEffect, useRef, useState } from "react";
import { missingPrerequisites } from "./progression.mjs";

export default function TerminalHub({ active, transcript, onCommand, completed, levels, ready, notice }) {
  const [command, setCommand] = useState("");
  const history = useRef([]);
  const historyIndex = useRef(0);
  const draft = useRef("");
  const input = useRef(null);
  const end = useRef(null);
  useEffect(() => { if (active && ready) input.current?.focus({ preventScroll: true }); }, [active, ready]);
  useEffect(() => { if (active) end.current?.scrollIntoView({ block: "nearest" }); }, [active, transcript]);

  function submit(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    history.current = [...history.current, value].slice(-50);
    historyIndex.current = history.current.length;
    draft.current = "";
    setCommand("");
    input.current?.focus({ preventScroll: true });
    onCommand(value);
  }

  return (
    <main className="br-shell" hidden={!active}>
      <header className="br-shell-bar"><span><i aria-hidden="true" />operador@liminal: ~/frecuencias</span><span>tty1 / BR-A</span></header>
      <div className="br-shell-body">
        <section className="br-shell-banner" aria-label="Terminal de los Backrooms">
          <pre aria-hidden="true">{"       /\\\n      /  \\\n     / /\\ \\\n    / ____ \\\n   /_/    \\_\\"}</pre>
          <div><p>operador@liminal</p><h1>THE BACKROOMS</h1><span>Terminal de acceso a lo imposible.</span><small>3 frecuencias · {completed.length} recuperadas · progreso local</small></div>
        </section>
        <nav className="br-campaign" aria-label="Progreso de campaña">
          {levels.map((level, index) => {
            const locked = !ready || missingPrerequisites(levels, level.id, completed).length > 0;
            const done = completed.includes(level.number);
            return <button key={level.id} disabled={locked} className={done ? "is-complete" : locked ? "is-locked" : "is-next"} onClick={() => onCommand(`entrar ${level.number}`)}>
              <span>0{index + 1} / {level.number}<b>{done ? "✓" : locked ? "×" : "→"}</b></span>
              <strong>{level.name}</strong><small>{!ready ? "LEYENDO PROGRESO…" : done ? "COMPLETADO · VOLVER A ENTRAR" : locked ? `REQUIERE ${levels[index - 1]?.number}` : "ACCESO HABILITADO"}</small>
            </button>;
          })}
        </nav>
        {notice && <p className="br-storage-notice" role="status">{notice}</p>}
        <div className="br-shell-log" role="log" aria-label="Historial de la terminal" aria-live="polite" tabIndex={0}>
          {transcript.map((line, i) => line.type === "command"
            ? <p className="br-shell-echo" key={i}><span>operador@liminal:~$</span> {line.text}</p>
            : <pre className="br-shell-output" key={i}>{line.text}</pre>)}
          <div ref={end} />
        </div>
        <form className="br-shell-prompt" onSubmit={submit}>
          <label htmlFor="terminal-command">operador@liminal:~$</label>
          <input ref={input} id="terminal-command" aria-label="Comando de terminal" value={command}
            disabled={!ready}
            onChange={(event) => setCommand(event.target.value)} placeholder="entrar 94721" maxLength={120}
            autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go"
            onKeyDown={(event) => {
              if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
              event.preventDefault();
              if (historyIndex.current === history.current.length) draft.current = command;
              historyIndex.current = Math.max(0, Math.min(history.current.length, historyIndex.current + (event.key === "ArrowUp" ? -1 : 1)));
              setCommand(historyIndex.current === history.current.length ? draft.current : history.current[historyIndex.current]);
            }} />
          <button type="submit" disabled={!ready} aria-label="Ejecutar comando">↵</button>
        </form>
        <footer className="br-shell-footer"><span>ayuda · niveles · info · entrar · estado · limpiar · salir</span><span>↑ ↓ historial</span></footer>
      </div>
    </main>
  );
}
