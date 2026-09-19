import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores(["dist/**"]),
  // This is a library, not an app: there is no pages directory.
  { rules: { "@next/next/no-html-link-for-pages": "off" } },
  // Vendored shadcn/Plate registry code: we own it, but keep it close to upstream.
  {
    files: ["src/components/ui/**", "src/components/editor/**", "src/hooks/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "@next/next/no-img-element": "off",
      "react/display-name": "off",
    },
  },
]);
