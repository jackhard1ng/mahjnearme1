import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({ baseDirectory: __dirname });

/**
 * ESLint was never configured on this project, so `next lint` only ever
 * offered to set it up and no rule has ever run over the codebase. This is
 * the standard Next.js flat config, using FlatCompat because
 * eslint-config-next still ships as an eslintrc-style shareable config.
 */
const eslintConfig = [
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "audit/**",
      "research/**",
    ],
  },
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    /**
     * Deliberate lazy `require()` calls, not oversights. Three separate
     * reasons, all of which a top-level import would break:
     *
     *   - Leaflet touches `window` at module scope, so importing it eagerly
     *     breaks server rendering. It is required inside effects and browser-
     *     only branches on purpose.
     *   - The listings data module pulls in a multi-megabyte JSON payload;
     *     requiring it inside the handlers that need it keeps it out of
     *     bundles that do not.
     *   - The remaining few defer a module until a request is being served,
     *     which is what keeps these route handlers cheap to cold-start.
     *
     * Scoped to the specific files rather than switched off globally, so a
     * casual `require()` anywhere else is still an error.
     */
    files: [
      "src/components/LeafletMap.tsx",
      "src/components/DestinationMap.tsx",
      "src/lib/listings-data.ts",
      "src/lib/listings-firestore.ts",
      "src/app/api/listings/route.ts",
      "src/app/api/digest/route.ts",
      // Bracketed segments are glob character classes, so the dynamic route
      // paths are matched with wildcards rather than written literally.
      "src/app/organizer/*/page.tsx",
      "src/app/states/*/page.tsx",
    ],
    rules: { "@typescript-eslint/no-require-imports": "off" },
  },
];

export default eslintConfig;
