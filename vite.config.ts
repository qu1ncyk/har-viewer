import { defineConfig, Plugin } from "vite";
import solidPlugin from "vite-plugin-solid";
import * as esbuild from "esbuild";
import * as vite from "vite";
import path from "node:path";

/**
 * Bundle the service worker into `sw.js` for production when the main bundle
 * is finished.
 */
function bundleSw(): Plugin {
  return {
    name: "Bundle SW",
    closeBundle() {
      vite.build({
        mode: "production",
        publicDir: false,
        build: {
          emptyOutDir: false,
          rollupOptions: {
            input: "src/sw/index.ts",
            output: {
              entryFileNames: "sw.js",
            },
          },
        },
        configFile: false,
      });
    },
  };
}

/**
 * Bundle the service worker into `sw.js` for development when the file is
 * requested by the browser.
 */
async function bundleSwDev(): Promise<Plugin> {
  const ctx = await esbuild.context({
    entryPoints: ["src/sw/index.ts"],
    outfile: "dist/sw.js",
    bundle: true,
  });

  return {
    name: "Bundle SW (dev)",
    async resolveId(name) {
      if (name !== "/sw.js") return;
      await ctx.rebuild();
      return path.resolve("dist/sw.js");
    },
  };
}

export default defineConfig((config) => ({
  plugins: [
    solidPlugin(),
    config.mode === "production" ? bundleSw() : bundleSwDev(),
  ],
  build: {
    target: "esnext",
  },
}));
