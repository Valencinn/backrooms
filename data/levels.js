/**
 * Fuente compartida del selector, visor y HUD.
 * Riesgo, entidades, temperatura y señal son datos narrativos ficticios.
 * Cada pared es [centroX, centroZ, anchoX, profundidadZ]; el visor calcula su altura Y.
 * Los ids correlativos se usan como índices del nivel seleccionado.
 */
export const levels = [
  {
    // Lobby: tabiques amarillos que forman un laberinto finito.
    id: 0,
    code: "LVL_000",
    name: "The Lobby",
    subtitle: "El principio de ninguna parte.",
    type: "Espacio liminal",
    danger: "CLASE 0",
    risk: "Bajo",
    entities: "No confirmadas",
    temperature: "21.4",
    signal: "98",
    color: "#ddbc69",
    description:
      "El zumbido de las luces fluorescentes. El olor de la alfombra húmeda. Un laberinto de habitaciones amarillas que se repiten, como un recuerdo que nunca fue tuyo.",
    note: "Si escuchás pasos, dejá de caminar. Escuchá si también se detienen.",
    log: "Entorno estable. No se detectan otras presencias.",
    walls: [
      [-5, 3, 1, 10],
      [4, -3, 1, 9],
      [-3, -9, 8, 1],
      [6, -15, 1, 7],
      [-6, -22, 1, 9],
      [2, -24, 8, 1],
    ],
  },
  {
    // Almacén: paredes cortas y cuadradas que el visor representa como columnas.
    id: 1,
    code: "LVL_001",
    name: "Habitable Zone",
    subtitle: "La seguridad es una ilusión.",
    type: "Complejo industrial",
    danger: "CLASE 1",
    risk: "Moderado",
    entities: "Avistamientos aislados",
    temperature: "16.8",
    signal: "76",
    color: "#b9c4b7",
    description:
      "Un almacén de hormigón que parece no terminar. Las luces fallan sin aviso y la niebla se filtra entre las columnas. Hay suministros. También hay cosas que los están buscando.",
    note: "Permanecé en las zonas iluminadas. La oscuridad nunca está vacía.",
    log: "Interferencia intermitente. Mantener contacto visual.",
    walls: [
      [-6, 2, 1.5, 1.5],
      [5, 0, 1.5, 1.5],
      [-6, -7, 1.5, 1.5],
      [5, -9, 1.5, 1.5],
      [-6, -17, 1.5, 1.5],
      [5, -19, 1.5, 1.5],
      [0, -26, 1.5, 1.5],
    ],
  },
  {
    // Mantenimiento: paredes longitudinales que delimitan el pasillo de tuberías.
    id: 2,
    code: "LVL_002",
    name: "Pipe Dreams",
    subtitle: "Algo se mueve en las tuberías.",
    type: "Túnel de mantenimiento",
    danger: "CLASE 2",
    risk: "Elevado",
    entities: "Presencia hostil",
    temperature: "38.2",
    signal: "43",
    color: "#d18a64",
    description:
      "Pasillos de servicio, calor sofocante y kilómetros de tuberías oxidadas. El metal cruje detrás de las paredes. Seguí avanzando: no todos los sonidos vienen del sistema de ventilación.",
    note: "No toques las tuberías. No sigas las voces.",
    log: "Anomalía térmica detectada. Proceder con precaución.",
    walls: [
      [-5, -4, 1, 30],
      [5, -4, 1, 30],
      [-7, -23, 6, 1],
      [7, -23, 6, 1],
    ],
  },
];
