import fs from "node:fs";
import path from "node:path";
import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";

/**
 * `virtual:events-index` – a slim copy of every event (what the map, lists and filters need),
 * built from src/data/events/*.json. Full texts (summaries, sources, notes) stay in the
 * per-year JSON files, which the app loads on demand.
 */
function eventsIndex(): Plugin {
  const id = "virtual:events-index";
  const resolved = "\0" + id;
  const keep = ["id", "title", "startDate", "endDate", "datePrecision", "location", "type", "verified", "significanceRank"];
  return {
    name: "events-index",
    resolveId: (source) => (source === id ? resolved : undefined),
    load(loadId) {
      if (loadId !== resolved) return;
      const dir = path.resolve(process.cwd(), "src/data/events");
      const out: Record<string, unknown>[] = [];
      for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".json")).sort()) {
        this.addWatchFile(path.join(dir, f));
        for (const e of JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")) as Record<string, unknown>[]) {
          out.push(Object.fromEntries(keep.filter((k) => k in e).map((k) => [k, e[k]])));
        }
      }
      return `export default JSON.parse(${JSON.stringify(JSON.stringify(out))});`;
    },
  };
}

// `vite build` produces the normal static site. `vite build --mode portable` inlines all
// JS/CSS into one HTML file that can be opened straight from disk (file://).
// The relative base lets the static build work from any GitHub Pages sub-path.
export default defineConfig(({ mode }) => ({
  base: "./",
  plugins: mode === "portable" ? [react(), eventsIndex(), viteSingleFile()] : [react(), eventsIndex()],
  build: mode === "portable" ? { outDir: "dist-portable" } : {},
}));
