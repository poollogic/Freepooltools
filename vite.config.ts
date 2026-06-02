import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  // Production-only hardening (Vite's dev `serve` ignores these): drop
  // console.*/debugger so dev noise doesn't leak to visitors, and strip
  // license comments to shave bytes.
  esbuild: {
    drop: ['console', 'debugger'],
    legalComments: 'none',
  },
  build: {
    rollupOptions: {
      output: {
        // Group big shared deps into stable chunks so the browser fetches a
        // few well-sized files instead of dozens of micro-chunks (each tiny
        // chunk costs a mobile round-trip). Ignored for the SSR build.
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return undefined;
          if (id.includes('react-router')) return 'router';
          if (id.includes('/react-dom/') || id.includes('/react/')) return 'react';
          if (id.includes('/motion/')) return 'motion';
          if (id.includes('/lucide-react/')) return 'icons';
          return undefined;
        },
      },
    },
  },
  // SSR build bundles src/entry-server.tsx for Node so scripts/prerender.mjs
  // can import it. noExternal: true inlines all deps into the server bundle,
  // avoiding ESM resolution issues when the script imports dist-ssr at build time.
  ssr: {
    noExternal: true,
  },
});
