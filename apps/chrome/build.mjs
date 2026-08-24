// Chrome build → /extension, the folder users load unpacked and the folder
// zipped for the Chrome Web Store. Never edit /extension .js files by hand.
import { buildExtension } from "@voxylio/build-tools";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

await buildExtension({
  srcDir: join(here, "src"),
  staticDir: join(here, "static"),
  outDir: join(here, "..", "..", "extension"),
  target: "chrome120",
});
console.log("Chrome extension built into /extension");
