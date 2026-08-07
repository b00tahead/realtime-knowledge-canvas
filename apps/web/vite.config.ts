import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@rkc/object-model": path.resolve(
        __dirname,
        "../../packages/object-model/src/index.ts",
      ),
      "@rkc/canvas-engine": path.resolve(
        __dirname,
        "../../packages/canvas-engine/src/index.ts",
      ),
      "@rkc/design-system/tokens.css": path.resolve(
        __dirname,
        "../../packages/design-system/src/tokens.css",
      ),
      "@rkc/design-system": path.resolve(
        __dirname,
        "../../packages/design-system/src/index.ts",
      ),
      "@rkc/offline": path.resolve(
        __dirname,
        "../../packages/offline/src/index.ts",
      ),
      "@rkc/sync-protocol": path.resolve(
        __dirname,
        "../../packages/sync-protocol/src/index.ts",
      ),
    },
  },
  server: {
    port: 5173,
  },
});
