import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // 逐步迁移策略: 先警告,未来改为 error
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Local artifacts and utility scripts we don't lint:
    ".claude/**",
    "chrome/**",
    "scripts/**",
    "screenshot*.js",
    "test-api.js",
    "helicone_test.js",
  ]),
]);

export default eslintConfig;
