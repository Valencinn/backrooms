/**
 * Motor visual del explorador, encapsulado en un Client Component.
 * React controla el contenedor; Three.js controla solamente su canvas.
 * Ejes: X lateral, Y altura, Z profundidad. La cámara mira inicialmente hacia -Z.
 */
"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

// Texturas repetibles para mantener estable la apariencia entre montajes.
function createTexture(kind, levelId) {
  // Canvas 2D auxiliar: se convierte en textura de GPU y nunca se agrega a la página.
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 256;
  const ctx = canvas.getContext("2d");
  // Semilla fija: el mismo nivel conserva sus texturas entre montajes, incluso en Strict Mode.
  let seed = 71 + levelId;
  const random = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };
  const base =
    kind === "wall"
      ? levelId === 0
        ? "#b6a365"
        : "#777b74"
      : kind === "floor"
        ? levelId === 0
          ? "#786b43"
          : "#50534d"
        : "#b8b5a0";
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 256, 256);
  // El ruido claro y oscuro simula rugosidad sin descargar imágenes externas.
  for (let i = 0; i < 14000; i++) {
    ctx.fillStyle =
      random() > 0.5
        ? `rgba(0,0,0,${random() * 0.13})`
        : `rgba(255,255,220,${random() * 0.12})`;
    ctx.fillRect(
      random() * 256,
      random() * 256,
      1 + random() * 2,
      1 + random() * 2,
    );
  }
  // Papel tapiz del Lobby: líneas, motivos curvos y un degradado de suciedad.
  if (kind === "wall" && levelId === 0) {
    ctx.strokeStyle = "rgba(79,70,34,.22)";
    ctx.lineWidth = 1;
    for (let x = 0; x < 280; x += 16) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 256);
      ctx.stroke();
      for (let y = 0; y < 270; y += 24) {
        ctx.beginPath();
        ctx.moveTo(x, y - 8);
        ctx.quadraticCurveTo(x + 9, y, x, y + 8);
        ctx.quadraticCurveTo(x - 9, y, x, y - 8);
        ctx.stroke();
      }
    }
    const gradient = ctx.createLinearGradient(0, 0, 0, 256);
    gradient.addColorStop(0, "rgba(0,0,0,.15)");
    gradient.addColorStop(0.4, "transparent");
    gradient.addColorStop(1, "rgba(40,28,0,.27)");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);
  }
  // Las juntas permiten leer la escala del techo y las superficies industriales.
  if (kind === "ceiling" || (kind === "wall" && levelId !== 0)) {
    ctx.strokeStyle = "rgba(15,19,15,.25)";
    ctx.lineWidth = 3;
    ctx.strokeRect(1, 1, 254, 254);
    if (kind === "wall") {
      ctx.beginPath();
      ctx.moveTo(0, 128);
      ctx.lineTo(256, 128);
      ctx.stroke();
    }
  }
  // Las manchas radiales evitan una alfombra visualmente uniforme.
  if (kind === "floor") {
    for (let i = 0; i < 25; i++) {
      const x = random() * 256,
        y = random() * 256;
      const gradient = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        10 + random() * 30,
      );
      gradient.addColorStop(0, "rgba(25,21,6,.14)");
      gradient.addColorStop(1, "transparent");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 256, 256);
    }
  }
  // RepeatWrapping repite la imagen; sRGB identifica una textura de color visible.
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

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
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = level.id === 0 ? 1.25 : 1.05;
    mount.appendChild(renderer.domElement);
    renderer.domElement.setAttribute(
      "aria-label",
      `Escena tridimensional del nivel ${level.id}: ${level.name}`,
    );
    renderer.domElement.setAttribute("role", "img");
    renderer.domElement.tabIndex = 0;

    // Fondo y niebla comparten color para fundir los objetos distantes con el ambiente.
    const scene = new THREE.Scene();
    const fogColor =
      level.id === 0 ? "#82703d" : level.id === 1 ? "#303b37" : "#382a20";
    scene.background = new THREE.Color(fogColor);
    scene.fog = new THREE.FogExp2(fogColor, level.id === 0 ? 0.037 : 0.055);
    // Perspectiva de 68 grados. YXZ aplica el giro horizontal antes de la inclinación vertical.
    const camera = new THREE.PerspectiveCamera(68, 1, 0.08, 85);
    camera.position.set(0, 1.65, 9);
    camera.rotation.order = "YXZ";
    let yaw = -0.16,
      pitch = -0.035;
    const height = level.id === 1 ? 4.6 : 3.3;
    // Inventarios de recursos: cada objeto creado se registra para liberarlo explícitamente al desmontar.
    const textures = [];
    const materials = [];
    const geometries = [];
    const collisions = [];
    const fluorescentLights = [];
    // Helpers que crean y registran materiales/texturas; cada recurso compartido se libera una sola vez.
    const makeMaterial = (options) => {
      const m = new THREE.MeshStandardMaterial(options);
      materials.push(m);
      return m;
    };
    const texture = (kind, x, y) => {
      const t = createTexture(kind, level.id);
      t.repeat.set(x, y);
      textures.push(t);
      return t;
    };
    // Materiales PBR: roughness controla rugosidad y metalness distingue tuberías de superficies opacas.
    const wallMat = makeMaterial({
      map: texture("wall", 1.5, 1),
      roughness: 0.95,
      color: level.id === 2 ? "#a18c73" : "#ffffff",
    });
    const floorMat = makeMaterial({
      map: texture("floor", 12, 24),
      roughness: 0.95,
    });
    const ceilingMat = makeMaterial({
      map: texture("ceiling", 11, 22),
      roughness: 1,
    });
    const trimMat = makeMaterial({
      color: level.id === 0 ? "#605936" : "#343b36",
      roughness: 1,
    });
    const pipeMat = makeMaterial({
      color: "#68513a",
      roughness: 0.8,
      metalness: 0.65,
    });
    const lightMat = makeMaterial({
      color: "#fff9ca",
      emissive: "#fff2bb",
      emissiveIntensity: 2.5,
    });
    const fixtureMat = makeMaterial({
      color: "#6f7065",
      metalness: 0.4,
      roughness: 0.7,
    });

    // Crea una caja, registra su geometría y coloca el mesh en la escena.
    function box(w, h, d, x, y, z, material) {
      const geometry = new THREE.BoxGeometry(w, h, d);
      geometries.push(geometry);
      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.set(x, y, z);
      scene.add(mesh);
      return mesh;
    }
    // Agrega cuerpo, zócalo y colisión AABB ampliada 0.28 unidades por el radio del explorador.
    function wall(x, z, w, d) {
      box(w, height, d, x, height / 2, z, wallMat);
      box(w + 0.04, 0.13, d + 0.04, x, 0.065, z, trimMat);
      collisions.push({
        minX: x - w / 2 - 0.28,
        maxX: x + w / 2 + 0.28,
        minZ: z - d / 2 - 0.28,
        maxZ: z + d / 2 + 0.28,
      });
    }
    // Suelo, techo y paredes exteriores delimitan un recinto finito de prueba.
    box(23, 0.2, 46, 0, -0.1, -9, floorMat);
    box(23, 0.15, 46, 0, height + 0.075, -9, ceilingMat);
    wall(-11.5, -9, 0.5, 46);
    wall(11.5, -9, 0.5, 46);
    wall(0, -32, 23, 0.5);
    wall(0, 14, 23, 0.5);
    // Las tuplas [x, z, ancho, profundidad] se comparten con el minimapa para mantener la misma planta.
    level.walls.forEach(([x, z, w, d]) => wall(x, z, w, d));
    // La luz hemisférica rellena sombras; la direccional agrega iluminación ambiental.
    scene.add(
      new THREE.HemisphereLight(
        level.id === 0 ? "#fff1ba" : "#b3c6c0",
        "#302c20",
        level.id === 0 ? 1.4 : 0.8,
      ),
    );
    const fill = new THREE.DirectionalLight("#fff0c9", 0.6);
    fill.position.set(1, 3, 6);
    scene.add(fill);
    // Cada fluorescente combina carcasa, panel emisivo visible y luz puntual que ilumina el entorno.
    for (let z = 8; z > -30; z -= 7) {
      for (const x of level.id === 2 ? [0] : [-7.5, 0, 7.5]) {
        box(1.8, 0.09, 0.7, x, height - 0.07, z, fixtureMat);
        box(1.65, 0.025, 0.57, x, height - 0.13, z, lightMat);
        const light = new THREE.PointLight(
          level.id === 0 ? "#fff0b9" : level.id === 1 ? "#d5f1e6" : "#ffc08c",
          24,
          13,
          1.6,
        );
        light.position.set(x, height - 0.25, z);
        scene.add(light);
        fluorescentLights.push(light);
      }
    }
    if (level.id === 1) {
      // Las cajas con colisiones distinguen el almacén de los otros niveles.
      const crateMat = makeMaterial({ color: "#5d5943", roughness: 1 });
      [
        [-9, -4],
        [8, -13],
        [-8, -24],
      ].forEach(([x, z]) => {
        box(2, 1.3, 1.6, x, 0.65, z, crateMat);
        collisions.push({
          minX: x - 1.28,
          maxX: x + 1.28,
          minZ: z - 1.08,
          maxZ: z + 1.08,
        });
        box(2.04, 0.08, 1.64, x, 1.25, z, trimMat);
      });
    }
    // Los cilindros se giran 90 grados para orientar las tuberías a lo largo del pasillo.
    if (level.id === 2) {
      for (const x of [-4.3, 4.3]) {
        for (const y of [1, 1.8, 2.6]) {
          const geometry = new THREE.CylinderGeometry(0.12, 0.12, 43, 12);
          geometries.push(geometry);
          const pipe = new THREE.Mesh(geometry, pipeMat);
          pipe.rotation.x = Math.PI / 2;
          pipe.position.set(x, y, -9);
          scene.add(pipe);
          for (let z = 10; z > -30; z -= 4)
            box(0.35, 0.4, 0.12, x, y, z, fixtureMat);
        }
      }
    }

    // Un Set guarda las teclas presionadas: el movimiento se calcula continuamente en animate.
    const keys = inputRef.current;
    let dragging = false,
      pointerId = null,
      lastX = 0,
      lastY = 0;
    const keyCodes = [
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
        event.target.closest("dialog, input, textarea") ||
        !keyCodes.includes(event.code)
      )
        return;
      event.preventDefault();
      keys.add(event.code);
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
      if (settingsRef.current.exploring) {
        const forward =
          Number(keys.has("KeyW") || keys.has("ArrowUp")) -
          Number(keys.has("KeyS") || keys.has("ArrowDown"));
        const right =
          Number(keys.has("KeyD") || keys.has("ArrowRight")) -
          Number(keys.has("KeyA") || keys.has("ArrowLeft"));
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
      // Sin oscilaciones si se solicita movimiento reducido o se desactivan los efectos VHS.
      const motion = settingsRef.current.effects && !reducedMotion.matches;
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
      geometries.forEach((g) => g.dispose());
      materials.forEach((m) => m.dispose());
      textures.forEach((t) => t.dispose());
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
