import { defineConfig } from "vite";
import solidPlugin from "vite-plugin-solid";
import bundledEntryPlugin from "vite-plugin-bundled-entry";

export default defineConfig({
  plugins: [
    solidPlugin(),
    bundledEntryPlugin({
      id: "service-worker",
      outFile: "/sw.[hash].js",
      entryPoint: "src/sw/index.ts",
      esbuildOptions: {
        minify: process.env.NODE_ENV === 'production',
        format: 'iife'
      }
    })
  ],
  build: {
    target: "esnext",
    polyfillDynamicImport: false,
  },
});
