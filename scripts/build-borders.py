"""Builds src/data/borders.json from OpenHistoricalMap (CC0) boundary relations.

Run: python3 scripts/build-borders.py   (needs `shapely`; queries overpass-api.openhistoricalmap.org)

Output:
- `layers`: boundary lines (Poland 1939, present-day Poland, General Government) clipped to the map area.
- `zones`: the parts of Poland's 31 August 1939 territory under German and under Soviet control, per period,
  derived by splitting the 1939 territory along the occupiers' boundaries. Periods follow the start/end dates
  of the OpenHistoricalMap relations; Wilno, handed to Lithuania on 28 October 1939, is in neither zone until
  the Soviet annexation of Lithuania.
- `neighbours-1939` layer and `scope: "state"` zones: the land borders between Poland's neighbours on 31 August 1939,
  and the territory of the German Reich and the Soviet Union outside 1939 Poland on each date.
- `occupationCells`: from 22 June 1941, German and Romanian control of Soviet territory, approximated from dated
  anchor towns (scripts/soviet-occupation-anchors.json).
- `reichCells`: from October 1944, capture of German Reich territory outside 1939 Poland by the Red Army or the
  Western Allies
  (scripts/reich-capture-anchors.json).
- `westCells`: from April 1940, German occupation and Allied liberation of Western Europe
  (scripts/west-occupation-anchors.json).
- `frontCells`: from 4 January 1944, an approximation of the front built from dated anchor towns
  (scripts/front-anchors.json, geocoded with OpenStreetMap Nominatim and cached in front-anchors.geo.json).
"""
import json, math, os, subprocess, sys, time, urllib.parse
from datetime import date, timedelta
from shapely.affinity import scale
from shapely.geometry import LineString, MultiLineString, MultiPoint, Point, Polygon, box, mapping
from shapely.ops import linemerge, polygonize, unary_union, voronoi_diagram

BBOX = (13.0, 47.0, 29.5, 57.0)   # lon/lat: Poland and its surroundings
WIDE = (-25.0, 28.0, 70.0, 72.0)  # lon/lat: wider than a fully zoomed-out view on a large screen, for the neighbouring states
TOL = 0.004                      # ~300–450 m
URL = "https://overpass-api.openhistoricalmap.org/api/interpreter"
POLAND_1939, POLAND_TODAY = 2741574, 2870169
GG_1939, GG_1941 = 2693083, 2693084
REICH_1939 = 2704716             # Deutsches Reich 1939-10-26 → 1940-05-18 (later 1940–41 changes lie outside the map area)
BERLIN, MINSK = Point(13.40, 52.52), Point(27.56, 53.90)

_cache, _ways = {}, {}
def lines(rel, bbox=BBOX):
    key = (rel, bbox)
    if key not in _cache:
        s, w, n, e = bbox[1], bbox[0], bbox[3], bbox[2]
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
        _ways[key] = {w["id"]: LineString([(p["lon"], p["lat"]) for p in w["geometry"]]) for w in ways if len(w.get("geometry", [])) > 1}
        ls = list(_ways[key].values())
        if not ls:
            sys.exit(f"no geometry for relation {rel}")
        _cache[key] = linemerge(MultiLineString(ls))
    return _cache[key]

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
def polys(g):
    """Only the polygonal parts of a geometry (intersections can leave stray lines or points)."""
    if g.geom_type in ("Polygon", "MultiPolygon"):
        return g.buffer(0)
    parts = [x for x in getattr(g, "geoms", []) if x.geom_type in ("Polygon", "MultiPolygon")]
    return unary_union(parts).buffer(0) if parts else Polygon()
