import * as THREE from "three";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

export function configureRenderer(renderer) {
  const compact = window.matchMedia("(max-width: 760px)").matches;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, compact ? 1.35 : 1.75));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  // La arquitectura es estática. Se recalcula al abrir la puerta, no en cada frame.
  renderer.shadowMap.autoUpdate = false;
  renderer.shadowMap.needsUpdate = true;
}

export function addEnvironment(renderer, scene, intensity = 0.25) {
  const environment = new RoomEnvironment();
  const generator = new THREE.PMREMGenerator(renderer);
  const target = generator.fromScene(environment, 0.04);
  scene.environment = target.texture;
  scene.environmentIntensity = intensity;
  environment.dispose();
  generator.dispose();
  return target;
}

// Texturas locales deterministas: color y relieve independientes, sin descargas.
export function createSurface(resources, kind, repeat = [1, 1], anisotropy = 4) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 512;
  const ctx = canvas.getContext("2d");
  const palette = { grass: [104, 115, 83], plaster: [193, 187, 163], tile: [183, 202, 193], wood: [120, 95, 65], roof: [81, 89, 84], concrete: [135, 139, 128], brick: [137, 119, 93] };
  const base = palette[kind] || palette.concrete;
  let seed = 941 + kind.length * 73;
  const random = () => { seed = seed * 16807 % 2147483647; return (seed - 1) / 2147483646; };
  const pixels = ctx.createImageData(512, 512);
  for (let i = 0; i < pixels.data.length; i += 4) {
    const grain = (random() - 0.5) * (kind === "grass" ? 42 : 22);
    for (let c = 0; c < 3; c++) pixels.data[i + c] = base[c] + grain;
    pixels.data[i + 3] = 255;
  }
  ctx.putImageData(pixels, 0, 0);
  if (["tile", "roof", "brick"].includes(kind)) {
    const size = kind === "tile" ? 128 : 64;
    for (let y = 0; y < 512; y += size) for (let x = -size; x < 512; x += size) {
      const shift = kind !== "tile" && y / size % 2 ? size / 2 : 0;
      ctx.fillStyle = `rgba(255,255,240,${random() * 0.1})`;
      ctx.fillRect(x + shift + 3, y + 3, size - 5, size - 5);
      ctx.strokeStyle = kind === "tile" ? "#52675b" : "#323a32";
      ctx.lineWidth = kind === "tile" ? 3 : 2;
      ctx.strokeRect(x + shift, y, size, size);
      ctx.strokeStyle = "#edf2dd38";
      ctx.lineWidth = 1;
      ctx.strokeRect(x + shift + 3, y + 3, size - 6, size - 6);
    }
  }
  if (kind === "wood") for (let i = 0; i < 450; i++) {
    const y = random() * 512;
    ctx.strokeStyle = `rgba(39,24,9,${random() * 0.24})`;
    ctx.beginPath(); ctx.moveTo(0, y);
    ctx.bezierCurveTo(140, y + random() * 18, 300, y - random() * 18, 512, y);
    ctx.stroke();
  }
  if (kind === "grass") for (let i = 0; i < 8500; i++) {
    const x = random() * 512, y = random() * 512;
    ctx.strokeStyle = random() > 0.5 ? "#c1c09645" : "#253e2945";
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + random() * 4 - 2, y - 2 - random() * 6); ctx.stroke();
  }
  if (["concrete", "plaster"].includes(kind)) {
    for (let i = 0; i < 35; i++) {
      const x = random() * 512, y = random() * 512;
      const gradient = ctx.createRadialGradient(x, y, 0, x, y, 15 + random() * 90);
      gradient.addColorStop(0, "#25301b14"); gradient.addColorStop(1, "#25301b00");
      ctx.fillStyle = gradient; ctx.fillRect(0, 0, 512, 512);
    }
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping;
  map.repeat.set(...repeat); map.anisotropy = anisotropy;
  const bumpMap = map.clone(); bumpMap.colorSpace = THREE.NoColorSpace;
  resources.push(map, bumpMap);
  return { map, bumpMap, bumpScale: kind === "tile" ? 0.025 : 0.07 };
}

export function labelTexture(resources, title, subtitle = "BR-A / REGISTRO LOCAL") {
  const canvas = document.createElement("canvas"); canvas.width = 512; canvas.height = 160;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#17271f"; ctx.fillRect(0, 0, 512, 160);
  ctx.strokeStyle = "#7b9a80"; ctx.strokeRect(5, 5, 502, 150);
  ctx.fillStyle = "#d2e7cc"; ctx.font = "bold 35px monospace"; ctx.fillText(title, 24, 70);
  ctx.fillStyle = "#95b69c"; ctx.font = "18px monospace"; ctx.fillText(subtitle, 24, 115);
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  resources.push(map); return map;
}

export function glowTexture(resources) {
  const canvas = document.createElement("canvas"); canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  gradient.addColorStop(0, "#ffffffd0"); gradient.addColorStop(0.2, "#ffffff50"); gradient.addColorStop(1, "#ffffff00");
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, 64, 64);
  const map = new THREE.CanvasTexture(canvas); resources.push(map); return map;
}
