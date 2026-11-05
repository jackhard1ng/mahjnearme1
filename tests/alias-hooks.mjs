/**
 * Resolve the project's "@/*" TypeScript path alias for Node's test runner.
 *
 * The app is built by Next.js, which understands the `paths` mapping in
 * tsconfig.json. Node does not, so importing any src/ module that uses `@/`
 * fails with ERR_MODULE_NOT_FOUND. This hook maps `@/x` to `<repo>/src/x`,
 * adding a `.ts` extension when the bare specifier has none (the alias is
 * written extensionless in app code, and Node's resolver requires one).
 *
 * Registered via `--import ./tests/alias-setup.mjs` in the `test` script.
 * Zero dependencies: `module.register` and type stripping are both built in.
 */
import { statSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const SRC = path.resolve(import.meta.dirname, "..", "src");

export async function resolve(specifier, context, next) {
  if (specifier.startsWith("@/")) {
    const rel = specifier.slice(2);
    // Order matters: an exact file wins, then an extension is added, then a
    // directory's index. `@/types` is a directory containing index.ts, and
    // Node refuses a bare directory import, so each candidate must be
    // confirmed to be a FILE rather than merely to exist.
    const candidates = [
      path.join(SRC, rel),
      path.join(SRC, `${rel}.ts`),
      path.join(SRC, `${rel}.tsx`),
      path.join(SRC, rel, "index.ts"),
      path.join(SRC, rel, "index.tsx"),
    ];
    const isFile = (p) => {
      try {
        return statSync(p).isFile();
      } catch {
        return false;
      }
    };
    const hit = candidates.find(isFile);
    if (hit) {
      return next(pathToFileURL(hit).href, context);
    }
  }
  return next(specifier, context);
}
