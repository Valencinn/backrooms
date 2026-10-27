/**
 * Motor visual del explorador, encapsulado en un Client Component.
 * React controla el contenedor; Three.js controla solamente su canvas.
 * Ejes: X lateral, Y altura, Z profundidad. La cámara mira inicialmente hacia -Z.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { createLevelWorld } from "./levelWorld";
import { configureRenderer, addEnvironment } from "./graphics";

export default function ThreeViewer({
  level,
  exploring,
  paused,
  effects,
  onTelemetry,
}) {
  // Las refs conservan valores mutables que el loop consulta sin reconstruir la escena en cada render.
  const mountRef = useRef(null);
  const settingsRef = useRef({ exploring, paused, effects });
  const telemetryRef = useRef(onTelemetry);
  const inputRef = useRef(new Set());
  const [status, setStatus] = useState("loading");
  // Sincroniza controles con el loop. Pausar o terminar la exploración borra teclas retenidas.
  useEffect(() => {
    settingsRef.current = { exploring, paused, effects };
    if (!exploring || paused) inputRef.current.clear();
  }, [exploring, paused, effects]);
  // Mantiene el callback actualizado sin convertirlo en dependencia de la creación del renderer.
  useEffect(() => {
    telemetryRef.current = onTelemetry;
  }, [onTelemetry]);

  // Este efecto es dueño de los recursos de un nivel y devuelve su función de limpieza.
  useEffect(() => {
    const mount = mountRef.current;
    // WebGL puede fallar por configuración del navegador: la interfaz sigue disponible y muestra el error.
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: true,
        powerPreference: "high-performance",
      });
    } catch {
      queueMicrotask(() => setStatus("error"));
      return;
    }
    // Limitar el pixel ratio contiene el costo gráfico en pantallas de alta densidad.
    configureRenderer(renderer);
    renderer.toneMappingExposure = level.theme === "pool" ? 1.1 : 0.95;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      `Escena tridimensional del nivel ${level.number}: ${level.name}`,
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.tabIndex = 0;
    renderer.domElement.focus({ preventScroll: true });

    // Fondo y niebla comparten color para fundir los objetos distantes con el ambiente.
    const scene = new THREE.Scene();
    const environment = addEnvironment(renderer, scene, level.theme === "hills" ? 0.22 : 0.35);
    const fogColor =
      level.id === 0 ? "#82703d" : level.id === 1 ? "#303b37" : "#382a20";
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, level.id === 0 ? 0.037 : 0.055);
    // Perspectiva de 68 grados. YXZ aplica el giro horizontal antes de la inclinación vertical.
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 230);
    camera.position.set(0, 1.65, 9);
    camera.rotation.order = "YXZ";
    let yaw = 0,
      pitch = -0.035;
    const world = createLevelWorld(scene, level, renderer);
    renderer.shadowMap.needsUpdate = true;
    const { collisions, fluorescentLights } = world;

    // Un Set guarda las teclas presionadas: el movimiento se calcula continuamente en animate.
    const keys = inputRef.current;
    let dragging = false,
      pointerId = null,
      lastX = 0,
      lastY = 0;
    const keyCodes = [
      "KeyE",
      "KeyW",
      "KeyA",
      "KeyS",
      "KeyD",
      "ArrowUp",
      "ArrowDown",
      "ArrowLeft",
      "ArrowRight",
    ];
    // Captura solo movimiento durante la exploración y respeta formularios y diálogos.
    const keydown = (event) => {
      if (
        !settingsRef.current.exploring ||
        settingsRef.current.paused ||
        event.target.closest("dialog, input, textarea") ||
        !keyCodes.includes(event.code)
      )
        return;
      event.preventDefault();
      if (event.code === "KeyE") {
        if (!event.repeat) world.journey.interact();
      } else keys.add(event.code);
    };
    const keyup = (event) => keys.delete(event.code);
    // Limpia entradas si se pierde foco o se interrumpe el puntero para evitar movimiento retenido.
    const clearInput = () => {
      keys.clear();
      dragging = false;
    };
    // Pointer capture conserva el arrastre aunque el mouse salga del canvas; no bloquea el cursor.
    const down = (event) => {
      if (!settingsRef.current.exploring) return;
      dragging = true;
      pointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      renderer.domElement.setPointerCapture(event.pointerId);
      renderer.domElement.focus({ preventScroll: true });
    };
    // Los desplazamientos cambian yaw y pitch; se limita la inclinación vertical a una vista cómoda.
    const move = (event) => {
      if (
        !dragging ||
        !settingsRef.current.exploring ||
        settingsRef.current.paused
      )
        return;
      yaw -= (event.clientX - lastX) * 0.003;
      pitch = THREE.MathUtils.clamp(
        pitch - (event.clientY - lastY) * 0.003,
        -0.85,
        0.85,
      );
      lastX = event.clientX;
      lastY = event.clientY;
    };
    const up = () => {
      dragging = false;
      if (
        pointerId !== null &&
        renderer.domElement.hasPointerCapture(pointerId)
      )
        renderer.domElement.releasePointerCapture(pointerId);
      pointerId = null;
    };
    // Si se pierde el contexto gráfico, muestra una explicación y una opción para recargar.
    const contextLost = (event) => {
      event.preventDefault();
      setStatus("error");
    };
    const visibility = () => {
      if (document.hidden) clearInput();
    };
    // Los listeners se instalan por escena y se retiran simétricamente en el cleanup.
    window.addEventListener("keydown", keydown);
    window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clearInput);
    document.addEventListener("visibilitychange", visibility);
    const canvas = renderer.domElement;
    canvas.addEventListener("pointerdown", down);
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up);
    canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", clearInput);
    canvas.addEventListener("webglcontextlost", contextLost);
    // Observa el contenedor: al cambiar su aspecto también se recalcula la matriz de proyección.
    const resize = () => {
      const { clientWidth: w, clientHeight: h } = mount;
      renderer.setSize(w, h, false);
      camera.aspect = w / Math.max(h, 1);
      camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(mount);
    resize();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let frame,
      last = performance.now(),
      elapsed = 0,
      lastTelemetry = -1;
    // Colisión AABB: rechaza una posición si cae dentro de alguna caja expandida.
    const canMove = (x, z) =>
      !collisions.some(
        (c) => x > c.minX && x < c.maxX && z > c.minZ && z < c.maxZ,
      );
    // Solicita el siguiente frame; pausa y pestaña oculta suspenden actualización y renderizado.
    function animate(now) {
      frame = requestAnimationFrame(animate);
      // Delta en segundos limitado a [0, 0.05]: evita tiempos negativos y saltos largos al retomar.
      const dt = Math.max(0, Math.min((now - last) / 1000, 0.05));
      last = now;
      if (document.hidden || settingsRef.current.paused) return;
      elapsed += dt;
      let moving = false;
      if (settingsRef.current.exploring) {
        const forward =
          Number(keys.has("KeyW") || keys.has("ArrowUp")) -
          Number(keys.has("KeyS") || keys.has("ArrowDown"));
        const right =
          Number(keys.has("KeyD") || keys.has("ArrowRight")) -
          Number(keys.has("KeyA") || keys.has("ArrowLeft"));
        moving = forward !== 0 || right !== 0;
        // Normaliza la diagonal para que combinar dos direcciones no aumente la velocidad.
        const length = Math.hypot(forward, right) || 1;
        // Convierte avance y desplazamiento lateral a coordenadas globales según la orientación horizontal.
        const dx =
          ((-Math.sin(yaw) * forward + Math.cos(yaw) * right) / length) *
          dt *
          2.5;
        const dz =
          ((-Math.cos(yaw) * forward - Math.sin(yaw) * right) / length) *
          dt *
          2.5;
        // Resolver X y Z por separado permite deslizarse al costado de una pared.
        if (canMove(camera.position.x + dx, camera.position.z))
          camera.position.x += dx;
        if (canMove(camera.position.x, camera.position.z + dz))
          camera.position.z += dz;
      }
      const motion = settingsRef.current.effects && !reducedMotion.matches;
      if (settingsRef.current.exploring) {
        world.update(dt, camera, moving, motion);
        if (keys.delete("KeyE")) world.journey.interact();
      }
      // Sin oscilaciones si se solicita movimiento reducido o se desactivan los efectos VHS.
      camera.rotation.set(
        pitch,
        yaw +
          (!settingsRef.current.exploring && motion
            ? Math.sin(elapsed * 0.12) * 0.018
            : 0),
        0,
      );
      fluorescentLights.forEach((light, i) => {
        light.intensity =
          24 * (motion ? 0.96 + Math.sin(elapsed * 7 + i * 5) * 0.025 : 1);
      });
      // Dibuja cada frame, pero publica telemetría a React como máximo unas cuatro veces por segundo.
      renderer.render(scene, camera);
      if (elapsed - lastTelemetry > 0.25) {
        lastTelemetry = elapsed;
        telemetryRef.current({
          x: camera.position.x,
          z: camera.position.z,
          yaw,
          seconds: Math.floor(elapsed),
          ...world.journey.snapshot(),
        });
      }
    }
    // Inicia el loop e informa a React, en una microtarea, que terminó la construcción sincrónica.
    frame = requestAnimationFrame(animate);
    queueMicrotask(() => setStatus("ready"));

    // Cambiar de nivel o desmontar requiere liberar cada recurso de GPU, también en Strict Mode.
    // Cancelar el frame no basta: geometrías, materiales, texturas y renderer requieren dispose().
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      keys.clear();
      window.removeEventListener("keydown", keydown);
      window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clearInput);
      document.removeEventListener("visibilitychange", visibility);
      canvas.removeEventListener("pointerdown", down);
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up);
      canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", clearInput);
      canvas.removeEventListener("webglcontextlost", contextLost);
      world.dispose();
      environment.dispose();
      scene.clear();
      renderer.renderLists.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    };
  }, [level]);

  // Los botones táctiles usan el mismo Set que el teclado; la captura permite soltar fuera del botón.
  function touchControl(code, event, pressed) {
    event.preventDefault();
    if (pressed) {
      event.currentTarget.setPointerCapture(event.pointerId);
      inputRef.current.add(code);
    } else inputRef.current.delete(code);
  }

  return (
    <>
      {/* React crea el contenedor; el efecto agrega y retira el canvas de Three.js. */}
      <div ref={mountRef} className="br-three-mount" />
      {/* Estados accesibles de carga y error, independientes del contenido narrativo. */}
      {status === "loading" && (
        <div className="br-scene-status" role="status">
          SINTONIZANDO FRECUENCIA…
        </div>
      )}
      {status === "error" && (
        <div className="br-scene-status br-scene-error" role="alert">
          <strong>TRANSMISIÓN INTERRUMPIDA</strong>
          <p>
            No se pudo iniciar el visor WebGL. Activá la aceleración gráfica de
            tu navegador y recargá la página.
          </p>
          <button onClick={() => window.location.reload()}>RECONECTAR ↗</button>
        </div>
      )}
      {/* Movimiento alternativo con mouse, tacto o teclado, deshabilitado durante la pausa. */}
      {exploring && status === "ready" && (
        <div
          className="br-touch-controls"
          aria-label="Controles de desplazamiento"
        >
          <button className="br-interact-button" disabled={paused} onClick={() => inputRef.current.add("KeyE")} aria-label="Interactuar con objeto cercano">E · USAR</button>
          {[
            ["KeyW", "↑", "Avanzar"],
            ["KeyA", "←", "Mover a la izquierda"],
            ["KeyS", "↓", "Retroceder"],
            ["KeyD", "→", "Mover a la derecha"],
          ].map(([code, arrow, label]) => (
            <button
              key={code}
              aria-label={label}
              disabled={paused}
              onPointerDown={(e) => touchControl(code, e, true)}
              onPointerUp={(e) => touchControl(code, e, false)}
              onPointerCancel={(e) => touchControl(code, e, false)}
              onLostPointerCapture={() => inputRef.current.delete(code)}
              onKeyDown={(e) => {
                if (e.key === " " || e.key === "Enter") {
                  e.preventDefault();
                  inputRef.current.add(code);
                }
              }}
              onKeyUp={() => inputRef.current.delete(code)}
              onBlur={() => inputRef.current.delete(code)}
            >
              {arrow}
            </button>
          ))}
        </div>
      )}
    </>
  );
}
