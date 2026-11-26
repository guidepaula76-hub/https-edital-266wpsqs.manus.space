import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = path.resolve("dist/public");
const assets = fs.readdirSync(path.join(root, "assets"))
  .filter(name => /\.(js|css|woff2?|png|webp|svg)$/.test(name))
  .sort()
  .map(name => "/assets/" + name);
const file = path.join(root, "sw.js");
let source = fs.readFileSync(file, "utf8");
const hash = crypto.createHash("sha256").update(assets.join("|"))
  .update(source).update(fs.readFileSync(path.join(root, "manifest.json")));
for (const name of fs.readdirSync(path.join(root, "icons")).sort()) {
  hash.update(fs.readFileSync(path.join(root, "icons", name)));
}
const version = hash.digest("hex").slice(0, 12);
source = source.replace(/(["'])ultra-static-v1\1/, `"ultra-static-${version}"`)
  .replace("const PRECACHE = [];", `const PRECACHE = ${JSON.stringify(assets)};`);
if (source.includes("const PRECACHE = [];") || source.includes("ultra-static-v1")) {
  throw new Error("PWA precache generation failed; template markers are missing.");
}
fs.writeFileSync(file, source);
console.log(`PWA precache: ${assets.length} app assets, version ${version}`);
