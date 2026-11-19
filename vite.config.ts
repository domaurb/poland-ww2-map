import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

// `vite build` produces the normal static site. `vite build --mode portable` inlines all
// JS/CSS into one HTML file that can be opened straight from disk (file://).
// The relative base lets the static build work from any GitHub Pages sub-path.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "portable" ? [react(), viteSingleFile()] : [react()],
  build: mode === "portable" ? { outDir: "dist-portable" } : {},
}));
