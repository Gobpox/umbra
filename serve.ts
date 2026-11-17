// Tiny static server for local playtests: node serve.ts [port]
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { extname, join, normalize } from "node:path";

const root = join(process.cwd(), "game");
const port = Number(process.argv[2] ?? 8081);
const types: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
};

createServer(async (req, res) => {
  try {
    let path = decodeURIComponent(new URL(req.url ?? "/", "http://x").pathname);
    if (path === "/") path = "/index.html";
    const file = normalize(join(root, path));
    if (!file.startsWith(root)) throw new Error("outside root");
    const data = await readFile(file);
    res.writeHead(200, { "content-type": types[extname(file)] ?? "application/octet-stream" });
    res.end(data);
  } catch {
    res.writeHead(404, { "content-type": "text/plain" });
    res.end("not found");
  }
}).listen(port, () => console.log(`umbra dev server on http://localhost:${port}`));
