# THE BACKROOMS — Terminal de experiencias liminales

Al abrir `/`, una secuencia de arranque de terminal da paso a una habitación Three.js pequeña y oscura. Aparece en cada entrada, también con caché y al volver a la habitación, y permanece al menos 3,6 segundos después del primer frame real. Durante el arranque se bloquean el movimiento y la interacción; los mensajes son una secuencia narrativa, no mediciones del equipo. Solo la lámpara del escritorio y el CRT iluminan la mesa. Acercarse y pulsar E abre una terminal funcional. El comando `salir`, disponible en la terminal, vuelve a la habitación. Los niveles completados se conservan en este navegador.

La interfaz usa una estética de consola Linux con negro, fósforo verde, tipografía monoespaciada, directorio de frecuencias, prompt y cursor. La apariencia propia de cada mundo se conserva dentro del visor. Se respeta la preferencia de movimiento reducido para el cursor y la animación de arranque.

## Ejecutar

Usar Node.js 22.13 o superior. Ejecutar `npm install`, `npm run dev` y abrir http://localhost:3000. Verificación: `npm test`, `npm run lint` y `npm run build`. Producción: `npm start`.

## Comandos

- `ayuda` / `help`: instrucciones.
- `niveles` / `ls`: frecuencias y recorridos recuperados.
- `info 94721`: descripción y objetivo.
- `entrar 94721` (o el número solo): entrar al nivel.
- `estado`: recorridos completados y guardados localmente.
- `limpiar` / `clear`: limpiar el historial visual.
- `salir` / `exit`: dejar la computadora desde la terminal.

El prompt admite historial con flechas arriba y abajo. Los comandos se interpretan localmente y no ejecutan una shell del sistema.

## Experiencias originales

Los números pertenecen al registro de autor BR-A, no son una afirmación de exclusividad dentro de todas las comunidades de Backrooms.

| Identificador | Entorno | Experiencia |
| --- | --- | --- |
| BR-A / 94721 · La hora prestada | Barrio abierto entre lomas y casas sin calles | Recuperar tres cartas, entregarlas en orden cronológico y sincronizar el reloj: 7 acciones en 3 etapas. |
| BR-A / 96308 · El último turno | Balneario municipal fuera de horario | Recuperar e instalar el fusible, purgar tres válvulas en orden, cebar la bomba, verificar el vaciado y fichar: 8 acciones en 4 etapas. |
| BR-A / 98144 · Jardín de espera | Invernadero de bancos y antenas | Reconectar dos relés, sintonizar y recibir tres frecuencias en orden, transmitir el mensaje: 6 acciones en 3 etapas. |

Los niveles ocupan toda la pantalla. Después de completar todas las etapas hay que volver a la puerta de entrada (X = 0, Z = 11,5). Antes está cerrada y tiene colisión; después se abre y se ilumina. Cruzarla registra el final, guarda el nivel y habilita el siguiente. El acceso comprueba todos los niveles anteriores, incluso al escribir el número directamente o usar un alias. Las tarjetas y `niveles` distinguen accesos disponibles, bloqueados y completados.

El progreso de campaña se guarda en localStorage bajo `backrooms-br-a-campaign-v1`. Se descartan duplicados, datos desconocidos y cadenas incompletas. Se guarda al regresar, nunca por recoger el último objeto. Reingresar inicia la misión desde cero y permite repetir niveles completados. Recargar durante una misión descarta sus acciones parciales. Sin almacenamiento, la terminal conserva los recorridos durante su sesión e informa que no pudo guardarlos.

El HUD muestra etapa, acciones, inventario y condiciones de interacción. El mapa numera las estaciones y destaca sólo las habilitadas. Los materiales luminosos y los aros de suelo comparten ese estado. Caminar, cambiar de estación o resintonizar reinicia la estabilización; la pausa y una pestaña oculta detienen el tiempo.

## Controles

- WASD o flechas para caminar; arrastrar el visor para mirar.
- E para usar la computadora o un objeto cercano. Hay botones equivalentes para tacto.
- Q/R o los botones −/+ para cambiar entre los cinco canales de los receptores del jardín. Sólo el canal correcto acumula recepción.
- Pausa, CRT y pantalla completa dentro de cada nivel.
- La guía pausa temporalmente el entorno y restaura el estado anterior al cerrar.

## Archivos

- `app/page.js`: entrada del servidor.
- `components/backrooms/EntryExperience.js`: alterna habitación y terminal.
- `components/backrooms/ComputerRoom.js`: habitación, CRT, iluminación, proximidad y controles.
- `components/backrooms/entry.css`: carga, interfaz de la habitación y retorno.
- `data/originalLevels.js`: narrativa, números y posiciones de las tres experiencias. `data/levels.js` conserva el punto de importación compartido.
- `data/missions.mjs`: estaciones, etapas, orden, inventario, tiempos y frecuencias de cada misión.
- `components/backrooms/progression.mjs`: requisitos de campaña y persistencia local validada.
- `components/backrooms/worldDetails.js`: arquitectura, utilería y ambientación de cada entorno.
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

`components/backrooms/graphics.js` comparte la configuración del renderer, las texturas procedurales de 512 px (color y relieve), los carteles y la iluminación de entorno precalculada con PMREM. Se usa ACES, salida sRGB y filtrado anisotrópico. Las sombras PCF se calculan al construir la escena, al completar una acción y al abrir la puerta; la cámara puede moverse sin recalcular la arquitectura estática.

El barrio suma un sol bajo, sendero de losas, faroles cálidos, cercas, cables suspendidos y refugios de correspondencia. Las ventanas cambian la luz del amanecer al entregar cartas. El balneario incorpora carriles sumergidos, lockers, ventanas altas, banderines, franjas cerámicas y cañerías de cobre; la energía vuelve con el fusible y el agua desciende sólo al arrancar la bomba. El jardín tiene techo a dos aguas con nervaduras, vidrio, cables de señal, luces colgantes y anillos sobre los receptores, además de vegetación y antenas lejanas. Cada herramienta tiene su propia geometría: cartas, fusibles, válvulas, tableros, relojes y transmisor.

En pantallas pequeñas se reducen la densidad de pasto, la resolución de sombras y la textura de reflexión (256 frente a 512 px). El pixel ratio tiene un límite de 1,35 en móvil y 1,75 en escritorio. Los efectos CRT y el movimiento reducido detienen las ondulaciones y las partículas decorativas. Al salir se liberan también el entorno PMREM, el reflector y los buffers de instancias.

Los efectos liberan recursos, luces, geometrías, materiales, texturas, listeners y contextos WebGL al salir. Se limita el pixel ratio y se detiene la animación al ocultar la pestaña. La preferencia de movimiento reducido desactiva las oscilaciones decorativas. Si WebGL falla, se ofrece recargar con un mensaje accesible.
