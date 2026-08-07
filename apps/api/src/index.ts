/**
 * BFF stub — auth, tenants, canvas metadata land in Slice 2.
 * Slice 1 is offline-first in the browser; this process is optional.
 */

import { createServer } from "node:http";

const port = Number(process.env.PORT ?? 8787);

const server = createServer((req, res) => {
  if (req.url === "/health" || req.url === "/api/health") {
    res.writeHead(200, { "content-type": "application/json" });
    res.end(
      JSON.stringify({
        ok: true,
        service: "@rkc/api",
        slice: 1,
        message: "BFF scaffold — multiplayer endpoints arrive in Slice 2",
      }),
    );
    return;
  }
  res.writeHead(404, { "content-type": "application/json" });
  res.end(JSON.stringify({ error: "not_found" }));
});

server.listen(port, () => {
  console.log(`@rkc/api listening on http://localhost:${port}`);
});
