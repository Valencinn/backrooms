/**
 * Layout compartido: importa estilos globales una sola vez y declara
 * el idioma HTML y la metadata predeterminada de todas las rutas.
 */
import "./globals.css";

export const metadata = {
  title: "THE BACKROOMS",
  description:
    "Una computadora encendida en la oscuridad. Tres espacios liminales originales que responden a tus acciones. Una experiencia 3D con estética VHS.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}
