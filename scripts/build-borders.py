"""Builds src/data/borders.json from OpenHistoricalMap (CC0) boundary relations.

Run: python3 scripts/build-borders.py   (needs `shapely`; queries overpass-api.openhistoricalmap.org)

Output:
- `layers`: boundary lines (Poland 1939, present-day Poland, General Government) clipped to the map area.
- `zones`: the parts of Poland's 31 August 1939 territory under German and under Soviet control, per period,
  derived by splitting the 1939 territory along the occupiers' boundaries. Periods follow the start/end dates
  of the OpenHistoricalMap relations; Wilno, handed to Lithuania on 28 October 1939, is in neither zone until
  the Soviet annexation of Lithuania.
- `frontCells`: from 4 January 1944, an approximation of the front built from dated anchor towns
  (scripts/front-anchors.json, geocoded with OpenStreetMap Nominatim and cached in front-anchors.geo.json).
"""
import json, math, os, subprocess, sys, time, urllib.parse
from shapely.affinity import scale
from shapely.geometry import LineString, MultiLineString, MultiPoint, Point, box, mapping
from shapely.ops import linemerge, polygonize, unary_union, voronoi_diagram

BBOX = (13.0, 47.0, 29.5, 57.0)   # lon/lat, a little larger than the map's maxBounds
TOL = 0.004                      # ~300–450 m
URL = "https://overpass-api.openhistoricalmap.org/api/interpreter"
POLAND_1939, POLAND_TODAY = 2741574, 2870169
GG_1939, GG_1941 = 2693083, 2693084
REICH_1939 = 2704716             # Deutsches Reich 1939-10-26 → 1940-05-18 (later 1940–41 changes lie outside the map area)
BERLIN, MINSK = Point(13.40, 52.52), Point(27.56, 53.90)

_cache = {}
def lines(rel):
    if rel not in _cache:
        s, w, n, e = BBOX[1], BBOX[0], BBOX[3], BBOX[2]
        q = f"[out:json][timeout:120];relation({rel});way(r)({s},{w},{n},{e});out geom;"
        for attempt in range(5):   # the public server rate-limits; back off and retry
            out = subprocess.run(["curl", "-sS", "-m", "180", "--data-urlencode", f"data={q}", URL], capture_output=True, text=True).stdout
            try:
                ways = json.loads(out)["elements"]
                break
            except (json.JSONDecodeError, KeyError):
                time.sleep(15 * (attempt + 1))
        else:
            sys.exit(f"could not fetch relation {rel}")
        ls = [LineString([(p["lon"], p["lat"]) for p in w["geometry"]]) for w in ways if len(w.get("geometry", [])) > 1]
        if not ls:
            sys.exit(f"no geometry for relation {rel}")
        _cache[rel] = linemerge(MultiLineString(ls))
    return _cache[rel]

frame = box(*BBOX)
def area_containing(rel, point):
    """The face of (relation boundary ∪ map frame) that contains `point` – i.e. the relation's territory within the frame."""
    faces = list(polygonize(unary_union([lines(rel).intersection(frame), frame.boundary])))
    hit = [f for f in faces if f.contains(point)]
    if not hit:
        sys.exit(f"reference point not inside relation {rel}")
    return hit[0]
def polygon_of(rel):
    """A relation lying wholly inside the frame (Poland 1939, General Government) as a polygon."""
    return unary_union(list(polygonize(unary_union(lines(rel)))))

def rnd(c):
    return [rnd(x) for x in c] if isinstance(c[0], (list, tuple)) else [round(c[0], 4), round(c[1], 4)]
def geo(g, simplify=True):
    m = mapping(g.simplify(TOL, preserve_topology=True) if simplify else g)
    return {"type": m["type"], "coordinates": rnd(m["coordinates"])}

out = {"_attribution": "Boundaries from OpenHistoricalMap contributors (CC0 1.0, https://www.openhistoricalmap.org), clipped and simplified.", "layers": [], "zones": []}
for lid, rel, vf, vt in [("poland-1939", POLAND_1939, None, None), ("poland-today", POLAND_TODAY, None, None),
                         ("gg-1939", GG_1939, "1939-10-26", "1941-07-31"), ("gg-1941", GG_1941, "1941-08-01", "1945-01-19")]:
    out["layers"].append({"id": lid, "relation": rel, "validFrom": vf, "validTo": vt, "geometry": geo(lines(rel).intersection(frame))})
    print("line", lid)

poland = polygon_of(POLAND_1939).buffer(0)
reich = area_containing(REICH_1939, BERLIN)
gg39 = polygon_of(GG_1939).buffer(0)
# (soviet relation, valid from, valid to, how the German zone is defined)
PERIODS = [
  (2848248, "1939-10-06", "1939-10-25", "rest"),   # before the annexation decree took effect: the rest of 1939 Poland
  (2848248, "1939-10-26", "1939-10-27", "reich+gg"),
  (2848241, "1939-10-28", "1940-03-11", "reich+gg"),
  (2851878, "1940-03-12", "1940-06-27", "reich+gg"),
  (2848258, "1940-06-28", "1940-08-02", "reich+gg"),
  (2848812, "1940-08-03", "1941-06-21", "reich+gg"),
]
for rel, vf, vt, how in PERIODS:
    soviet = poland.intersection(area_containing(rel, MINSK)).buffer(0)
    german = poland.difference(soviet) if how == "rest" else poland.intersection(unary_union([reich, gg39])).difference(soviet)
    german = german.buffer(0)
    out["zones"].append({"power": "soviet", "relation": rel, "validFrom": vf, "validTo": vt, "geometry": geo(soviet)})
    # The Soviet zone's edge inside 1939 Poland (the demarcation line, and Wilno's border while it was Lithuanian).
    edge = soviet.boundary.difference(poland.boundary.buffer(0.02))
    out["layers"].append({"id": f"soviet-edge-{vf}", "validFrom": vf, "validTo": vt, "geometry": geo(edge)})
    out["zones"].append({"power": "german", "validFrom": vf, "validTo": vt, "geometry": geo(german)})
    print("zones", vf, vt, f"soviet {soviet.area:.2f}", f"german {german.area:.2f}", f"poland {poland.area:.2f}")
