import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig({
  base: "/signals/",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, "index.html"),
        "divide-processor": path.resolve(__dirname, "src/engine/divide-processor.ts"),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // Output divide-processor directly to root, not in assets/
          if (chunkInfo.name === "divide-processor") {
            return "divide-processor.js";
          }
          return "assets/[name]-[hash].js";
        },
        manualChunks: (id) => {
          // React core and related libraries
          if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
            return "react-vendor";
          }
          // ReactFlow and its dependencies
          if (id.includes("node_modules/@xyflow") || id.includes("node_modules/@reactflow")) {
            return "reactflow-vendor";
          }
          // State management
          if (id.includes("node_modules/zustand")) {
            return "state-vendor";
          }
          // UI component libraries
          if (id.includes("node_modules/lucide-react") || id.includes("node_modules/@radix-ui")) {
            return "ui-vendor";
          }
        },
      },
    },
  },
});
