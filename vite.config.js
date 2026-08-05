import { defineConfig } from 'vite';

export default defineConfig({
  // Relative base so the built site works from a repo subpath
  // (e.g. username.github.io/portfolio/) as well as from a domain root.
  base: './',
  server: {
    open: true,
  },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 0,
  },
});
