import { useEffect, useMemo, useState } from "react";
import { Pane, Polygon, Polyline } from "react-leaflet";
import type { BorderKey } from "../lib/urlState";
import { BORDER_STYLE } from "./borderStyle";

type Geometry =
  | { type: "LineString"; coordinates: number[][] }
  | { type: "MultiLineString"; coordinates: number[][][] }
  | { type: "Polygon"; coordinates: number[][][] }
  | { type: "MultiPolygon"; coordinates: number[][][][] };
type Dated = { validFrom: string | null; validTo: string | null };
type Line = Dated & { id: string; geometry: Geometry };
type Zone = Dated & { power: "german" | "soviet"; scope?: "state"; shape: string };
type Cell = { name: string; soviet: string | null; unknown?: boolean; geometry: Geometry };
type Borders = {
  layers: Line[];
  zones: Zone[];
  shapes: Record<string, Geometry>;
  frontCells: { validFrom: string; cells: Cell[] };
  occupationCells: { validFrom: string; cells: OccCell[] };
  reichCells: { validFrom: string; cells: (Cell & { allied?: string })[] };
  westCells: { validFrom: string; cells: OccCell[] };
};
/** A part of Soviet territory with the periods it was held by Germany or Romania: [first day, first day back]. */
type OccCell = { name: string; german: [string, string | null][]; geometry: Geometry };

const keyOf = (id: string): BorderKey =>
  id === "poland-1939"
    ? "1939"
    : id === "neighbours-1939"
      ? "neighbours"
      : id === "poland-today"
        ? "today"
        : id.startsWith("soviet")
          ? "soviet"
          : "german";

const flip = (ring: number[][]) => ring.map(([lng, lat]) => [lat, lng] as [number, number]);
const linePositions = (g: Geometry) =>
  g.type === "LineString" ? [flip(g.coordinates)] : g.type === "MultiLineString" ? g.coordinates.map(flip) : [];
const polygonPositions = (g: Geometry) =>
  g.type === "Polygon" ? [g.coordinates.map(flip)] : g.type === "MultiPolygon" ? g.coordinates.map((p) => p.map(flip)) : [];

const validOn = (x: Dated, date: string | null) =>
  !(x.validFrom || x.validTo) || (!!date && (!x.validFrom || date >= x.validFrom) && (!x.validTo || date <= x.validTo));

type Props = { visible: Set<BorderKey>; date: string | null };

/**
 * Borders and occupation zones (OpenHistoricalMap, CC0), loaded on demand. Zones tint the part of 1939 Poland under
 * German or Soviet control on the selected date; they sit in their own pane below the lines and markers.
 */
export default function BordersLayer({ visible, date }: Props) {
  const [data, setData] = useState<Borders | null>(null);
  useEffect(() => {
    if (!visible.size || data) return;
    let alive = true;
    import("../data/borders.json").then((m) => alive && setData(m.default as unknown as Borders));
    return () => {
      alive = false;
    };
  }, [visible, data]);
  // From January 1944 (Poland) and January 1945 (German territory) control is approximated from dated anchor towns:
  // each cell is Soviet-held from its date. Cells around towns with no confirmed date are left untinted.
  // All cells of one side go into a single polygon so that shared edges leave no seams.
  const front = useMemo(() => {
    if (!data || !date) return null;
    const sides = {
      german: [] as ReturnType<typeof polygonPositions>,
      soviet: [] as ReturnType<typeof polygonPositions>,
      allied: [] as ReturnType<typeof polygonPositions>,
    };
    for (const set of [data.frontCells, data.reichCells] as { validFrom: string; cells: (Cell & { allied?: string })[] }[]) {
      if (date < set.validFrom) continue;
      for (const c of set.cells) {
        if (c.unknown) continue;
        const side = c.soviet && date >= c.soviet ? "soviet" : c.allied && date >= c.allied ? "allied" : "german";
        sides[side].push(...polygonPositions(c.geometry));
      }
    }
    return sides.german.length || sides.soviet.length || sides.allied.length ? sides : null;
  }, [data, date]);
  // From 22 June 1941 Soviet territory is drawn from these cells instead of the state tint.
  const occupation = useMemo(() => {
    if (!data || !date || date < data.occupationCells.validFrom) return null;
    const sides = {
      german: [] as ReturnType<typeof polygonPositions>,
      soviet: [] as ReturnType<typeof polygonPositions>,
    };
    for (const c of data.occupationCells.cells) {
      const held = c.german.some(([from, to]) => date >= from && (!to || date < to));
      sides[held ? "german" : "soviet"].push(...polygonPositions(c.geometry));
    }
    return sides;
  }, [data, date]);
  // Western Europe: green while occupied, purple once liberated by the Western Allies, untinted before the invasion.
  const west = useMemo(() => {
    if (!data || !date || date < data.westCells.validFrom) return null;
    const sides = { german: [] as ReturnType<typeof polygonPositions>, allied: [] as ReturnType<typeof polygonPositions> };
    for (const c of data.westCells.cells) {
      const [from, to] = c.german[0];
      if (date < from) continue;
      sides[to && date >= to ? "allied" : "german"].push(...polygonPositions(c.geometry));
    }
    return sides;
  }, [data, date]);
  if (!data) return null;
  return (
    <>
      <Pane name="zones" style={{ zIndex: 350 }}>
        {west &&
          (["german", "allied"] as const).map((power) => {
            if (!visible.has(power) || !west[power].length) return null;
            const st = BORDER_STYLE[power];
            return (
              <Polygon
                key={`west-${power}`}
                positions={west[power]}
                interactive={false}
                pathOptions={{ stroke: false, fillColor: st.fillColor ?? st.color, fillOpacity: st.fill }}
              />
            );
          })}
        {occupation &&
          (["german", "soviet"] as const).map((power) => {
            if (!visible.has(power) || !occupation[power].length) return null;
            const st = BORDER_STYLE[power];
            return (
              <Polygon
                key={`occupation-${power}`}
                positions={occupation[power]}
                interactive={false}
                pathOptions={{ stroke: false, fillColor: st.fillColor ?? st.color, fillOpacity: st.fill }}
              />
            );
          })}
        {front &&
          (["german", "soviet", "allied"] as const).map((power) => {
            if (!visible.has(power) || !front[power].length) return null;
            const st = BORDER_STYLE[power];
            return (
              <Polygon
                key={`front-${power}`}
                positions={front[power]}
                interactive={false}
                pathOptions={{ stroke: false, fillColor: st.fillColor ?? st.color, fillOpacity: st.fill }}
              />
            );
          })}
        {data.zones.map((z) => {
          if (!visible.has(z.power) || !validOn(z, date)) return null;
          const st = BORDER_STYLE[z.power];
          return (
            <Polygon
              key={`${z.scope ?? "poland"}-${z.power}-${z.validFrom}`}
              positions={polygonPositions(data.shapes[z.shape])}
              interactive={false}
              pathOptions={{ stroke: false, fillColor: st.fillColor ?? st.color, fillOpacity: st.fill }}
            />
          );
        })}
      </Pane>
      {data.layers.map((l) => {
        const key = keyOf(l.id);
        if (!visible.has(key) || !validOn(l, date)) return null;
        const st = BORDER_STYLE[key];
        return (
          <Polyline
            key={l.id}
            positions={linePositions(l.geometry)}
            interactive={false}
            pathOptions={{ color: st.color, weight: st.weight, dashArray: st.dashArray, opacity: st.opacity, lineCap: "round" }}
          />
        );
      })}
    </>
  );
}