def geo(g, simplify=True, tol=TOL):
    m = mapping(g.simplify(tol, preserve_topology=True) if simplify else g)
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
# the cells around them. The client tints each cell by comparing the selected date with the cell's date; cells of
# towns with no confirmed date (`unknown`) are left untinted.
HERE = os.path.dirname(os.path.abspath(__file__))
anchors = json.load(open(os.path.join(HERE, "front-anchors.json")))["anchors"]
GEO_CACHE = os.path.join(HERE, "front-anchors.geo.json")
geo_cache = json.load(open(GEO_CACHE)) if os.path.exists(GEO_CACHE) else {}
def geocode(q):
    if q not in geo_cache:
        url = "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + urllib.parse.quote(q)
        for attempt in range(5):   # the public server rate-limits; back off and retry
            try:
                res = json.loads(subprocess.run(["curl", "-sS", "-m", "60", "-A", "poland-ww2-map build script", url], capture_output=True, text=True).stdout)
                break
            except json.JSONDecodeError:
                time.sleep(10 * (attempt + 1))
        else:
            sys.exit(f"geocoding failed: {q}")
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
    cells.append({"name": a["name"], "soviet": a["soviet"], "unknown": a["confidence"] == "unconfirmed", "g": unproj(cell).intersection(poland_s)})
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
    cells.append({"name": a["name"], "soviet": a["soviet"], "unknown": False, "g": pocket})
json.dump(geo_cache, open(GEO_CACHE, "w"), ensure_ascii=False, indent=1)
out["frontCells"] = {"validFrom": "1944-01-04", "validTo": None, "cells": [
    {"name": c["name"], "soviet": c["soviet"], **({"unknown": True} if c["unknown"] else {}), "geometry": geo(c["g"].buffer(0), simplify=False)}
    for c in cells if not c["g"].is_empty]}
print("front cells:", len(out["frontCells"]["cells"]))
# Poland's neighbours on 31 August 1939: their land borders with one another (ways shared by two of these relations,
# so coastlines and Poland's own border are left out), drawn lighter than Poland's.
NEIGHBOURS_1939 = {"German Reich": 2704709, "Lithuania": 2855606, "Latvia": 2704702, "Soviet Union": 2851157,
                   "Kingdom of Romania": 2693259, "Kingdom of Hungary": 2747871, "Slovak Republic": 2692768}
wide = box(*WIDE)
for rel in NEIGHBOURS_1939.values():
    lines(rel, WIDE)
seen = {}
for rel in NEIGHBOURS_1939.values():
    for wid in _ways[(rel, WIDE)]:
        seen[wid] = seen.get(wid, 0) + 1
shared = [g for rel in NEIGHBOURS_1939.values() for wid, g in _ways[(rel, WIDE)].items() if seen[wid] > 1]
nb = linemerge(unary_union(shared)).intersection(wide).difference(poland.boundary.buffer(0.02))
out["layers"].append({"id": "neighbours-1939", "validFrom": None, "validTo": None, "geometry": geo(nb, tol=0.006)})
print("neighbour border segments:", len(getattr(nb, "geoms", [nb])))

# The German Reich and the Soviet Union outside 1939 Poland, per OpenHistoricalMap period (each relation's end date is
# the next one's start). Inside 1939 Poland the occupation zones above apply instead.
def before(day):
    return (date.fromisoformat(day) - timedelta(days=1)).isoformat()
STATES = {
  "german": ([BERLIN, Point(20.51, 54.71), Point(16.37, 48.21)],   # Berlin, Königsberg, Vienna
             [(2704709, "1939-09-01"), (2704716, "1939-10-26"), (2704715, "1940-05-18"), (2704714, "1940-06-01"),
              (2704713, "1940-08-02"), (2704717, "1941-04-14"), (2692712, "1941-08-01")]),
  "soviet": ([MINSK],
             [(2851157, "1939-09-01"), (2848248, "1939-10-06"), (2848241, "1939-10-28"), (2851878, "1940-03-12"),
              (2848258, "1940-06-28"), (2848256, "1940-08-03"), (2848811, "1940-08-05"), (2848812, "1940-08-06"),
              (2851156, "1941-07-17"), (2852346, "1944-09-19"), (2957472, "1944-10-11")]),
}
_rf = list(polygonize(unary_union([lines(2693259, WIDE).intersection(wide), wide.boundary])))
romania_1921 = unary_union([f for f in _rf if f.contains(Point(26.10, 44.43)) or f.contains(Point(28.86, 47.01))])   # Bucharest, Chișinău
state_area = {}
for power, (refs, periods) in STATES.items():
    for i, (rel, vf) in enumerate(periods):
        vt = before(periods[i + 1][1]) if i + 1 < len(periods) else "1945-05-08"
        faces = list(polygonize(unary_union([lines(rel, WIDE).intersection(wide), wide.boundary])))
        own = unary_union([f for f in faces if any(f.contains(r) for r in refs)])
        if own.is_empty:
            sys.exit(f"no reference point inside relation {rel}")
        area = own.difference(poland)
        if power == "soviet" and vf < "1940-06-28":
            # OpenHistoricalMap already counts Bessarabia and Northern Bukovina as Soviet from March 1940; they stayed
            # Romanian (its relation 2693259, valid to 1940-06-28) until the annexation of 28 June 1940.
            area = area.difference(romania_1921)
        area = area.buffer(0)
        state_area[(power, vf)] = area
        out["zones"].append({"power": power, "scope": "state", "relation": rel, "validFrom": vf, "validTo": vt, "geometry": geo(area, tol=0.01)})
        print("state", power, vf, vt, f"{area.area:.2f}")

