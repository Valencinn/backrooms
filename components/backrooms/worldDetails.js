import * as THREE from "three";

// Arquitectura y utilería propias de cada frecuencia, sin assets remotos.
export function addWorldDetails({ scene, level, resources, box, mat, cylinder, plaque, steel, wood, dark, trim, glowMap, compact }) {
  const accents = [], movingParts = [];
  const amber = mat({ color: "#f3cf90", emissive: "#ffb55b", emissiveIntensity: 1.4 });
  const cyan = mat({ color: "#82d8d1", emissive: "#56bfb9", emissiveIntensity: 1.1 });
  const copper = mat({ color: "#987354", metalness: 0.72, roughness: 0.4 });
  const faded = mat({ color: "#848878", roughness: 0.95 });
  function tube(points, radius, material) {
    const curve = new THREE.CatmullRomCurve3(points.map((point) => new THREE.Vector3(...point)));
    const geometry = new THREE.TubeGeometry(curve, 24, radius, 6, false); resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.castShadow = true; scene.add(mesh); return mesh;
  }
  function ring(radius, x, y, z, material, horizontal = false) {
    const geometry = new THREE.TorusGeometry(radius, 0.025, 6, 40); resources.push(geometry);
    const mesh = new THREE.Mesh(geometry, material); mesh.position.set(x, y, z);
    if (horizontal) mesh.rotation.x = Math.PI / 2;
    scene.add(mesh); return mesh;
  }
  function halo(x, y, z, color, size = 1.5) {
    const material = new THREE.SpriteMaterial({ map: glowMap, color, transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending }); resources.push(material);
    const sprite = new THREE.Sprite(material); sprite.position.set(x, y, z); sprite.scale.set(size, size, 1); scene.add(sprite);
    return sprite;
  }
  function lamp(x, z) {
    cylinder(0.055, 3.6, x, 1.8, z, steel);
    box(0.4, 0.65, 0.4, x, 3.5, z, dark);
    box(0.31, 0.42, 0.31, x, 3.5, z, amber);
    box(0.55, 0.08, 0.55, x, 3.85, z, steel);
    halo(x, 3.5, z, "#ffcf7c", 2.4);
    const light = new THREE.PointLight("#ffcb81", 8, 8, 2); light.position.set(x, 3.3, z); scene.add(light);
    accents.push(light);
  }

  if (level.theme === "hills") {
    // Un sol inmóvil y capas de lomas forman una silueta reconocible.
    const sunGeometry = new THREE.SphereGeometry(7, 32, 16); resources.push(sunGeometry);
    const sunMaterial = new THREE.MeshBasicMaterial({ color: "#ffd6a2", fog: false }); resources.push(sunMaterial);
    const disc = new THREE.Mesh(sunGeometry, sunMaterial); disc.position.set(-33, 11, -108); scene.add(disc);
    halo(-33, 11, -107, "#ffd7a4", 42);
    for (const z of [5, -10, -24]) lamp(z === -10 ? 1.9 : -1.9, z);
    const gravel = mat({ color: "#a6a18c", roughness: 1 });
    for (let z = 10; z >= -29; z -= 1.35) {
      box(1.85, 0.025, 1.1, Math.sin(z * 0.15) * 0.08, 0.03, z, gravel);
    }
    for (const side of [-1, 1]) {
      for (let z = 10; z > -30; z -= 2) box(0.12, 0.9, 0.12, side * 10.4, 0.45, z, wood);
      for (const y of [0.32, 0.7]) box(0.08, 0.08, 40, side * 10.4, y, -10, wood);
      // Los cables se hunden entre postes, más allá de los límites caminables.
      for (let z = 8; z > -32; z -= 13) {
        cylinder(0.1, 6, side * 13, 3, z, wood);
        box(2.1, 0.12, 0.12, side * 13, 5.4, z, wood);
        for (const offset of [-0.65, 0.65]) tube([[side * 13 + offset, 5.5, z], [side * 13 + offset, 4.6, z - 6.5], [side * 13 + offset, 5.5, z - 13]], 0.015, dark);
      }
    }
    level.walls.forEach(([x, z, w, d], i) => {
      const front = z + d / 2 + 0.16;
      plaque(["AYER", "AHORA", "MAÑANA"][i], "NO OLVIDES LA FECHA", x, 2.35, front, 1.3);
      box(0.5, 0.35, 0.5, x + w / 2 + 0.45, 0.18, front, faded);
      cylinder(0.09, 0.7, x + w / 2 + 0.45, 0.65, front, dark);
      for (const offset of [-0.28, 0.28]) box(0.2, 0.6, 0.05, x + offset, 1.4, front, wood);
      // Peldaños visibles hacia los porches.
      box(1.5, 0.1, 0.65, x, 0.05, front + 1.1, gravel);
    });
    for (const station of level.stations.filter((item) => item.kind === "letter")) {
      box(1.6, 0.12, 1.25, station.x, 0.66, station.z, wood);
      for (const dx of [-0.6, 0.6]) box(0.08, 0.65, 0.8, station.x + dx, 0.32, station.z, steel);
      box(1.9, 0.1, 1.6, station.x, 2.35, station.z, dark);
      for (const dx of [-0.8, 0.8]) box(0.07, 2.35, 0.07, station.x + dx, 1.17, station.z + 0.5, wood);
    }
  } else if (level.theme === "pool") {
    const stripe = mat({ color: "#235c60", roughness: 0.3 });
    const terracotta = mat({ color: "#b87e6c", roughness: 0.7 });
    // Bandeau de azulejos, ventanas altas, pilares y cañerías expuestas.
    for (const side of [-1, 1]) {
      box(0.08, 0.24, 45, side * 10.74, 1.8, -9, stripe);
      for (let z = 9; z > -31; z -= 7) {
        box(0.22, 4.1, 0.65, side * 10.5, 2.05, z, trim);
        box(0.05, 1.05, 3.5, side * 10.7, 3.1, z - 2, cyan);
        for (const dz of [-1, 0, 1]) box(0.1, 1.15, 0.04, side * 10.6, 3.1, z - 2 + dz, steel);
      }
      tube([[side * 9.9, 3.85, 11], [side * 9.9, 3.85, -28], [side * 9.9, 1, -29]], 0.085, copper);
    }
    for (const z of [8.5, -26.5]) box(6.6, 0.65, 0.3, 7, 0.32, z, trim);
    for (const x of [5.1, 7, 8.9]) {
      box(0.12, 0.035, 34, x, 0.11, -9, stripe);
      for (const z of [6, -24]) box(1, 0.035, 0.14, x, 0.12, z, stripe);
    }
    for (let i = 0; i < 7; i++) {
      box(0.85, 1.8, 0.55, -9.6 + i * 0.92, 0.9, -30.5, i % 2 ? stripe : terracotta);
      box(0.05, 0.18, 0.04, -9.3 + i * 0.92, 1, -30.19, steel);
      box(0.55, 0.03, 0.04, -9.6 + i * 0.92, 1.55, -30.19, dark);
    }
    for (const z of [0, -17]) {
      tube([[-10.5, 3.5, z], [0, 3.1, z], [10.5, 3.5, z]], 0.015, steel);
      for (let i = 0; i < 13; i++) {
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute("position", new THREE.Float32BufferAttribute([-.3, 0, 0, .3, 0, 0, 0, -.5, 0], 3)); geometry.computeVertexNormals(); resources.push(geometry);
        const flag = new THREE.Mesh(geometry, i % 2 ? trim : stripe); flag.material.side = THREE.DoubleSide;
        flag.position.set(-9 + i * 1.5, 3.15 + Math.abs(i - 6) * .04, z); scene.add(flag);
      }
    }
    plaque("01 > 02 > 03", "SUPERFICIE / FONDO / CIERRE", -5.3, 2.75, -31.75, 3.4);
    plaque("NO QUEDA NADIE", "VERIFICAR ANTES DE FICHAR", 5.8, 2.7, -31.75, 3.8);
    for (const z of [5, -9, -24]) box(0.8, 0.025, 0.65, -8, 0.65, z, terracotta);
    // Circuito de drenaje visible en la zona seca.
    tube([[-3, .32, 3], [-4.4, .32, 1], [-4.4, .32, -21], [-3, .32, -21]], .07, copper);
    tube([[-4.4, .32, -8], [2, .32, -8]], .07, copper);
    for (let z = 10; z > -29; z -= 1.2) box(.3, .012, .6, 3.3, .03, z, z % 2 ? amber : dark);
  } else {
    const violet = mat({ color: "#b4acd3", emissive: "#8c78cf", emissiveIntensity: .4, roughness: .45 });
    const glass = mat({ color: "#718ca3", transparent: true, opacity: .1, depthWrite: false, side: THREE.DoubleSide });
    // Techo a dos aguas: las nervaduras dibujan una perspectiva de estación.
    for (let z = 12; z > -32; z -= 6) {
      tube([[-10.5, 5.7, z], [0, 8.2, z], [10.5, 5.7, z]], .06, steel);
    }
    for (const side of [-1, 1]) {
      const roof = box(10.8, .035, 46, side * 5.25, 6.95, -9, glass); roof.rotation.z = -side * .234;
      box(.08, .08, 46, side * 5.25, 7, -9, copper);
      box(.1, .12, 46, side * 9.8, .16, -9, violet);
      for (let z = 8; z > -29; z -= 8) {
        tube([[side * 10, 5.7, z], [side * 6, 4.9, z], [side * 2, 5.7, z]], .02, copper);
        cylinder(.12, .4, side * 6, 4.75, z, amber);
        halo(side * 6, 4.6, z, "#d6b57c", 1.2);
      }
    }
    box(.12, .12, 46, 0, 8.2, -9, steel);
    for (let z = 9; z > -29; z -= 2) {
      box(3.1, .025, 1.8, 0, .025, z, z % 4 ? dark : faded);
    }
    plaque("PRÓXIMA PARTIDA", "--:-- / ANDÉN SIN ASIGNAR", 0, 4.1, -30.5, 5.2);
    plaque("88.3 / 89.1 / 90.6", "LLEGADA / ESPERA / PARTIDA", 0, 3.3, -30.5, 4.4);
    for (const [i, station] of level.stations.entries()) {
      if (station.kind !== "receiver") continue;
      for (let j = 0; j < 3; j++) {
        const arc = ring(.5 + j * .22, station.x, 2.9 + j * .15, station.z, violet, true);
        movingParts.push({ mesh: arc, offset: i + j, station: i });
      }
      tube([[station.x, .08, station.z], [station.x * .5, .08, station.z - 2], [0, .08, -28]], .018, copper);
    }
    // Árboles de antenas continúan tras el cristal y se pierden en la niebla.
    for (let i = 0; i < (compact ? 12 : 24); i++) {
      const x = (i % 2 ? -1 : 1) * (15 + i % 4 * 4), z = 9 - Math.floor(i / 2) * 5;
      cylinder(.05, 5 + i % 3, x, 2.5, z, dark);
      box(2.5, .045, .045, x, 4.6, z, steel);
      halo(x, 5, z, "#b4a3df", .7);
    }
  }

  return {
    update(elapsed, journey, motion) {
      movingParts.forEach(({ mesh, offset, station }) => {
        mesh.rotation.z = motion ? Math.sin(elapsed * .35 + offset) * .16 : 0;
        mesh.visible = !journey.activated.has(station);
      });
      accents.forEach((light) => { light.intensity = 6 + journey.done.size * .25; });
    },
  };
}
