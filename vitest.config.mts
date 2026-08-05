import { defineConfig } from "vitest/config";

// ponytail: resolucion nativa de los paths del tsconfig, sin plugin.
export default defineConfig({ resolve: { tsconfigPaths: true } });