# 22 June 1941 – 8 May 1945: German (and Romanian) control of Soviet territory, approximated like the 1944 front in
# Poland from dated anchor towns (scripts/soviet-occupation-anchors.json). Each place takes the periods of its nearest
# anchor within that anchor's radius; everything else counts as never occupied. These cells replace the Soviet state
# tint from 22 June 1941 (the Soviet borders inside the map area barely change after that).
INVASION = "1941-06-22"
out["zones"] = [z for z in out["zones"] if not (z.get("scope") == "state" and z["power"] == "soviet" and z["validFrom"] >= INVASION)]
for z in out["zones"]:
    if z.get("scope") == "state" and z["power"] == "soviet" and z["validTo"] >= INVASION:
        z["validTo"] = before(INVASION)
occ = json.load(open(os.path.join(HERE, "soviet-occupation-anchors.json")))["anchors"]
soviet_s = state_area[("soviet", "1941-07-17")].simplify(0.01, preserve_topology=True).buffer(0)
opts = [proj(geocode(a["query"])) for a in occ]
known = [(p, a["german"][0][0]) for p, a in zip(opts, occ) if a["german"] and a["german"][0][0]]
for p, a in zip(opts, occ):   # a town with only a liberation date takes the occupation date of the nearest town with one
    if a["german"] and a["german"][0][0] is None:
        a["german"][0][0] = min(known, key=lambda k: p.distance(k[0]))[1]
ovor = voronoi_diagram(MultiPoint(opts), envelope=proj(wide))
ocells = []
for p, a in zip(opts, occ):
    cell = next(c for c in ovor.geoms if c.contains(p)).intersection(p.buffer(a.get("radiusKm", 150) * KM, 32))
    g = unproj(cell).intersection(soviet_s)
    if not g.is_empty:
        ocells.append({"name": a["name"], "german": a["german"], "g": g})
rest = soviet_s.difference(unary_union([c["g"] for c in ocells]))
ocells.append({"name": "(no occupation)", "german": [], "g": rest})
json.dump(geo_cache, open(GEO_CACHE, "w"), ensure_ascii=False, indent=1)
out["occupationCells"] = {"validFrom": INVASION, "cells": [
    {"name": c["name"], "german": c["german"], "geometry": geo(c["g"].buffer(0), simplify=False)} for c in ocells if not c["g"].is_empty]}
print("occupation cells:", len(out["occupationCells"]["cells"]))

# October 1944 – 8 May 1945: capture of German Reich territory outside 1939 Poland by the Red Army or the Western
# Allies, from dated anchor towns (scripts/reich-capture-anchors.json). Each place changes hands on the date of its
# nearest anchor within that anchor's radius; pockets that held out longer override their surroundings; everything
# else stays German. These cells replace the Reich state tint from the first capture (Aachen).
rca = json.load(open(os.path.join(HERE, "reich-capture-anchors.json")))["anchors"]
OFFENSIVE = min(a.get("allied") or a.get("soviet") or "9999" for a in rca)   # Aachen, October 1944
for z in out["zones"]:
    if z.get("scope") == "state" and z["power"] == "german" and z["validTo"] >= OFFENSIVE:
        z["validTo"] = before(OFFENSIVE)
