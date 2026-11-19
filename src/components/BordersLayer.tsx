import { useEffect, useState } from "react";
import { Polyline } from "react-leaflet";
import type { BorderKey } from "../lib/urlState";
import { BORDER_STYLE } from "./borderStyle";

type Layer = {
  id: string;
  validFrom: string | null;
  validTo: string | null;
  geometry: { type: "LineString" | "MultiLineString"; coordinates: number[][] | number[][][] };
};

const keyOf = (id: string): BorderKey => (id === "poland-1939" ? "1939" : id === "poland-today" ? "today" : "occupation");

const toLatLng = (g: Layer["geometry"]): [number, number][][] =>
  (g.type === "LineString" ? [g.coordinates as number[][]] : (g.coordinates as number[][][])).map((line) =>
    line.map(([lng, lat]) => [lat, lng] as [number, number]),
  );

type Props = { visible: Set<BorderKey>; date: string | null };

/** Historical borders (OpenHistoricalMap, CC0), loaded on demand so they do not weigh on the first page load. */
export default function BordersLayer({ visible, date }: Props) {
  const [layers, setLayers] = useState<Layer[] | null>(null);
  useEffect(() => {
    if (!visible.size || layers) return;
    let alive = true;
    import("../data/borders.json").then((m) => alive && setLayers((m.default as { layers: Layer[] }).layers));
    return () => {
      alive = false;
    };
  }, [visible, layers]);
  if (!layers) return null;
  return (
    <>
      {layers.map((l) => {
        const key = keyOf(l.id);
        if (!visible.has(key)) return null;
        if (l.validFrom || l.validTo) {
          if (!date || (l.validFrom && date < l.validFrom) || (l.validTo && date > l.validTo)) return null;
        }
        const st = BORDER_STYLE[key];
        return (
          <Polyline
            key={l.id}
            positions={toLatLng(l.geometry)}
            interactive={false}
            pathOptions={{ color: st.color, weight: st.weight, dashArray: st.dashArray, opacity: st.opacity, lineCap: "round" }}
          />
        );
      })}
    </>
  );
}
