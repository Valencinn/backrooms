/**
 * Contenido del prototipo original. El orden determina el desbloqueo.
 * id aparece en la URL, clueId identifica la evidencia, color/accent configuran el artefacto.
 */
export const chapters = [
  {
    id: "carrier",
    number: "01",
    label: "LA PORTADORA",
    eyebrow: "23:47:11 / FRECUENCIA INESTABLE",
    title: "Hay una señal debajo de la señal.",
    copy: "En 1988, durante once minutos, todos los televisores de Puerto Umbral mostraron esta forma. Nadie recuerda el mismo sonido.",
    clueId: "tone",
    clueLabel: "TONO 17.6",
    instruction: "Tocá el núcleo para aislar la frecuencia.",
    color: "#ff3d81",
    accent: "#63f3ff",
  },
  {
    id: "witness",
    number: "02",
    label: "EL TESTIGO",
    eyebrow: "ARCHIVO B / CINTA RECUPERADA",
    title: "La memoria también tiene interferencia.",
    copy: "Una operadora dejó tres versiones del incidente. En todas cambia la fecha, pero repite una coordenada: 34°36′S.",
    clueId: "coordinate",
    clueLabel: "34°36′S",
    instruction: "Estabilizá el archivo tocando el objeto.",
    color: "#b7ff3c",
    accent: "#ffdf6b",
  },
  {
    id: "echo",
    number: "03",
    label: "EL ECO",
    eyebrow: "ORIGEN DESCONOCIDO / BUCLE ACTIVO",
    title: "La transmisión todavía te está esperando.",
    copy: "El último fragmento no pertenece a 1988. En sus metadatos figura la fecha de hoy y el nombre de quien lo está mirando.",
    clueId: "message",
    clueLabel: "NO ERA UN ECO",
    instruction: "Abrí el núcleo por última vez.",
    color: "#9c7cff",
    accent: "#63f3ff",
  },
];
