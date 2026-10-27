"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import BootScreen from "./BootScreen";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { configureRenderer, addEnvironment, createSurface } from "./graphics";

export default function ComputerRoom({ onEnter }) {
  const mountRef = useRef(null);
  const keys = useRef(new Set());
  const enterRef = useRef(onEnter);
  const interactRef = useRef(() => {});
  const [status, setStatus] = useState("loading");
  const [near, setNear] = useState(false);
  useEffect(() => { enterRef.current = onEnter; }, [onEnter]);

  useEffect(() => {
    const mount = mountRef.current;
    const input = keys.current;
    let controlsReady = false, loadingTimer;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true });
    } catch {
      queueMicrotask(() => setStatus("error"));
      return;
    }
    configureRenderer(renderer);
    renderer.toneMappingExposure = 1.15;
    mount.appendChild(renderer.domElement);
    const canvas = renderer.domElement;
    canvas.tabIndex = 0;
    canvas.setAttribute("aria-label", "Habitación oscura. Caminá hacia la computadora iluminada e interactuá con E.");
    const scene = new THREE.Scene();
    const environment = addEnvironment(renderer, scene, 0.025);
    scene.background = new THREE.Color("#020303");
    scene.fog = new THREE.FogExp2("#020303", 0.12);
    const camera = new THREE.PerspectiveCamera(62, 1, 0.05, 30);
    camera.position.set(0, 1.65, 3.5);
    camera.rotation.order = "YXZ";
    let yaw = 0, pitch = -0.1, frame, last = performance.now(), entered = false;
    let dragging = false, lastX = 0, lastY = 0, previousNear = false;
    const resources = [];
    const mat = (options) => {
      const material = new THREE.MeshStandardMaterial(options);
      resources.push(material);
      return material;
    };
    const concrete = mat({ ...createSurface(resources, "concrete", [5, 4]), color: "#363b36", roughness: 1 });
    const wood = mat({ ...createSurface(resources, "wood", [2, 1]), color: "#9b8461", roughness: 0.7 });
    const metal = mat({ color: "#171a19", metalness: 0.5, roughness: 0.6 });
    const plastic = mat({ color: "#aaa58c", roughness: 0.8 });
    const dark = mat({ color: "#090d0c", roughness: 0.7 });
    const boxGeometry = new THREE.BoxGeometry(1, 1, 1);
    const roundedGeometry = new RoundedBoxGeometry(1, 1, 1, 2, 0.045);
    resources.push(boxGeometry, roundedGeometry);
    function box(w, h, d, x, y, z, material) {
      const geometry = w < 3 && h > 0.05 && d < 2 ? roundedGeometry : boxGeometry;
      const mesh = new THREE.Mesh(geometry, material);
      mesh.scale.set(w, h, d);
      mesh.position.set(x, y, z);
      mesh.receiveShadow = true; mesh.castShadow = h > 0.05;
      scene.add(mesh);
      return mesh;
    }
    box(8, 0.2, 10, 0, -0.1, 0, concrete);
    box(8, 3.6, 0.2, 0, 1.8, -4, concrete);
    box(0.2, 3.6, 10, -4, 1.8, 0, concrete);
    box(0.2, 3.6, 10, 4, 1.8, 0, concrete);
    box(8, 3.6, 0.2, 0, 1.8, 5, concrete);
    box(8, 0.15, 10, 0, 3.6, 0, concrete);
    // Escritorio central y computadora CRT modelados con geometría local.
    box(2.5, 0.12, 1.25, 0, 0.83, -1, wood);
    for (const x of [-1.08, 1.08]) for (const z of [-1.5, -0.5])
      box(0.07, 0.8, 0.07, x, 0.4, z, metal);
    box(0.5, 0.1, 0.4, 0, 0.94, -1.2, plastic);
    box(0.16, 0.15, 0.16, 0, 1.02, -1.2, plastic);
    box(0.94, 0.76, 0.65, 0, 1.43, -1.25, plastic);
    box(0.8, 0.59, 0.02, 0, 1.45, -0.916, dark);
    const screenCanvas = document.createElement("canvas");
    screenCanvas.width = 512; screenCanvas.height = 384;
    const ctx = screenCanvas.getContext("2d");
    ctx.fillStyle = "#071a13"; ctx.fillRect(0, 0, 512, 384);
    ctx.fillStyle = "#79f89a"; ctx.font = "18px monospace";
    ctx.fillText("operador@liminal:~$", 35, 62);
    ctx.fillRect(35, 83, 440, 1);
    ctx.font = "bold 33px monospace";
    ctx.fillText("THE BACKROOMS", 35, 157);
    ctx.font = "17px monospace";
    ctx.fillText("./frecuencias --explorar", 35, 205);
    ctx.fillText("[ OK ] ESPERANDO OPERADOR_", 35, 289);
    for (let y = 0; y < 384; y += 4) { ctx.fillStyle = "#00000030"; ctx.fillRect(0, y, 512, 1); }
    const texture = new THREE.CanvasTexture(screenCanvas);
    texture.colorSpace = THREE.SRGBColorSpace; resources.push(texture);
    const screenMaterial = new THREE.MeshBasicMaterial({ map: texture, toneMapped: false }); resources.push(screenMaterial);
    const screenGeometry = new THREE.PlaneGeometry(0.72, 0.51, 16, 12); resources.push(screenGeometry);
    const vertices = screenGeometry.attributes.position;
    for (let i = 0; i < vertices.count; i++) vertices.setZ(i, 0.025 * (1 - (vertices.getX(i) / 0.36) ** 2) * (1 - (vertices.getY(i) / 0.255) ** 2));
    screenGeometry.computeVertexNormals();
    const screen = new THREE.Mesh(screenGeometry, screenMaterial); screen.position.set(0, 1.45, -0.89); scene.add(screen);
    box(0.9, 0.06, 0.29, -0.08, 0.94, -0.56, plastic);
    for (let row = 0; row < 4; row++) for (let col = 0; col < 13; col++)
      box(0.049, 0.015, 0.041, -0.47 + col * 0.062, 0.98, -0.65 + row * 0.06, dark);
    box(0.12, 0.05, 0.19, 0.7, 0.94, -0.55, plastic);
    const power = mat({ color: "#75d78e", emissive: "#75d78e", emissiveIntensity: 1 });
    box(0.035, 0.018, 0.015, 0.32, 1.13, -0.91, power);
    for (let i = 0; i < 7; i++) box(0.018, 0.06, 0.015, -0.33 + i * 0.035, 1.13, -0.91, dark);
    const cableCurve = new THREE.CatmullRomCurve3([new THREE.Vector3(0.7, 0.92, -0.65), new THREE.Vector3(0.9, 0.92, -0.95), new THREE.Vector3(0.65, 0.92, -1.5), new THREE.Vector3(0.2, 0.92, -1.55)]);
    const cableGeometry = new THREE.TubeGeometry(cableCurve, 32, 0.012, 6, false); resources.push(cableGeometry);
    scene.add(new THREE.Mesh(cableGeometry, dark));
    // Lámpara de escritorio: la luz queda concentrada sobre la mesa.
    box(0.28, 0.06, 0.28, -0.9, 0.94, -1.2, metal);
    box(0.035, 0.8, 0.035, -0.9, 1.33, -1.2, metal);
    box(0.4, 0.11, 0.3, -0.78, 1.73, -1.15, metal);
    const bulb = mat({ color: "#ffe7b2", emissive: "#ffe0a0", emissiveIntensity: 2 });
    box(0.32, 0.02, 0.23, -0.78, 1.66, -1.15, bulb);
    const lamp = new THREE.SpotLight("#ffe0ab", 32, 7, 0.8, 0.65, 2);
    lamp.position.set(-0.75, 2.4, -0.7); lamp.target.position.set(0, 0.6, -1);
    lamp.castShadow = true; lamp.shadow.mapSize.set(1024, 1024);
    lamp.shadow.normalBias = 0.015; lamp.shadow.bias = -0.0002;
    scene.add(lamp, lamp.target);
    const glow = new THREE.PointLight("#9fd7b2", 1.2, 2.5);
    glow.position.set(0, 1.5, -0.5); scene.add(glow);
    scene.add(new THREE.AmbientLight("#afc2bd", 0.035));

    const canInteract = () => Math.hypot(camera.position.x, camera.position.z + 0.65) < 2.4;
    interactRef.current = () => {
      if (!controlsReady || entered || !canInteract() || document.hidden) return;
      entered = true; keys.current.clear(); enterRef.current();
    };
    const codes = ["KeyW", "KeyA", "KeyS", "KeyD", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"];
    const keydown = (event) => {
      if (!controlsReady) return;
      if (event.target.closest("input, textarea, dialog")) return;
      if (event.code === "KeyE" && !event.repeat) interactRef.current();
      if (codes.includes(event.code)) { event.preventDefault(); keys.current.add(event.code); }
    };
    const keyup = (event) => keys.current.delete(event.code);
    const clear = () => { keys.current.clear(); dragging = false; };
    const down = (event) => {
      if (!controlsReady) return;
      dragging = true; lastX = event.clientX; lastY = event.clientY;
      canvas.setPointerCapture(event.pointerId); canvas.focus({ preventScroll: true });
    };
    const move = (event) => {
      if (!dragging) return;
      yaw -= (event.clientX - lastX) * 0.003;
      pitch = THREE.MathUtils.clamp(pitch - (event.clientY - lastY) * 0.003, -0.8, 0.8);
      lastX = event.clientX; lastY = event.clientY;
    };
    const up = (event) => { dragging = false; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); };
    const lost = (event) => { event.preventDefault(); controlsReady = false; clearTimeout(loadingTimer); clear(); setStatus("error"); };
    window.addEventListener("keydown", keydown); window.addEventListener("keyup", keyup);
    window.addEventListener("blur", clear); document.addEventListener("visibilitychange", clear);
    canvas.addEventListener("pointerdown", down); canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
    canvas.addEventListener("lostpointercapture", clear); canvas.addEventListener("webglcontextlost", lost);
    const resize = () => {
      renderer.setSize(mount.clientWidth, mount.clientHeight, false);
      camera.aspect = mount.clientWidth / Math.max(1, mount.clientHeight); camera.updateProjectionMatrix();
    };
    const observer = new ResizeObserver(resize); observer.observe(mount); resize();
    function animate(now) {
      frame = requestAnimationFrame(animate);
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (document.hidden || !controlsReady) return;
      const input = keys.current;
      const f = Number(input.has("KeyW") || input.has("ArrowUp")) - Number(input.has("KeyS") || input.has("ArrowDown"));
      const r = Number(input.has("KeyD") || input.has("ArrowRight")) - Number(input.has("KeyA") || input.has("ArrowLeft"));
      const length = Math.hypot(f, r) || 1;
      const x = THREE.MathUtils.clamp(camera.position.x + (-Math.sin(yaw) * f + Math.cos(yaw) * r) / length * dt * 2, -3.5, 3.5);
      const z = THREE.MathUtils.clamp(camera.position.z + (-Math.cos(yaw) * f - Math.sin(yaw) * r) / length * dt * 2, -3.5, 4.5);
      const free = (px, pz) => !(Math.abs(px) < 1.55 && pz > -1.95 && pz < -0.05);
      if (free(x, camera.position.z)) camera.position.x = x;
      if (free(camera.position.x, z)) camera.position.z = z;
      camera.rotation.set(pitch, yaw, 0);
      const currentNear = canInteract();
      if (currentNear !== previousNear) { previousNear = currentNear; setNear(currentNear); }
      renderer.render(scene, camera);
    }
    // El arranque se muestra siempre durante 3,6 s tras el primer frame real.
    // Hasta entonces ni teclado ni puntero pueden mover al operador o abrir la terminal.
    renderer.shadowMap.needsUpdate = true;
    renderer.render(scene, camera);
    canvas.tabIndex = -1;
    loadingTimer = setTimeout(() => {
      controlsReady = true;
      input.clear();
      setStatus("ready");
      canvas.tabIndex = 0;
      canvas.focus({ preventScroll: true });
    }, 3600);
    frame = requestAnimationFrame(animate);
    return () => {
      controlsReady = false; clearTimeout(loadingTimer);
      cancelAnimationFrame(frame); observer.disconnect(); input.clear(); interactRef.current = () => {};
      window.removeEventListener("keydown", keydown); window.removeEventListener("keyup", keyup);
      window.removeEventListener("blur", clear); document.removeEventListener("visibilitychange", clear);
      canvas.removeEventListener("pointerdown", down); canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerup", up); canvas.removeEventListener("pointercancel", up);
      canvas.removeEventListener("lostpointercapture", clear); canvas.removeEventListener("webglcontextlost", lost);
      resources.forEach((resource) => resource.dispose());
      environment.dispose();
      scene.traverse((object) => { if (object.isLight) object.dispose(); });
      scene.clear(); renderer.dispose(); renderer.forceContextLoss(); canvas.remove();
    };
  }, []);

  function hold(event, code, pressed) {
    event.preventDefault();
    if (pressed) { event.currentTarget.setPointerCapture(event.pointerId); keys.current.add(code); }
    else keys.current.delete(code);
  }
  return (
    <main className="br-entry">
      <div ref={mountRef} className="br-entry-scene" />
      {status === "loading" && <BootScreen />}
      {status === "error" && <div className="br-entry-loading" role="alert"><h1>Se perdió la imagen.</h1><p>La habitación necesita WebGL y aceleración gráfica.</p><button onClick={() => window.location.reload()}>VOLVER A INTENTAR</button></div>}
      {status === "ready" && <>
        <header className="br-entry-header"><span>ANTES DE ENTRAR</span><span>HABITACIÓN 01 / SIN SEÑAL</span></header>
        <span className="br-entry-crosshair" aria-hidden="true">+</span>
        <div className="br-entry-caption" aria-live="polite">
          <p>{near ? "La pantalla te estaba esperando." : "Hay una computadora encendida."}</p>
          {near ? <button onClick={() => interactRef.current()}><kbd>E</kbd> USAR COMPUTADORA <span>↗</span></button> : <span>Acercate al escritorio.</span>}
        </div>
        <nav className="br-entry-movement" aria-label="Desplazamiento en la habitación">
          {[["KeyW", "↑", "Avanzar"], ["KeyA", "←", "Izquierda"], ["KeyS", "↓", "Retroceder"], ["KeyD", "→", "Derecha"]].map(([code, icon, label]) => <button key={code} aria-label={label}
            onPointerDown={(e) => hold(e, code, true)} onPointerUp={(e) => hold(e, code, false)} onPointerCancel={(e) => hold(e, code, false)}
            onLostPointerCapture={() => keys.current.delete(code)} onBlur={() => keys.current.delete(code)}
            onKeyDown={(e) => { if ([" ", "Enter"].includes(e.key)) { e.preventDefault(); keys.current.add(code); } }} onKeyUp={() => keys.current.delete(code)}>{icon}</button>)}
        </nav>
        <footer className="br-entry-footer">WASD / FLECHAS · ARRASTRÁ PARA MIRAR · E PARA INTERACTUAR</footer>
      </>}
    </main>
  );
}
