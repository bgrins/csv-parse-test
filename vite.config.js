import { defineConfig } from 'vite';
export default defineConfig({
  base: "./",
  build: {
    outDir: 'docs',
    modulePreload: { polyfill: false },
    minify: false,
  },
});
