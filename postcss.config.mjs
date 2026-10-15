/**
 * PostCSS transforma los estilos al compilar. El plugin Tailwind 4 resuelve
 * @import "tailwindcss" y genera las clases de utilidades usadas en el JSX.
 */
const config = {
  plugins: { "@tailwindcss/postcss": {} },
};

export default config;
