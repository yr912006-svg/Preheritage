import { registerHooks } from "node:module";
import { existsSync } from "node:fs";
import { dirname, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceRoot = resolve(projectRoot, "src");
const extensions = [".ts", ".tsx", ".js", ".mjs", ".json"];

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/server") return nextResolve("next/server.js", context);
    const alias = specifier.startsWith("@/");
    if (!alias && !specifier.startsWith(".") && !specifier.startsWith("/")) {
      return nextResolve(specifier, context);
    }

    const base = alias
      ? resolve(sourceRoot, specifier.slice(2))
      : resolve(dirname(fileURLToPath(context.parentURL)), specifier);
    const candidates = extname(base) ? [base] : extensions.map((extension) => `${base}${extension}`);
    const found = candidates.find((candidate) => existsSync(candidate));
    if (found) return { url: pathToFileURL(found).href, shortCircuit: true };
    return nextResolve(specifier, context);
  },
});
