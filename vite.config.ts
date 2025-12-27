import fs from "fs";
import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite";

// AudioWorklet processor files - single source of truth
const WORKLET_PROCESSORS = ["divide-processor", "math-processors"] as const;

// Strip TypeScript syntax for dev serving
function stripTypeScript(content: string): string {
  return content
    .replace(/\/\/\/\s*<reference.*?\/>/g, "") // Remove triple-slash directives
    .replace(/^\s*(private|public|protected)\s+\w+\s*:\s*\w+(\[\])*\s*;?\s*$/gm, "") // Remove class property declarations
    .replace(/:\s*Float32Array\[\]\[\]/g, "") // Remove type annotations
    .replace(/:\s*\w+(\[\])*(\s*\|\s*\w+(\[\])*)*(?=\s*[,)={])/g, "") // Remove other type annotations
    .replace(/\s+as\s+unknown\s+as\s+\{[^}]+\}/g, ""); // Remove type assertions like "as unknown as { prop: type }"
}

// Plugin to serve AudioWorklet processors during development
// In production, these are bundled via rollupOptions.input
function audioWorkletPlugin(): Plugin {
  return {
    name: "audio-worklet-dev",
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        for (const processor of WORKLET_PROCESSORS) {
          if (req.url === `/${processor}.js`) {
            const tsPath = path.resolve(__dirname, `src/engine/${processor}.ts`);
            const tsContent = fs.readFileSync(tsPath, "utf-8");
            const jsContent = stripTypeScript(tsContent);
            res.setHeader("Content-Type", "application/javascript");
            res.end(jsContent);
            return;
          }
        }
        next();
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig({
  base: "/",
  plugins: [react(), tailwindcss(), audioWorkletPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        ...Object.fromEntries(
          WORKLET_PROCESSORS.map((p) => [p, path.resolve(__dirname, `src/engine/${p}.ts`)])
        ),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Output AudioWorklet processors directly to root, not in assets/
          if (WORKLET_PROCESSORS.includes(chunkInfo.name as typeof WORKLET_PROCESSORS[number])) {
            return `${chunkInfo.name}.js`;
          }
          return "assets/[name]-[hash].js";
        },
        manualChunks: (id) => {
          // React core and related libraries
          if (
            id.includes("node_modules/react") ||
            id.includes("node_modules/react-dom")
          ) {
            return "react-vendor";
          }
          // ReactFlow and its dependencies
          if (
            id.includes("node_modules/@xyflow") ||
            id.includes("node_modules/@reactflow")
          ) {
            return "reactflow-vendor";
          }
          // State management
          if (id.includes("node_modules/zustand")) {
            return "state-vendor";
          }
          // UI component libraries
          if (
            id.includes("node_modules/lucide-react") ||
            id.includes("node_modules/@radix-ui")
          ) {
            return "ui-vendor";
          }
        },
      },
    },
  },
});
