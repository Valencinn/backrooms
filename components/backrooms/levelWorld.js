import * as THREE from "three";
import { Reflector } from "three/addons/objects/Reflector.js";
import { createSurface, labelTexture, glowTexture } from "./graphics";

import { createJourney, ENTRY_DOOR } from "./journey.mjs";

export function createLevelWorld(scene, level, renderer) {
  const resources = [], collisions = [], fluorescentLights = [], windows = [], indicators = [], windowLights = [];
  const journey = createJourney(level);
  const compact = window.matchMedia("(max-width: 760px)").matches;
  const anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
  const surfaceMap = (kind, repeat) => createSurface(resources, kind, repeat, anisotropy);
  let elapsed = 0;
  let reflection, sky, dust;
  const mat = (options) => { const material = new THREE.MeshStandardMaterial(options); resources.push(material); return material; };
  const surface = mat({ ...surfaceMap(level.theme === "hills" ? "grass" : "tile", level.theme === "hills" ? [28, 36] : [9, 16]), color: level.theme === "hills" ? "#d1d6aa" : "#cdd7cb", roughness: level.theme === "hills" ? 1 : 0.34 });
  const structure = mat({ ...surfaceMap(level.theme === "pool" ? "tile" : "plaster", [2, 1]), color: level.theme === "hills" ? "#e4dbc5" : "#9bbcaf", roughness: level.theme === "pool" ? 0.3 : 0.88 });
  const trim = mat({ color: "#d7d4ba", roughness: 0.65 });
  const steel = mat({ color: "#4c625c", metalness: 0.8, roughness: 0.32 });
  const wood = mat({ ...surfaceMap("wood", [2, 1]), color: "#b7ab88", roughness: 0.8 });
  const glowMap = glowTexture(resources);
  const dark = mat({ color: "#293c36", roughness: 0.8 });
  const warm = mat({ color: level.color, emissive: level.color, emissiveIntensity: 0.6 });
  const unitBox = new THREE.BoxGeometry(1, 1, 1); resources.push(unitBox);
  const box = (w, h, d, x, y, z, material, solid = false) => {
    const mesh = new THREE.Mesh(unitBox, material); mesh.scale.set(w, h, d); mesh.position.set(x, y, z);
    mesh.receiveShadow = true; mesh.castShadow = !material.transparent && h > 0.1 && w < 35;
    scene.add(mesh);
    if (solid) collisions.push({ minX: x - w / 2 - 0.28, maxX: x + w / 2 + 0.28, minZ: z - d / 2 - 0.28, maxZ: z + d / 2 + 0.28 });
    return mesh;
  };
  const sphere = (x, y, z, sx, sy, sz) => {
    const geometry = new THREE.SphereGeometry(1, 28, 16); resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, surface); mesh.position.set(x, y, z); mesh.scale.set(sx, sy, sz); mesh.receiveShadow = true; scene.add(mesh);
  };
  const fog = new THREE.Color(level.theme === "hills" ? "#91a398" : level.theme === "pool" ? "#647e76" : "#757782");
  const dawn = new THREE.Color("#c7b08b");
  scene.background = fog.clone(); scene.fog = new THREE.FogExp2(fog, level.theme === "hills" ? 0.012 : 0.023);
  const ambient = new THREE.HemisphereLight(level.theme === "hills" ? "#d8d3bc" : "#d5e1de", "#252d21", level.theme === "pool" ? 0.6 : 0.85); scene.add(ambient);
  const sun = new THREE.DirectionalLight("#ffe1af", level.theme === "pool" ? 0.35 : 2.6);
  sun.position.set(-30, 25, -45); sun.target.position.set(0, 0, -9); scene.add(sun, sun.target);
  const shadowSize = compact ? 1024 : 2048;
  sun.castShadow = level.theme !== "pool";
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  Object.assign(sun.shadow.camera, { left: -29, right: 29, top: 32, bottom: -32, near: 1, far: 110 });
  sun.shadow.normalBias = 0.035; sun.shadow.bias = -0.00015;
  sun.shadow.camera.updateProjectionMatrix();

  function cylinder(radius, length, x, y, z, material) {
    const geometry = new THREE.CylinderGeometry(radius, radius, length, 10); resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
    mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh;
  }
  function plaque(title, subtitle, x, y, z, width = 1.5) {
    const material = new THREE.MeshStandardMaterial({ map: labelTexture(resources, title, subtitle), roughness: 0.65 });
    resources.push(material); return box(width, width * 0.3125, 0.025, x, y, z, material);
  }
  if (level.theme !== "pool") {
    const geometry = new THREE.SphereGeometry(175, 32, 16); resources.push(geometry);
    const material = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false,
      uniforms: { top: { value: new THREE.Color("#456675") }, horizon: { value: fog.clone() } },
      vertexShader: "varying vec3 vDirection; void main(){vDirection=position;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: `uniform vec3 top; uniform vec3 horizon; varying vec3 vDirection;
        float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
        float noise(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);}
        void main(){vec3 d=normalize(vDirection);float h=max(d.y,0.0);vec3 c=mix(horizon,top,smoothstep(0.0,0.7,h));
        vec2 p=d.xz/max(0.15,h)*2.0;float n=noise(p)*0.6+noise(p*2.1)*0.3+noise(p*4.3)*0.1;
        c=mix(c,vec3(0.73,0.76,0.69),smoothstep(0.53,0.8,n)*smoothstep(0.0,0.15,h)*0.35);
        gl_FragColor=vec4(c,1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
        }`
    });
    resources.push(material); sky = new THREE.Mesh(geometry, material); scene.add(sky);
  }
  box(140, 0.2, 180, 0, -0.1, -25, surface);
  // Límites invisibles de la zona caminable, las lomas y el horizonte continúan más allá.
  collisions.push({ minX: -100, maxX: -10.8, minZ: -100, maxZ: 100 }, { minX: 10.8, maxX: 100, minZ: -100, maxZ: 100 }, { minX: -100, maxX: 100, minZ: -100, maxZ: -31 }, { minX: -100, maxX: 100, minZ: 13, maxZ: 100 });
  let water;
  if (level.theme === "hills") {
    for (let i = 0; i < 20; i++) {
      const side = i % 2 ? -1 : 1;
      sphere(side * (22 + (i % 4) * 7), -2, 20 - i * 6, 17 + i % 3 * 3, 7 + i % 4, 16);
    }
    const path = mat({ ...surfaceMap("concrete", [1, 16]), color: "#b8af90", roughness: 0.95 });
    box(2.2, 0.015, 45, 0, 0.012, -9, path);
    const roofMat = mat({ ...surfaceMap("roof", [2, 2]), color: "#82948c", roughness: 0.9 });
    level.walls.forEach(([x, z, w, d]) => {
      box(w, 2.8, d, x, 1.4, z, structure, true);
      const profile = new THREE.Shape();
      profile.moveTo(-w / 2 - 0.4, 0); profile.lineTo(0, 1.5); profile.lineTo(w / 2 + 0.4, 0); profile.closePath();
      const geometry = new THREE.ExtrudeGeometry(profile, { depth: d + 0.8, bevelEnabled: false });
      resources.push(geometry);
      const roof = new THREE.Mesh(geometry, roofMat); roof.position.set(x, 2.8, z - d / 2 - 0.4);
      roof.castShadow = roof.receiveShadow = true; scene.add(roof);
      box(w + 0.8, 0.14, d + 0.9, x, 2.8, z, trim);
      box(0.55, 1.6, 0.6, x + 1, 3.5, z - 1, structure);
      box(0.8, 1.9, 0.04, x, 0.95, z + d / 2 + 0.03, dark);
      const windowMat = mat({ color: "#546663", emissive: "#ffc777", emissiveIntensity: 0 });
      windows.push(windowMat);
      for (const dx of [-1.2, 1.2]) box(0.65, 0.85, 0.05, x + dx, 1.7, z + d / 2 + 0.04, windowMat);
      box(w + 0.7, 0.15, 1.1, x, 0.1, z + d / 2 + 0.4, wood);
      for (const dx of [-1.75, 1.75]) box(0.08, 2.5, 0.08, x + dx, 1.4, z + d / 2 + 0.6, trim);
      box(w + 0.5, 0.1, 1.3, x, 2.65, z + d / 2 + 0.45, roofMat);
      for (const dx of [-1.2, 1.2]) {
        const wz = z + d / 2 + 0.075;
        for (const side of [-1, 1]) {
          box(0.06, 0.96, 0.07, x + dx + side * 0.36, 1.7, wz, trim);
          box(0.78, 0.06, 0.07, x + dx, 1.7 + side * 0.46, wz, trim);
        }
        box(0.045, 0.9, 0.08, x + dx, 1.7, wz + 0.02, trim);
        box(0.7, 0.045, 0.08, x + dx, 1.7, wz + 0.02, trim);
      }
      const spill = new THREE.PointLight("#ffce89", 0, 6, 2);
      spill.position.set(x, 1.5, z + d / 2 + 0.6); scene.add(spill);
      windowLights.push(spill);
    });
    // Casas distantes fuera de la zona caminable, siluetas entre la niebla.
    for (let i = 0; i < 8; i++) {
      const x = (i % 2 ? -1 : 1) * (23 + i % 3 * 6), z = 2 - i * 9;
      box(3.5, 2.8, 4, x, 3.2, z, structure);
      box(4.2, 0.3, 4.6, x, 4.7, z, roofMat);
    }

    // Pasto agrupado en una sola llamada de dibujo, fuera de casas y sendero.
    const blade = new THREE.BufferGeometry();
    blade.setAttribute("position", new THREE.Float32BufferAttribute([-0.035, 0, 0, 0.035, 0, 0, 0.015, 0.3, 0], 3));
    blade.computeVertexNormals(); resources.push(blade);
    const grassMaterial = mat({ color: "#687b4a", roughness: 1, side: THREE.DoubleSide });
    const count = compact ? 1800 : 3600;
    const grass = new THREE.InstancedMesh(blade, grassMaterial, count); grass.receiveShadow = true;
    const transform = new THREE.Object3D();
    let seed = 237; const random = () => { seed = seed * 16807 % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < count; i++) {
      let x = (random() - 0.5) * 30, z = 14 - random() * 48;
      if (Math.abs(x) < 1.6 || level.walls.some(([cx, cz, w, d]) => Math.abs(x-cx) < w/2+0.5 && Math.abs(z-cz) < d/2+1)) x += x > 0 ? 12 : -12;
      transform.position.set(x, 0.015, z); transform.rotation.y = random() * Math.PI;
      transform.scale.setScalar(0.5 + random()); transform.updateMatrix(); grass.setMatrixAt(i, transform.matrix);
    }
    scene.add(grass);
  } else if (level.theme === "pool") {
    box(23, 0.15, 46, 0, 4.2, -9, structure);
    box(0.3, 4.2, 46, -11, 2.1, -9, structure); box(0.3, 4.2, 46, 11, 2.1, -9, structure);
    // Pileta lateral: el borde seco siempre permite llegar a las tres válvulas.
    box(6, 0.12, 35, 7, 0.03, -9, dark);
    for (const x of [3.8, 10.2]) box(0.25, 0.4, 35, x, 0.2, -9, structure, true);
    const waterMat = mat({ color: "#397d72", transparent: true, opacity: 0.65, metalness: 0.25, roughness: 0.12 });
    water = box(6.1, 0.04, 34.8, 7, 0.52, -9, waterMat);
    water.castShadow = false;
    const plane = new THREE.PlaneGeometry(6.05, 34.7); resources.push(plane);
    const shader = { ...Reflector.ReflectorShader, uniforms: { ...THREE.UniformsUtils.clone(Reflector.ReflectorShader.uniforms), rippleTime: { value: 0 } },
      fragmentShader: Reflector.ReflectorShader.fragmentShader
        .replace("uniform vec3 color;", "uniform vec3 color; uniform float rippleTime;")
        .replace("vec4 base = texture2DProj( tDiffuse, vUv );", "vec4 uv = vUv; uv.xy += sin(uv.yx * 48.0 + vec2(rippleTime * 0.6, -rippleTime * 0.4)) * 0.0009 * uv.w; vec4 base = texture2DProj(tDiffuse, uv);")
    };
    reflection = new Reflector(plane, { color: "#63998b", textureWidth: compact ? 256 : 512, textureHeight: compact ? 256 : 512, multisample: 0, clipBias: 0.003, shader });
    reflection.rotation.x = -Math.PI / 2; reflection.position.set(7, 0.545, -9); scene.add(reflection);
    for (let i = 0; i < 12; i++) {
      box(0.04, 0.02, 35, -10 + i * 1.2, 0.02, -9, structure);
      box(21, 0.02, 0.04, 0, 0.025, 11 - i * 3.5, structure);
    }
    level.walls.forEach(([x, z, w, d]) => box(w, 4.1, d, x, 2.05, z, structure, true));
    box(22, 4.2, 0.3, 0, 2.1, -32, structure);
    box(22, 4.2, 0.3, 0, 2.1, 14, structure);
    const upperWall = mat({ ...surfaceMap("plaster", [5, 1]), color: "#ddd4b4", roughness: 0.9 });
    for (const x of [-10.78, 10.78]) {
      box(0.04, 2.2, 46, x, 3.05, -9, upperWall);
      box(0.08, 0.09, 46, x, 1.95, -9, dark);
    }
    const keyLight = new THREE.SpotLight("#b6ece0", 95, 42, 1.12, 0.7, 1.4);
    keyLight.position.set(-3, 4, -5); keyLight.target.position.set(0, 0, -12); keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(compact ? 512 : 1024, compact ? 512 : 1024);
    keyLight.shadow.normalBias = 0.025; scene.add(keyLight, keyLight.target);
    // Escaleras, bancos y señalización fuera del corredor de interacción.
    for (const z of [5, -23]) {
      for (const x of [4.4, 5.2]) {
        cylinder(0.045, 1.7, x, 0.7, z, steel);
        for (let i = 0; i < 5; i++) box(0.8, 0.04, 0.04, 4.8, 0.1 + i * 0.25, z, steel);
      }
    }
    for (const z of [6, -9, -24]) {
      box(2.8, 0.16, 0.8, -8, 0.55, z, wood);
      for (const dx of [-1, 1]) box(0.07, 0.55, 0.6, -8 + dx, 0.275, z, steel);
    }
    plaque("ÚLTIMO TURNO", "SALIDA POR LA ENTRADA", 0, 2.7, -31.8, 3.2);
    // Fragmentos que emergen al bajar el agua.
    for (let i = 0; i < 3; i++) box(3.7, 0.12, 1.3, 7, 0.13 + i * 0.06, -2 - i * 9, warm);
  } else {
    const glass = mat({ color: "#a3bcb3", transparent: true, opacity: 0.12, roughness: 0.2, metalness: 0.2, depthWrite: false, side: THREE.DoubleSide });
    box(22, 0.1, 46, 0, 6, -9, glass);
    for (let z = 12; z >= -30; z -= 6) {
      box(22, 0.12, 0.12, 0, 5.7, z, dark);
      for (const x of [-10.5, 10.5]) {
        box(0.12, 5.8, 0.12, x, 2.9, z, steel);
        if (z > -30) box(0.045, 5.4, 5.7, x, 2.9, z - 3, glass);
      }
    }
    box(0.1, 0.1, 46, -5.2, 5.75, -9, steel);
    box(0.1, 0.1, 46, 5.2, 5.75, -9, steel);
    level.walls.forEach(([x, z, w, d]) => {
      box(w, 0.18, d, x, 0.6, z, dark, true);
      for (let i = 0; i < 5; i++) box(w, 0.07, 0.14, x, 0.74, z - 0.4 + i * 0.18, wood);
      for (let i = 0; i < 4; i++) box(w, 0.12, 0.07, x, 0.95 + i * 0.17, z - 0.44, wood);
      for (const dx of [-1, 1]) box(0.08, 0.6, 0.65, x + dx, 0.3, z, steel);
    });
    for (let i = 0; i < 30; i++) {
      const x = (i % 2 ? -1 : 1) * (5 + i % 5), z = 10 - Math.floor(i / 2) * 2.8;
      box(0.65, 0.42, 0.65, x, 0.21, z, structure);
      box(0.58, 0.04, 0.58, x, 0.44, z, dark);
      cylinder(0.027, 2.6 + i % 3 * 0.5, x, 1.65, z, steel);
      for (let j = 0; j < 3; j++) box(0.9 - j * 0.2, 0.025, 0.025, x, 2.2 + j * 0.23, z, steel);
      box(0.06, 0.12, 0.06, x, 2.95, z, warm);
    }
    const leafShape = new THREE.Shape();
    leafShape.moveTo(0, 0); leafShape.quadraticCurveTo(-0.22, 0.4, 0, 0.95);
    leafShape.quadraticCurveTo(0.22, 0.4, 0, 0);
    const leafGeometry = new THREE.ShapeGeometry(leafShape, 5); resources.push(leafGeometry);
    const leafMaterial = mat({ color: "#536c42", roughness: 0.86, side: THREE.DoubleSide });
    const plants = new THREE.InstancedMesh(leafGeometry, leafMaterial, 96);
    const transform = new THREE.Object3D();
    for (let i = 0; i < 12; i++) {
      const x = i % 2 ? -9.2 : 9.2, z = 7 - Math.floor(i / 2) * 7;
      box(0.85, 0.55, 0.85, x, 0.275, z, structure, true);
      box(0.74, 0.04, 0.74, x, 0.56, z, dark);
      for (let j = 0; j < 8; j++) {
        transform.position.set(x, 0.58, z); transform.rotation.set(-0.7 + j * 0.08, j * Math.PI / 4, 0.25);
        transform.scale.setScalar(0.75 + j % 3 * 0.2); transform.updateMatrix(); plants.setMatrixAt(i * 8 + j, transform.matrix);
      }
    }
    plants.receiveShadow = true; scene.add(plants);
  }
  if (level.theme !== "hills") for (let z = 8; z > -30; z -= 8) {
    const fixtureY = level.theme === "pool" ? 4 : 5.6;
    box(2.9, 0.13, 0.45, 0, fixtureY + 0.07, z, steel);
    box(2.7, 0.05, 0.3, 0, fixtureY, z, warm);
    const light = new THREE.PointLight(level.color, 24, 14, 1.6); light.position.set(0, 3.5, z); scene.add(light); fluorescentLights.push(light);
  }
  level.stations.forEach((station, i) => {
    box(0.08, 1.1, 0.08, station.x, 0.55, station.z, dark);
    const material = mat({ color: level.color, emissive: level.color, emissiveIntensity: 0.8 }); indicators.push(material);
    if (level.theme === "pool") {
      const geometry = new THREE.TorusGeometry(0.3, 0.045, 10, 32); resources.push(geometry);
      const wheel = new THREE.Mesh(geometry, material); wheel.position.set(station.x, 1.25, station.z); scene.add(wheel);
      box(0.5, 0.045, 0.045, station.x, 1.25, station.z, material);
    } else {
      box(0.65, 0.36, 0.42, station.x, 1.2, station.z, material);
      if (level.theme === "garden") box(0.035, 1.2, 0.035, station.x, 1.8, station.z, structure);
    }
    plaque(String(i + 1).padStart(2, "0"), level.theme === "pool" ? "DRENAJE" : level.theme === "garden" ? "RECEPTOR" : "BUZÓN", station.x, 0.86, station.z + 0.23, 0.53);
    // Marca en el suelo junto a cada objeto interactivo.
    box(0.8, 0.015, 0.8, station.x, 0.015, station.z, i % 2 ? structure : dark);
  });
  // La puerta de regreso siempre está detrás del punto de aparición.
  const doorFrame = mat({ color: "#34463c", emissive: "#79f89a", emissiveIntensity: 0.05 });
  const doorMat = mat({ color: "#1a2922", roughness: 0.8 });
  const doorZ = ENTRY_DOOR.z;
  plaque("TERMINAL", "VOLVER POR LA MISMA PUERTA", 0, 3.85, doorZ - 0.06, 2.6);
  box(0.25, 3.5, 0.3, -1.4, 1.75, doorZ, doorFrame);
  box(0.25, 3.5, 0.3, 1.4, 1.75, doorZ, doorFrame);
  box(3.05, 0.25, 0.3, 0, 3.5, doorZ, doorFrame);
  const door = box(2.55, 3.3, 0.12, 0, 1.65, doorZ, doorMat);
  const doorHandle = box(0.1, 0.1, 0.08, 0.95, 1.5, doorZ - 0.12, warm);
  // Cerrada: impide atravesarla. Abierta: permite regresar por el mismo umbral.
  const doorCollision = { minX: -1.55, maxX: 1.55, minZ: doorZ - 0.35, maxZ: doorZ + 0.35 };
  collisions.push(doorCollision);
  let doorOpen = false;
  if (level.theme === "garden") {
    const geometry = new THREE.BufferGeometry(), positions = [];
    for (let i = 0; i < 180; i++) positions.push(Math.sin(i * 78.3) * 10, 0.5 + (i * 0.137 % 4.5), 12 - (i * 1.73 % 44));
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3)); resources.push(geometry);
    const material = new THREE.PointsMaterial({ color: "#e2e7c9", map: glowMap, size: 0.055, transparent: true, opacity: 0.45, depthWrite: false });
    resources.push(material); dust = new THREE.Points(geometry, material); scene.add(dust);
  }
  return {
    collisions, fluorescentLights, journey,
    update(dt, camera, moving, motion = true) {
      if (motion) elapsed += dt;
      if (dust) dust.position.y = Math.sin(elapsed * 0.23) * 0.06;
      journey.update(camera.position.x, camera.position.z, moving, dt);
      const progress = journey.activated.size;
      indicators.forEach((material, i) => { material.emissiveIntensity = journey.activated.has(i) ? 0.05 : 0.8; });
      windows.forEach((material, i) => { material.emissiveIntensity = journey.activated.has(i) ? 2 : 0; });
      windowLights.forEach((light, i) => { light.intensity = journey.activated.has(i) ? 6 : 0; });
      if (level.theme === "hills") {
        scene.background.copy(fog).lerp(dawn, progress / 3);
        scene.fog.color.copy(scene.background); sun.intensity = 2.6 + progress * 0.35;
        if (sky) sky.material.uniforms.horizon.value.copy(scene.fog.color);
      }
      if (water) water.position.y = THREE.MathUtils.damp(water.position.y, 0.52 - progress * 0.17, 2, dt);
      if (reflection) {
        reflection.position.y = water.position.y + 0.025;
        reflection.material.uniforms.rippleTime.value = elapsed;
        reflection.visible = water.position.y > 0.06;
      }
      const complete = progress === level.stations.length;
      doorFrame.emissiveIntensity = complete ? 2 : 0.05;
      if (complete && !doorOpen) {
        doorOpen = true;
        renderer.shadowMap.needsUpdate = true;
        door.visible = false;
        doorHandle.visible = false;
        collisions.splice(collisions.indexOf(doorCollision), 1);
      }
    },
    dispose() {
      reflection?.dispose();
      resources.forEach((resource) => resource.dispose());
      scene.traverse((object) => { if (object.isLight || object.isInstancedMesh) object.dispose(); });
    },
  };
}
