import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
    proxy: {
      "/agent-directives": { target: "http://localhost:8002", changeOrigin: true },
      "/strategy-registry": { target: "http://localhost:8002", changeOrigin: true },
      "/bots": { target: "http://localhost:8002", changeOrigin: true },
      "/freqtrade": { target: "http://localhost:8002", changeOrigin: true },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    minify: "esbuild",
    cssMinify: "esbuild",
    cssCodeSplit: true,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/react-dom")) return "vendor-react";
          if (id.includes("node_modules/react/")) return "vendor-react";
          if (id.includes("node_modules/react-router")) return "vendor-router";
          if (id.includes("node_modules/@supabase/realtime-js")) return "vendor-supabase-realtime";
          if (id.includes("node_modules/@supabase/postgrest-js")) return "vendor-supabase-rest";
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@radix-ui")) return "vendor-radix";
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/lucide-react")) return "vendor-icons";
          if (id.includes("node_modules/zod")) return "vendor-utils";
          if (id.includes("node_modules/class-variance-authority") || id.includes("node_modules/clsx") || id.includes("node_modules/tailwind-merge")) return "vendor-utils";
          if (id.includes("node_modules/sonner") || id.includes("node_modules/cmdk")) return "vendor-ui";
        },
      },
    },
    chunkSizeWarningLimit: 250,
  },
}));
