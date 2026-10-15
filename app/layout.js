/**
 * Layout compartido: importa estilos globales una sola vez y declara
 * el idioma HTML y la metadata predeterminada de todas las rutas.
 */
import "./globals.css";

export const metadata = {
  title: "THE BACKROOMS — Archivo de lo imposible",
  description:
    "Un archivo interactivo de espacios liminales. Explorá tres niveles de los Backrooms en una experiencia 3D con estética VHS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
