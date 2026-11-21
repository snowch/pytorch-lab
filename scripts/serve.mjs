import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { extname, resolve, sep } from "node:path";

const root = resolve("dist");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".wasm": "application/wasm",
  ".json": "application/json",
  ".ipynb": "application/json",
  ".txt": "text/plain; charset=utf-8",
  ".py": "text/plain; charset=utf-8",
};
createServer(async (request, response) => {
  try {
    const pathname = new URL(request.url, "http://localhost").pathname;
    const relative = decodeURIComponent(pathname).replace(/^\/pytorch-lab(?=\/|$)/, "");
    const file = resolve(root, `.${relative.endsWith("/") || !relative ? relative + "index.html" : relative}`);
    if (!file.startsWith(root + sep) || !(await stat(file)).isFile()) throw new Error("Missing file");
    response.writeHead(200, { "Content-Type": mime[extname(file)] ?? "application/octet-stream" });
    const stream = createReadStream(file);
    stream.on("error", () => response.destroy());
    stream.pipe(response);
  } catch {
    response.writeHead(404).end("File not found. Run npm run build before starting the server.");
  }
}).listen(port, "0.0.0.0", () => console.log(`PyTorch Lab at http://localhost:${port}/`));