# After the German attack on the USSR the whole 1939 territory came under German control, until Soviet forces
# re-entered pre-war Polish territory near Sarny in the night of 3–4 January 1944 (dzieje.pl historical calendar,
# 3 and 4 January).
out["zones"].append({"power": "german", "validFrom": "1941-06-22", "validTo": "1944-01-03", "geometry": geo(poland)})

# 4 January 1944 – 8 May 1945: no open data on the front lines exists, so control is approximated from dated anchor
# towns (scripts/front-anchors.json). Each point of 1939 Poland belongs to its nearest anchor (a Voronoi cell, in a
# projection that keeps distances roughly true at 52°N) and is Soviet-held from that anchor's date. Pockets override
# the cells around them. The client tints each cell by comparing the selected date with the cell's date.
HERE = os.path.dirname(os.path.abspath(__file__))
anchors = json.load(open(os.path.join(HERE, "front-anchors.json")))["anchors"]
GEO_CACHE = os.path.join(HERE, "front-anchors.geo.json")
geo_cache = json.load(open(GEO_CACHE)) if os.path.exists(GEO_CACHE) else {}
def geocode(q):
    if q not in geo_cache:
        url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + urllib.parse.quote(q)
        res = json.loads(subprocess.run(["curl", "-sS", "-m", "60", "-A", "poland-ww2-map build script", url], capture_output=True, text=True).stdout)
        if not res:
            sys.exit(f"geocoding failed: {q}")
        geo_cache[q] = {"lat": round(float(res[0]["lat"]), 5), "lng": round(float(res[0]["lon"]), 5), "displayName": res[0]["display_name"]}
        time.sleep(1.1)   # Nominatim usage policy: at most one request per second
    return Point(geo_cache[q]["lng"], geo_cache[q]["lat"])
KX = math.cos(math.radians(52))
proj = lambda g: scale(g, xfact=KX, yfact=1, origin=(0, 0))
unproj = lambda g: scale(g, xfact=1 / KX, yfact=1, origin=(0, 0))
KM = 1 / 111.32   # degrees of latitude per km
HEL = ["Władysławowo, Poland", "Chałupy, gmina Władysławowo, Poland", "Kuźnica, gmina Jastarnia, Poland", "Jastarnia, Poland", "Jurata, Poland", "Hel, Poland"]
poland_s = poland.simplify(TOL, preserve_topology=True).buffer(0)
sites = [a for a in anchors if "radiusKm" not in a and "pocket" not in a]
pts = [proj(geocode(a["query"])) for a in sites]
vor = voronoi_diagram(MultiPoint(pts), envelope=proj(frame))
cells = []
for a, pt in zip(sites, pts):
    cell = next(c for c in vor.geoms if c.contains(pt))
    cells.append({"name": a["name"], "soviet": a["soviet"], "g": unproj(cell).intersection(poland_s)})
for a in anchors:
    if "radiusKm" in a:
        pocket = unproj(proj(geocode(a["query"])).buffer(a["radiusKm"] * KM, 32))
    elif a.get("pocket") == "hel":
        pocket = LineString([geocode(q) for q in HEL]).buffer(0.03)
    else:
        continue
    pocket = pocket.intersection(poland_s)
    for c in cells:
        c["g"] = c["g"].difference(pocket)
    cells.append({"name": a["name"], "soviet": a["soviet"], "g": pocket})
json.dump(geo_cache, open(GEO_CACHE, "w"), ensure_ascii=False, indent=1)
out["frontCells"] = {"validFrom": "1944-01-04", "validTo": None, "cells": [
    {"name": c["name"], "soviet": c["soviet"], "geometry": geo(c["g"].buffer(0), simplify=False)} for c in cells if not c["g"].is_empty]}
print("front cells:", len(out["frontCells"]["cells"]))
# Merge consecutive Soviet-edge layers whose lines are identical (changes outside Poland only).
merged = []
for l in out["layers"]:
    if merged and l["id"].startswith("soviet-edge") and merged[-1]["id"].startswith("soviet-edge") and merged[-1]["geometry"] == l["geometry"]:
        merged[-1]["validTo"] = l["validTo"]
    else:
        merged.append(l)
out["layers"] = merged
# Store each distinct zone shape once; zones refer to it by key.
shapes, keys = {}, {}
for z in out["zones"]:
    sig = json.dumps(z["geometry"], separators=(",", ":"))
    if sig not in keys:
        keys[sig] = f'{z["power"]}-{len([k for k in shapes if k.startswith(z["power"])]) + 1}'
        shapes[keys[sig]] = z["geometry"]
    z["shape"] = keys[sig]
    del z["geometry"]
out["shapes"] = shapes
json.dump(out, open("src/data/borders.json", "w"), separators=(",", ":"))
print("distinct zone shapes:", len(shapes))
print("written")
