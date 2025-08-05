import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  
  // Build optimization for Vercel deployment
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          supabase: ['@supabase/supabase-js'],
          ui: ['lucide-react', 'react-router-dom']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  },

  // Development server
  server: {
    port: 3000,
    host: true,
    strictPort: false
  },

  // Preview server
  preview: {
    port: 3000,
    host: true
  },

  // Path resolution
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "client/src"),
      "@shared": path.resolve(__dirname, "shared"),
      "@/components": path.resolve(__dirname, "client/src/components"),
      "@/pages": path.resolve(__dirname, "client/src/pages"),
      "@/lib": path.resolve(__dirname, "client/src/lib"),
      "@/hooks": path.resolve(__dirname, "client/src/hooks"),
      "@/types": path.resolve(__dirname, "client/src/types"),
      "@/utils": path.resolve(__dirname, "client/src/utils")
    }
  },

  // Root directory for client app
  root: "./client",

  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
  },

  // Optimize dependencies
  optimizeDeps: {
    include: [
      'react',
      'react-dom', 
      '@supabase/supabase-js',
      'react-router-dom',
      'lucide-react'
    ]
  }
});