reich_s = state_area[("german", "1941-08-01")].simplify(0.01, preserve_topology=True).buffer(0)
sites = [a for a in rca if not a.get("pocket")]
rpts = [proj(geocode(a["query"])) for a in sites]
rvor = voronoi_diagram(MultiPoint(rpts), envelope=proj(wide))
rcells = []
for p_, a in zip(rpts, sites):
    cell = next(c for c in rvor.geoms if c.contains(p_)).intersection(p_.buffer(a.get("radiusKm", 100) * KM, 32))
    rcells.append({"name": a["name"], "soviet": a.get("soviet"), "allied": a.get("allied"), "g": unproj(cell).intersection(reich_s)})
for a in rca:
    if a.get("pocket"):
        pocket = unproj(proj(geocode(a["query"])).buffer(a["radiusKm"] * KM, 32)).intersection(reich_s)
        for c in rcells:
            c["g"] = c["g"].difference(pocket)
        rcells.append({"name": a["name"], "soviet": a.get("soviet"), "allied": a.get("allied"), "g": pocket})
rcells.append({"name": "(not taken before 8 May 1945)", "soviet": None, "allied": None, "g": reich_s.difference(unary_union([c["g"] for c in rcells]))})
json.dump(geo_cache, open(GEO_CACHE, "w"), ensure_ascii=False, indent=1)
out["reichCells"] = {"validFrom": OFFENSIVE, "cells": [
    {"name": c["name"], "soviet": c["soviet"], **({"allied": c["allied"]} if c["allied"] else {}), "geometry": geo(c["g"].buffer(0), simplify=False)}
    for c in rcells if not c["g"].is_empty]}
print("reich cells:", len(out["reichCells"]["cells"]))

# 9 April 1940 – 8 May 1945: German occupation of Western Europe (scripts/west-occupation-anchors.json). Each region
# (a country, or France's occupied and Vichy zones) has its occupation date; each place takes the liberation date of
# its nearest anchor town, with pockets overriding their surroundings. Annexed areas are Reich territory (above).
west = json.load(open(os.path.join(HERE, "west-occupation-anchors.json")))
def faces_of(rel, refs):
    faces = list(polygonize(unary_union([lines(rel, WIDE).intersection(wide), wide.boundary])))
    return unary_union([f for f in faces if any(f.contains(Point(*r)) for r in refs)])
wsites = [a for a in west["anchors"] if not a.get("pocket")]
wpts = [proj(geocode(a["query"])) for a in wsites]
wvor = voronoi_diagram(MultiPoint(wpts), envelope=proj(wide))
wcells = []
for reg in west["regions"]:
    area = faces_of(reg["relation"], reg["refs"]).difference(reich_s).simplify(0.01, preserve_topology=True).buffer(0)
    # Occupation-date sub-areas: the whole region, or (France) the cells of its occupation anchors.
    if reg.get("occupationAnchors"):
        opts_ = [proj(geocode(o["query"])) for o in reg["occupationAnchors"]]
        ov = voronoi_diagram(MultiPoint(opts_), envelope=proj(wide))
        subs = [(unproj(next(c for c in ov.geoms if c.contains(p_))).intersection(area), o["occupied"]) for p_, o in zip(opts_, reg["occupationAnchors"])]
    else:
        subs = [(area, reg["occupied"])]
    rcount = len(wcells)
    for sub, occ_date in subs:
        for p_, a in zip(wpts, wsites):
            g = unproj(next(c for c in wvor.geoms if c.contains(p_))).intersection(sub)
            if not g.is_empty:
                wcells.append({"name": f'{a["name"]} ({reg["name"]})', "german": [[occ_date, a["liberated"]]], "g": g})
        for a in west["anchors"]:
            if a.get("pocket"):
                pocket = unproj(proj(geocode(a["query"])).buffer(a["radiusKm"] * KM, 32)).intersection(sub)
                if pocket.is_empty:
                    continue
                for c in wcells[rcount:]:
                    c["g"] = c["g"].difference(pocket)
                wcells.append({"name": a["name"], "german": [[occ_date, a["liberated"]]], "g": pocket})
json.dump(geo_cache, open(GEO_CACHE, "w"), ensure_ascii=False, indent=1)
out["westCells"] = {"validFrom": min(r["occupied"] for r in west["regions"]), "cells": [
    {"name": c["name"], "german": c["german"], "geometry": geo(polys(c["g"]), simplify=False)} for c in wcells if not polys(c["g"]).is_empty]}
print("west cells:", len(out["westCells"]["cells"]))

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
