import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.markercluster";
import type { HistEvent } from "../data/schema";
import { markerSvg, type MarkerVariant } from "./markerIcon";

export type MarkerItem = { event: HistEvent; variant: MarkerVariant; label: string; rank?: number };

type Props = {
  items: MarkerItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  /** Bumped by the parent to request "zoom to and reveal" of the selected marker. */
  revealToken: number;
  /** Fallback target when the selected event has no marker (e.g. filtered out or not on this date). */
  selectedPoint: [number, number] | null;
};

/**
 * Imperative bridge to leaflet.markercluster. Markers are diffed by a key that
 * encodes everything affecting their appearance, so animating through dates only
 * touches markers that actually change.
 */
export default function ClusterLayer({ items, selectedId, onSelect, revealToken, selectedPoint }: Props) {
  const map = useMap();
  const groupRef = useRef<L.MarkerClusterGroup | null>(null);
  const markersRef = useRef(new Map<string, { key: string; marker: L.Marker }>());
  const onSelectRef = useRef(onSelect);
  onSelectRef.current = onSelect;

  useEffect(() => {
    const group = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 36,
      spiderfyOnMaxZoom: true,
      iconCreateFunction: (cluster) => {
        const n = cluster.getChildCount();
        const size = n < 10 ? 30 : n < 50 ? 36 : 42;
        return L.divIcon({
          html: `<span>${n}</span>`,
          className: "evt-cluster",
          iconSize: [size, size],
        });
      },
    });
    group.on("clusterkeypress", (ev: L.LeafletEvent) => {
      const e = ev as unknown as { layer: L.MarkerCluster; originalEvent?: KeyboardEvent };
      if (e.originalEvent?.key === "Enter") e.layer.zoomToBounds({ padding: [40, 40] });
    });
    map.addLayer(group);
    groupRef.current = group;
    const markers = markersRef.current;
    return () => {
      map.removeLayer(group);
      markers.clear();
      groupRef.current = null;
    };
  }, [map]);

  useEffect(() => {
    const group = groupRef.current;
    if (!group) return;
    const current = markersRef.current;
    const next = new Map<string, { key: string; item: MarkerItem }>();
    for (const item of items) {
      const e = item.event;
      const key = [item.variant, e.verified, e.id === selectedId, item.rank ?? "", item.label].join("|");
      next.set(e.id, { key, item });
    }
    const toRemove: L.Marker[] = [];
    for (const [id, m] of current) {
      if (next.get(id)?.key !== m.key) {
        toRemove.push(m.marker);
        current.delete(id);
      }
    }
    const toAdd: L.Marker[] = [];
    for (const [id, { key, item }] of next) {
      if (current.has(id)) continue;
      const e = item.event;
      const selected = e.id === selectedId;
      const size = item.variant === "began" ? 28 : 22;
      const rankBadge = item.rank !== undefined ? `<span class="evt-rank">${item.rank}</span>` : "";
      const marker = L.marker([e.location.lat, e.location.lng], {
        icon: L.divIcon({
          html: markerSvg(e.type, item.variant, { unverified: !e.verified, selected }) + rankBadge,
          className: `evt-marker${selected ? " is-selected" : ""}`,
          iconSize: [size, size],
          iconAnchor: [size / 2, size / 2],
        }),
        title: item.label,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: selected ? 1000 : item.variant === "began" ? 100 : 0,
      });
      marker.on("click", () => onSelectRef.current(e.id));
      marker.on("add", () => {
        const el = marker.getElement();
        el?.setAttribute("role", "button");
        el?.setAttribute("aria-label", item.label);
      });
      current.set(id, { key, marker });
      toAdd.push(marker);
    }
    if (toRemove.length) group.removeLayers(toRemove);
    if (toAdd.length) group.addLayers(toAdd);
  }, [items, selectedId]);

  useEffect(() => {
    if (!revealToken || !selectedId) return;
    const entry = markersRef.current.get(selectedId);
    const group = groupRef.current;
    if (entry && group) {
      group.zoomToShowLayer(entry.marker, () => map.panTo(entry.marker.getLatLng(), { animate: true }));
    } else if (selectedPoint) {
      map.flyTo(selectedPoint, Math.max(map.getZoom(), 8));
    }
    // Only react to explicit reveal requests.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealToken]);

  return null;
}
