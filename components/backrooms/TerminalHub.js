"use client";

import { useEffect, useRef, useState } from "react";

export default function TerminalHub({ active, transcript, onCommand, completedCount }) {
  const [command, setCommand] = useState("");
  const history = useRef([]);
  const historyIndex = useRef(0);
  const draft = useRef("");
  const input = useRef(null);
  const end = useRef(null);
  useEffect(() => { if (active) input.current?.focus({ preventScroll: true }); }, [active]);
  useEffect(() => { if (active) end.current?.scrollIntoView({ block: "nearest" }); }, [active, transcript]);

  function submit(event) {
    event.preventDefault();
    const value = command.trim();
    if (!value) return;
    history.current = [...history.current, value].slice(-50);
    historyIndex.current = history.current.length;
    draft.current = "";
    setCommand("");
    onCommand(value);
  }

  return (
    <main className="br-shell" hidden={!active}>
      <header className="br-shell-bar"><span><i aria-hidden="true" />operador@liminal: ~/frecuencias</span><span>tty1 / BR-A</span></header>
      <div className="br-shell-body">
        <section className="br-shell-banner" aria-label="Terminal de los Backrooms">
          <pre aria-hidden="true">{"       /\\\n      /  \\\n     / /\\ \\\n    / ____ \\\n   /_/    \\_\\"}</pre>
          <div><p>operador@liminal</p><h1>THE BACKROOMS</h1><span>Terminal de acceso a lo imposible.</span><small>3 frecuencias · {completedCount} recuperadas · sesión local</small></div>
        </section>
        <div className="br-shell-log" role="log" aria-label="Historial de la terminal" aria-live="polite" tabIndex={0}>
          {transcript.map((line, i) => line.type === "command"
            ? <p className="br-shell-echo" key={i}><span>operador@liminal:~$</span> {line.text}</p>
            : <pre className="br-shell-output" key={i}>{line.text}</pre>)}
          <div ref={end} />
        </div>
        <form className="br-shell-prompt" onSubmit={submit}>
          <label htmlFor="terminal-command">operador@liminal:~$</label>
          <input ref={input} id="terminal-command" aria-label="Comando de terminal" value={command}
            onChange={(event) => setCommand(event.target.value)} placeholder="entrar 94721" maxLength={120}
            autoComplete="off" autoCapitalize="off" spellCheck={false} enterKeyHint="go"
            onKeyDown={(event) => {
              if (!["ArrowUp", "ArrowDown"].includes(event.key)) return;
              event.preventDefault();
              if (historyIndex.current === history.current.length) draft.current = command;
              historyIndex.current = Math.max(0, Math.min(history.current.length, historyIndex.current + (event.key === "ArrowUp" ? -1 : 1)));
              setCommand(historyIndex.current === history.current.length ? draft.current : history.current[historyIndex.current]);
            }} />
          <button type="submit" aria-label="Ejecutar comando">↵</button>
        </form>
        <footer className="br-shell-footer"><span>ayuda · niveles · info · entrar · estado · limpiar · salir</span><span>↑ ↓ historial</span></footer>
      </div>
    </main>
  );
}
