import { cp, mkdir, rm } from "node:fs/promises";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "assets", "products");
const destination = path.join(root, "client", "public", "assets", "products");

await rm(destination, { recursive: true, force: true });
await mkdir(destination, { recursive: true });
await cp(source, destination, { recursive: true, force: true });
console.log(`Synchronized product assets: ${path.relative(root, source)} → ${path.relative(root, destination)}`);
