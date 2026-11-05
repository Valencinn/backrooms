export const missions = {
  hills: {
    objective: "Recuperá la correspondencia y reconstruí el amanecer.",
    note: "Recuperá las cartas en los tres refugios. Entregalas en orden: ayer, ahora, mañana. Cada entrega requiere dos segundos de quietud. Después sincronizá el reloj de la plaza y regresá.",
    stations: [
      { x: -3, z: 3, label: "Buzón del ayer", kind: "mailbox" },
      { x: 3, z: -8, label: "Buzón del ahora", kind: "mailbox" },
      { x: -3, z: -21, label: "Buzón del mañana", kind: "mailbox" },
      { x: 7, z: 6, label: "Refugio del ayer", kind: "letter" },
      { x: -8, z: -10, label: "Refugio del ahora", kind: "letter" },
      { x: 7, z: -25, label: "Refugio del mañana", kind: "letter" },
      { x: 0, z: -28, label: "Reloj de la plaza", kind: "clock" },
    ],
    stages: [
      { title: "Cartas sin destinatario", hint: "Explorá los refugios 04, 05 y 06. Recogé las cartas en cualquier orden.", tasks: [
        { id: "past-letter", station: 3, label: "Recuperar la carta del ayer", gives: "Carta del ayer" },
        { id: "present-letter", station: 4, label: "Recuperar la carta del ahora", gives: "Carta del ahora" },
        { id: "future-letter", station: 5, label: "Recuperar la carta del mañana", gives: "Carta del mañana" },
      ] },
      { title: "El orden del tiempo", ordered: true, hint: "Las fechas indican el orden: ayer → ahora → mañana. Esperá dos segundos junto a cada buzón antes de entregar.", tasks: [
        { id: "past-mail", station: 0, label: "Entregar la carta del ayer", consumes: "Carta del ayer", duration: 2 },
        { id: "present-mail", station: 1, label: "Entregar la carta del ahora", consumes: "Carta del ahora", duration: 2 },
        { id: "future-mail", station: 2, label: "Entregar la carta del mañana", consumes: "Carta del mañana", duration: 2 },
      ] },
      { title: "Un minuto más", hint: "Las ventanas alimentan el reloj 07 al fondo del sendero. Quedate quieto cuatro segundos y sincronizalo.", tasks: [
        { id: "dawn-clock", station: 6, label: "Sincronizar el reloj del amanecer", duration: 4 },
      ] },
    ],
  },
  pool: {
    objective: "Restaurá la energía, purgá el circuito y certificá el cierre.",
    note: "Buscá el fusible e instalalo en el tablero. Purgá superficie, fondo y cierre en ese orden, dejando estabilizar cada válvula. Cebá la bomba, verificá el desagüe y fichá la salida.",
    stations: [
      { x: -3, z: 3, label: "Válvula de superficie", kind: "valve" },
      { x: 2, z: -8, label: "Válvula de fondo", kind: "valve" },
      { x: -3, z: -21, label: "Válvula de cierre", kind: "valve" },
      { x: -8, z: 4, label: "Banco de mantenimiento", kind: "fuse" },
      { x: -8, z: -15, label: "Tablero eléctrico", kind: "panel" },
      { x: -1, z: -28, label: "Bomba de drenaje", kind: "pump" },
      { x: 2, z: -24, label: "Mirilla del desagüe", kind: "gauge" },
      { x: -7, z: 9, label: "Reloj de personal", kind: "panel" },
    ],
    stages: [
      { title: "Sin suministro", ordered: true, hint: "El banco 04 guarda un fusible. Lleválo al tablero 05 para recuperar la energía.", tasks: [
        { id: "fuse", station: 3, label: "Recuperar el fusible de repuesto", gives: "Fusible cerámico" },
        { id: "power", station: 4, label: "Instalar el fusible en el tablero", consumes: "Fusible cerámico", duration: 2 },
      ] },
      { title: "Purgar el circuito", ordered: true, hint: "Protocolo: SUPERFICIE → FONDO → CIERRE. No te muevas mientras se estabiliza la presión.", tasks: [
        { id: "surface", station: 0, label: "Purgar la válvula de superficie", duration: 2 },
        { id: "bottom", station: 1, label: "Purgar la válvula de fondo", duration: 3 },
        { id: "seal", station: 2, label: "Aislar la válvula de cierre", duration: 4 },
      ] },
      { title: "Vaciar y verificar", ordered: true, hint: "Cebá la bomba 06. Inspeccioná la mirilla 07: la lectura requiere seis segundos de quietud.", tasks: [
        { id: "pump", station: 5, label: "Cebar la bomba de drenaje", duration: 4 },
        { id: "drain-check", station: 6, label: "Verificar el vaciado del circuito", duration: 6, gives: "Acta de cierre" },
      ] },
      { title: "El último empleado", hint: "Llevá el acta al reloj de personal 08 junto a la entrada y registrá el fin del turno.", tasks: [
        { id: "shift-end", station: 7, label: "Fichar la salida del último turno", consumes: "Acta de cierre" },
      ] },
    ],
  },
  garden: {
    objective: "Restablecé la red y reconstruí el mensaje de la próxima partida.",
    note: "Conectá los dos relés. Q/R o −/+ sintonizan: llegada 88.3, espera 89.1 y partida 90.6 MHz. Recibilos en ese orden sin moverte. Enviá los tres fragmentos desde el transmisor central.",
    stations: [
      { x: -3, z: 3, label: "Receptor de llegada", kind: "receiver", frequency: 883 },
      { x: 3, z: -8, label: "Receptor de espera", kind: "receiver", frequency: 891 },
      { x: -3, z: -21, label: "Receptor de partida", kind: "receiver", frequency: 906 },
      { x: 8, z: 7, label: "Relé este", kind: "relay" },
      { x: -8, z: -15, label: "Relé oeste", kind: "relay" },
      { x: 0, z: -28, label: "Transmisor de partida", kind: "transmitter" },
    ],
    stages: [
      { title: "Raíces de cobre", hint: "Reactivá los relés 04 y 05 en los extremos del invernadero. Cada conexión requiere dos segundos de quietud.", tasks: [
        { id: "east-relay", station: 3, label: "Conectar el relé este", duration: 2 },
        { id: "west-relay", station: 4, label: "Conectar el relé oeste", duration: 2 },
      ] },
      { title: "Tres voces, un horario", ordered: true, hint: "Cuaderno: llegada 88.3 → espera 89.1 → partida 90.6 MHz. Q/R cambia el canal. Moverte o resintonizar interrumpe la recepción.", tasks: [
        { id: "arrival", station: 0, label: "Recibir llegada · 88.3 MHz", frequency: 883, duration: 3, gives: "Fragmento: el próximo" },
        { id: "waiting", station: 1, label: "Recibir espera · 89.1 MHz", frequency: 891, duration: 4, gives: "Fragmento: tren te" },
        { id: "departure", station: 2, label: "Recibir partida · 90.6 MHz", frequency: 906, duration: 5, gives: "Fragmento: está esperando" },
      ] },
      { title: "La voz completa", hint: "El transmisor 06 al fondo del jardín necesita seis segundos de conexión estable para enviar los tres fragmentos.", tasks: [
        { id: "transmit", station: 5, label: "Transmitir: el próximo tren te está esperando", duration: 6 },
      ] },
    ],
  },
};
