import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
    },
  },
  envDir: path.resolve(import.meta.dirname),
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist"),
    emptyOutDir: true,
    // Target modern browsers for better code splitting
    target: "esnext",
    // Enable source maps in dev, disable in production for faster builds
    sourcemap: process.env.NODE_ENV !== "production",
    // Manual chunks for better caching and parallel loading
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk — third-party libs change less often
          vendor: ["react", "react-dom", "wouter", "lucide-react"],
          // UI components — shadcn/ui primitives
          ui: [
            "@/components/ui/button",
            "@/components/ui/card",
            "@/components/ui/badge",
            "@/components/ui/skeleton",
            "@/components/ui/separator",
            "@/components/ui/progress",
            "@/components/ui/table",
            "@/components/ui/input",
            "@/components/ui/select",
            "@/components/ui/tabs",
            "@/components/ui/sheet",
            "@/components/ui/dropdown-menu",
            "@/components/ui/avatar",
            "@/components/ui/tooltip",
          ],
          // Charts — heavy library, loaded only on marketplace
          charts: ["recharts"],
          // API layer — shared by all pages
          api: ["@/lib/api"],
          // Contexts — auth, language, theme
          contexts: [
            "@/contexts/AuthContext",
            "@/contexts/LanguageContext",
            "@/contexts/ThemeContext",
          ],
        },
        // Hash only content changes, not build order
        chunkFileNames: "assets/[name]-[hash].js",
        entryFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash].[ext]",
      },
    },
    // Report bundle sizes for analysis
    reportCompressedSize: true,
    // Increase chunk size warning limit
    chunkSizeWarningLimit: 1000,
  },
  // Enable esbuild for faster builds in development
  esbuild: {
    // Drop console.logs in production
    drop: process.env.NODE_ENV === "production" ? ["console", "debugger"] : [],
    // Legal comments about licensing
    legalComments: "eof",
  },
  // Optimize dependencies pre-bundling
  optimizeDeps: {
    include: ["react", "react-dom", "wouter", "lucide-react"],
    exclude: ["@/components/ui/*"],
  },
  server: {
    port: 3000,
    strictPort: false, // will find next available if 3000 busy
    host: true,
    proxy: {
      "/api": "http://localhost:8000",
    },
    allowedHosts: ["localhost", "127.0.0.1"],
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
});
