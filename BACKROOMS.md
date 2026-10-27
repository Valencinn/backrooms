# THE BACKROOMS — Terminal de experiencias liminales

Al abrir `/`, una secuencia de arranque de terminal da paso a una habitación Three.js pequeña y oscura. Aparece en cada entrada, también con caché y al volver a la habitación, y permanece al menos 3,6 segundos después del primer frame real. Durante el arranque se bloquean el movimiento y la interacción; los mensajes son una secuencia narrativa, no mediciones del equipo. Solo la lámpara del escritorio y el CRT iluminan la mesa. Acercarse y pulsar E abre una terminal funcional. El comando `salir`, disponible en la terminal, vuelve a la habitación y reinicia la sesión.

La interfaz usa una estética de consola Linux con negro, fósforo verde, tipografía monoespaciada, directorio de frecuencias, prompt y cursor. La apariencia propia de cada mundo se conserva dentro del visor. Se respeta la preferencia de movimiento reducido para el cursor y la animación de arranque.

## Ejecutar

Usar Node.js 22.13 o superior. Ejecutar `npm install`, `npm run dev` y abrir http://localhost:3000. Verificación: `npm test`, `npm run lint` y `npm run build`. Producción: `npm start`.

## Comandos

- `ayuda` / `help`: instrucciones.
- `niveles` / `ls`: frecuencias y recorridos recuperados.
- `info 94721`: descripción y objetivo.
- `entrar 94721` (o el número solo): entrar al nivel.
- `estado`: recorridos completados durante la sesión.
- `limpiar` / `clear`: limpiar el historial visual.
- `salir` / `exit`: dejar la computadora desde la terminal.

El prompt admite historial con flechas arriba y abajo. Los comandos se interpretan localmente y no ejecutan una shell del sistema.

## Experiencias originales

Los números pertenecen al registro de autor BR-A, no son una afirmación de exclusividad dentro de todas las comunidades de Backrooms.

| Identificador | Entorno | Experiencia |
| --- | --- | --- |
| BR-A / 94721 · La hora prestada | Barrio abierto entre lomas y casas sin calles | Activar tres buzones enciende las ventanas y devuelve el amanecer al cielo. |
| BR-A / 96308 · El último turno | Balneario municipal fuera de horario | Tres válvulas bajan el agua, revelan fragmentos del camino y desbloquean la puerta de entrada. |
| BR-A / 98144 · Jardín de espera | Invernadero de bancos y antenas | Permanecer inmóvil tres segundos cerca de cada receptor permite recibir su señal. Moverse interrumpe la recepción. |

Los niveles ocupan toda la pantalla, sin navegación a otras frecuencias ni botones de regreso a la terminal. Después de las tres intervenciones hay que volver a la puerta de entrada, detrás del punto de aparición (X = 0, Z = 11,5). Antes de completar el objetivo está cerrada y tiene colisión; después se abre y se ilumina. Acercarse al umbral abierto devuelve a la terminal, que conserva el historial y registra el final y la frecuencia recuperada. El HUD y el mapa muestran el objetivo, el progreso y la puerta. Reingresar por comando inicia un recorrido nuevo. No se guarda progreso entre sesiones.

## Controles

- WASD o flechas para caminar; arrastrar el visor para mirar.
- E para usar la computadora o un objeto cercano. Hay botones equivalentes para tacto.
- Pausa, CRT y pantalla completa dentro de cada nivel.
- La guía pausa temporalmente el entorno y restaura el estado anterior al cerrar.

## Archivos

- `app/page.js`: entrada del servidor.
- `components/backrooms/EntryExperience.js`: alterna habitación y terminal.
- `components/backrooms/ComputerRoom.js`: habitación, CRT, iluminación, proximidad y controles.
- `components/backrooms/entry.css`: carga, interfaz de la habitación y retorno.
- `data/originalLevels.js`: narrativa, números y posiciones de las tres experiencias. `data/levels.js` conserva el punto de importación compartido.
- `components/backrooms/levelWorld.js`: construcción de entornos y puerta con colisión.
- `components/backrooms/journey.mjs`: progresión, quietud y regla de regreso a la puerta.
- `components/backrooms/terminalCommands.mjs`: interpretación local de comandos.
- `components/backrooms/TerminalHub.js`: prompt, historial de comandos y salida de la consola.
- `components/backrooms/mission.css`: terminal funcional e interfaz de nivel a pantalla completa.
- `components/backrooms/ThreeViewer.js`: cámara, colisiones, entradas, pausa, telemetría y recursos WebGL.
- `components/backrooms/BackroomsExplorer.js`: coordina terminal, entrada, regreso, recorridos completados, HUD y guía.
- `tests/journey.test.mjs`: pruebas de bloqueo y regreso, quietud, reinicio y validación de comandos.

Los escenarios usan geometría local sin descargar modelos, imágenes ni fuentes. Los recorridos son finitos. Riesgo, temperatura y señal son ficción; posición y progreso provienen de la escena. No hay audio ni enemigos. El jardín recibe mensajes de forma visual. Las rutas `/archivo/carrier`, `/archivo/witness` y `/archivo/echo` conservan el proyecto anterior.

## Gráficos

`components/backrooms/graphics.js` comparte la configuración del renderer, las texturas procedurales de 512 px (color y relieve), los carteles y la iluminación de entorno precalculada con PMREM. Se usa ACES, salida sRGB y filtrado anisotrópico. Las sombras PCF se calculan al construir la escena y al abrir la puerta; la cámara puede moverse sin recalcular la arquitectura estática.

Las casas tienen tejados a dos aguas, porches, marcos, chimeneas y luz que se derrama desde las ventanas encendidas. El pasto usa instancias en una sola llamada de dibujo. El balneario tiene superficies cerámicas, bancos, escaleras y un reflejo planar del entorno con ondulación suave; su superficie acompaña el descenso del agua. El jardín suma vidrio, bancos de madera, metal, plantas en instancias y partículas tenues. El cielo exterior se dibuja con gradiente y nubes procedurales, y cambia con el amanecer. El CRT de la habitación tiene bordes redondeados, pantalla curva y detalles de cableado.

En pantallas pequeñas se reducen la densidad de pasto, la resolución de sombras y la textura de reflexión (256 frente a 512 px). El pixel ratio tiene un límite de 1,35 en móvil y 1,75 en escritorio. Los efectos CRT y el movimiento reducido detienen las ondulaciones y las partículas decorativas. Al salir se liberan también el entorno PMREM, el reflector y los buffers de instancias.

Los efectos liberan recursos, luces, geometrías, materiales, texturas, listeners y contextos WebGL al salir. Se limita el pixel ratio y se detiene la animación al ocultar la pestaña. La preferencia de movimiento reducido desactiva las oscilaciones decorativas. Si WebGL falla, se ofrece recargar con un mensaje accesible.
