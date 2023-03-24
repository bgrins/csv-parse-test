import { defineConfig } from 'vite';
export default defineConfig({
  build: {
    outDir: 'docs',
    modulePreload: { polyfill: false },
    minify: false,
  },
});
