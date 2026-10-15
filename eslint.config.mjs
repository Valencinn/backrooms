/**
 * Reglas estáticas de Next.js y React. Las carpetas generadas se excluyen
 * porque contienen resultados de compilación, no código fuente editable.
 */
import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";

export default defineConfig([
  ...nextVitals,
  globalIgnores([".next/**", "out/**", "build/**"]),
]);
