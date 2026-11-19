import { useEffect, useState } from "react";
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
type Zone = Dated & { power: "german" | "soviet"; shape: string };
type Borders = { layers: Line[]; zones: Zone[]; shapes: Record<string, Geometry> };

const keyOf = (id: string): BorderKey =>
  id === "poland-1939" ? "1939" : id === "poland-today" ? "today" : id.startsWith("soviet") ? "soviet" : "german";

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
  if (!data) return null;
  return (
    <>
      <Pane name="zones" style={{ zIndex: 350 }}>
        {data.zones.map((z) => {
          if (!visible.has(z.power) || !validOn(z, date)) return null;
          const st = BORDER_STYLE[z.power];
          return (
            <Polygon
              key={`${z.power}-${z.validFrom}`}
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
