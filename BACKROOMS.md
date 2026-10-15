# THE BACKROOMS — Archivo de lo imposible

Experiencia académica de espacios liminales construida sobre el proyecto existente. La página principal es un explorador 3D; las rutas `/archivo/carrier`, `/archivo/witness` y `/archivo/echo` conservan la experiencia anterior.

## Ejecutar

Usar Node.js 22.13 o superior para cumplir también los requisitos de las herramientas de desarrollo.

```sh
npm install
npm run dev
```

Abrir http://localhost:3000. Para producción: `npm run build` y `npm start`.

## Archivos principales

| Archivo                                     | Responsabilidad                                                    |
| ------------------------------------------- | ------------------------------------------------------------------ |
| `app/page.js`                               | Página de entrada de Next.js (Server Component)                    |
| `components/backrooms/BackroomsExplorer.js` | Estado del nivel activo, HUD, pausa, VHS, pantalla completa y guía |
| `components/backrooms/LevelSidebar.js`      | Directorio de niveles accesible                                    |
| `components/backrooms/ThreeViewer.js`       | Escena Three.js, cámara, colisiones, texturas y ciclo de vida      |
| `components/backrooms/backrooms.css`        | Layout responsive, grano, scanlines, viñeta y tema                 |
| `data/levels.js`                            | Contenido y planta arquitectónica de los tres niveles              |
| `postcss.config.mjs`                        | Plugin de Tailwind CSS 4                                           |
| `app/globals.css`                           | Importación de Tailwind y estilos originales                       |

Se mantiene JavaScript/JSX, el lenguaje del repositorio. Los componentes que usan estado, efectos o DOM llevan `'use client'`. Tailwind 4 se configura a través de PostCSS y `@import "tailwindcss"`; no requiere `tailwind.config.js`.

## Controles

1. Elegir The Lobby, Habitable Zone o Pipe Dreams en la barra lateral.
2. Pulsar **Explorar nivel**.
3. Moverse con WASD o las flechas. Arrastrar el canvas para orientar la cámara. En pantallas táctiles se pueden usar las flechas superpuestas.
4. Usar **Pausar**, **VHS ON/OFF** o **Pantalla completa** desde la barra inferior. Se puede salir de pantalla completa con Escape.
5. La guía de campo se abre como un diálogo nativo, pausa temporalmente la escena y devuelve el estado anterior al cerrarse.

## Three.js y React

`BackroomsExplorer` guarda `activeLevel` y pasa la configuración a `ThreeViewer`. El `key` del nivel fuerza un desmontaje limpio antes de crear el siguiente entorno. El efecto crea el renderer, la cámara, la escena, las geometrías y las texturas.

Las paredes usan cajas con zócalos y colisiones AABB ampliadas por el radio del explorador. El movimiento se calcula con delta de tiempo limitado; la cámara tiene altura fija y límites verticales de giro. El almacén agrega columnas y cajas; el túnel agrega tuberías cilíndricas. No se descargan modelos, imágenes ni fuentes externas.

Las texturas de alfombra, papel tapiz y cielorraso se generan con Canvas 2D y un generador pseudoaleatorio determinista. Las luces fluorescentes combinan materiales emisivos y luces puntuales con una oscilación de baja amplitud. `FogExp2` limita la visibilidad. El pixel ratio se limita a 1.75 para contener el costo gráfico.

`requestAnimationFrame` dibuja la escena. `ResizeObserver` actualiza renderer y cámara. La telemetría se publica a React como máximo cuatro veces por segundo. El minimapa usa la misma lista de paredes que la escena; se omiten algunos detalles decorativos, por lo que se identifica como parcial.

Al desmontar se cancela el frame, se desconecta el observer, se retiran listeners, se limpian entradas y se ejecuta `dispose()` en geometrías, materiales, texturas y renderer. También se libera el contexto WebGL. El bucle deja de renderizar si la pestaña está oculta o la escena está pausada. `prefers-reduced-motion` desactiva oscilación de cámara, parpadeos y animaciones CSS.

## Alcance de la ficción

Son tres recintos finitos y explorables, no un laberinto infinito. Riesgo, entidades, temperatura y porcentaje de señal son datos narrativos de cada nivel; no sensores ni simulaciones de personajes. Coordenadas, orientación y tiempo sí provienen de la cámara. No hay audio, enemigos, backend ni inicio de sesión en el explorador.

Si WebGL no está disponible, el visor muestra una explicación y una opción para recargar; el directorio y las descripciones siguen disponibles.

## Cómo leer el código comentado

Los archivos de aplicación tienen comentarios en español por responsabilidad y por bloque. Se formateó el JSX para que los elementos del HUD, minimapa y controles puedan seguirse sin líneas extensas.

Orden sugerido:

1. `app/page.js`: entrada del servidor a la experiencia interactiva.
2. `data/levels.js`: contenido y planta de cada nivel; las paredes son `[x, z, ancho, profundidad]`.
3. `components/backrooms/LevelSidebar.js`: la selección sube al padre mediante `onSelect`.
4. `components/backrooms/BackroomsExplorer.js`: estado compartido, HUD, telemetría y composición del visor.
5. `components/backrooms/ThreeViewer.js`: creación de texturas, escena y materiales; construcción del entorno; entradas; colisiones; animación; redimensionado; limpieza.
6. `components/backrooms/backrooms.css`: capas visuales, controles y adaptación responsive.

El flujo principal es: clic en nivel → `selectLevel` actualiza el estado → React cambia la `key` del visor → el efecto anterior libera la GPU → el nuevo visor construye el entorno → su telemetría actualiza coordenadas y minimapa.

El código de SEÑAL 88 también está comentado y se conserva en las rutas `/archivo/*`. `Experience` organiza sus capítulos, `ThreeArtifact` detecta clics con raycasting y `useProgress` gestiona evidencias locales y sincronización opcional con Firebase.

Los archivos JSON permanecen como JSON válido, sin comentarios insertados:

- `package.json`: dependencias y scripts `dev`, `build`, `start` y `lint`.
- `package-lock.json`: versiones e integridad de dependencias generadas por npm; no se edita a mano.
- `jsconfig.json`: define `@/*` como alias de archivos desde la raíz del proyecto.

El proyecto parte del material académico [maimo-2026-nextjs-threejs-experimental](https://github.com/lamaro/maimo-2026-nextjs-threejs-experimental). Se conserva su historial y el código original junto al explorador Backrooms.
