"""Builds src/data/borders.json from OpenHistoricalMap (CC0) boundary relations.

Run: python3 scripts/build-borders.py   (needs `shapely`; queries overpass-api.openhistoricalmap.org)
Each layer is a set of boundary lines clipped to the map area and simplified for the web.
"""
import json, subprocess, sys
from shapely.geometry import LineString, MultiLineString, box, mapping
from shapely.ops import linemerge

BBOX = (13.0, 47.0, 29.5, 57.0)   # lon/lat, a little larger than the map's maxBounds
TOL = 0.004                      # ~300–450 m
LAYERS = [
  # id, relation, valid from, valid to (inclusive), en, pl
  ("poland-1939", 2741574, None, None, "Poland's borders on 31 August 1939", "Granice Polski z 31 sierpnia 1939 r."),
  ("poland-today", 2870169, None, None, "Present-day borders of Poland", "Współczesne granice Polski"),
  ("gg-1939", 2693083, "1939-10-26", "1941-07-31", "General Government", "Generalne Gubernatorstwo"),
  ("gg-1941", 2693084, "1941-08-01", "1945-01-19", "General Government (with District of Galicia)", "Generalne Gubernatorstwo (z Dystryktem Galicja)"),
  ("ussr-1939a", 2848248, "1939-10-06", "1939-10-27", "Soviet border", "Granica ZSRS"),
  ("ussr-1939b", 2848241, "1939-10-28", "1940-03-11", "Soviet border", "Granica ZSRS"),
  ("ussr-1940a", 2851878, "1940-03-12", "1940-06-27", "Soviet border", "Granica ZSRS"),
  ("ussr-1940b", 2848258, "1940-06-28", "1940-08-02", "Soviet border", "Granica ZSRS"),
  ("ussr-1940c", 2848812, "1940-08-03", "1941-06-21", "Soviet border", "Granica ZSRS"),
]
URL = "https://overpass-api.openhistoricalmap.org/api/interpreter"
def fetch(rel):
    s, w, n, e = BBOX[1], BBOX[0], BBOX[3], BBOX[2]
    q = f"[out:json][timeout:120];relation({rel});way(r)({s},{w},{n},{e});out geom;"
    out = subprocess.run(["curl", "-sS", "-m", "180", "--data-urlencode", f"data={q}", URL], capture_output=True, text=True, check=True).stdout
    return json.loads(out)["elements"]
clip = box(*BBOX)
out = {"_attribution": "Boundaries from OpenHistoricalMap contributors (CC0 1.0, https://www.openhistoricalmap.org), clipped and simplified.", "layers": []}
for lid, rel, vf, vt, en, pl in LAYERS:
    ways = fetch(rel)
    lines = [LineString([(p["lon"], p["lat"]) for p in w["geometry"]]) for w in ways if len(w.get("geometry", [])) > 1]
    if not lines:
        sys.exit(f"no geometry for {lid}")
    geom = linemerge(MultiLineString(lines)).intersection(clip).simplify(TOL, preserve_topology=False)
    g = mapping(geom)
    def rnd(c):
        return [rnd(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], 4), round(c[1], 4)]
    g = {"type": g["type"], "coordinates": rnd(g["coordinates"])}
    out["layers"].append({"id": lid, "relation": rel, "validFrom": vf, "validTo": vt, "name": {"en": en, "pl": pl}, "geometry": g})
    print(lid, len(ways), "ways", g["type"])
json.dump(out, open("src/data/borders.json", "w"), separators=(",", ":"))
print("written")
