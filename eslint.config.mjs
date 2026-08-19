import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "UIpadel/**",
    // Worktrees que crea Claude Code: son copias del repo, se lintean solas
    // cuando corresponde. Sin esto el lint del repo falla por codigo que no es
    // del repo (y "UIpadel/**" no las alcanza: solo matchea en la raiz).
    ".claude/worktrees/**",
  ]),
]);

export default eslintConfig;
