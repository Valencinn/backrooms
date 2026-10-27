"use client";

import { useEffect, useState } from "react";

const lines = [
  "Montando archivo de frecuencias",
  "Restaurando memoria del operador",
  "Estableciendo enlace con la habitación",
];

// Secuencia narrativa de arranque: no representa descargas ni mediciones del equipo.
export default function BootScreen() {
  const [step, setStep] = useState(0);
  useEffect(() => {
    const timers = lines.map((_, i) => setTimeout(() => setStep(i + 1), (i + 1) * 850));
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="br-entry-loading br-boot" role="status" aria-label="Iniciando terminal liminal">
      <div className="br-boot-window">
        <div className="br-boot-titlebar"><span>tty0 — liminal boot</span><span aria-hidden="true">[ − ][ □ ][ × ]</span></div>
        <div className="br-boot-body">
          <div className="br-boot-identity">
            <pre className="br-boot-ascii" aria-hidden="true">{"       /\\\n      /  \\\n     / /\\ \\\n    / ____ \\\n   /_/    \\_\\"}</pre>
            <div><p className="br-boot-user">operador@liminal</p><p>─────────────────</p><h1>THE BACKROOMS</h1><p>BR-A / terminal de lo imposible</p></div>
          </div>
          <p className="br-boot-command"><span>root@liminal:~#</span> iniciar --sesion operador</p>
          <div className="br-boot-lines" aria-hidden="true">
            {lines.map((line, i) => <p key={line} className={step > i ? "is-loaded" : ""}><span>{step > i ? "[ OK ]" : "[ .. ]"}</span> {line}</p>)}
          </div>
          <p className="br-boot-wait">{step === lines.length ? "Esperando al otro lado de la pantalla" : "Iniciando sesión"}<span className="br-terminal-cursor" aria-hidden="true">▌</span></p>
          <div className="br-boot-track" aria-hidden="true"><i /></div>
          <p className="br-boot-footnote">NO APAGUES LA TERMINAL. TODAVÍA NO SABEMOS QUIÉN LA ENCENDIÓ.</p>
        </div>
      </div>
    </div>
  );
}
