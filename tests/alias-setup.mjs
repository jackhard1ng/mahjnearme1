/** Registers the "@/*" alias resolver for Node's test runner. */
import { register } from "node:module";
register("./alias-hooks.mjs", import.meta.url);
