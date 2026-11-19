import { MapContainer, TileLayer, ZoomControl } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import ClusterLayer, { type MarkerItem } from "./ClusterLayer";

type Props = {
  items: MarkerItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  revealToken: number;
  selectedPoint: [number, number] | null;
  label: string;
};

// Centred on the union of 1939 and present-day Poland.
const CENTER: [number, number] = [52.2, 21.8];
const BOUNDS: [[number, number], [number, number]] = [[44.5, 8.0], [58.5, 36.0]];

export default function MapView({ items, selectedId, onSelect, revealToken, selectedPoint, label }: Props) {
  return (
    <div className="map-wrap" role="region" aria-label={label}>
      <MapContainer
        center={CENTER}
        zoom={6}
        minZoom={5}
        maxZoom={14}
        maxBounds={BOUNDS}
        maxBoundsViscosity={0.8}
        zoomControl={false}
        className="map"
        worldCopyJump={false}
      >
        {/* Standard OSM raster tiles (no API key; OSMF tile usage policy), muted with a CSS filter. */}
        <TileLayer
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          maxZoom={19}
          className="basemap"
        />
        <ZoomControl position="topleft" />
        <ClusterLayer items={items} selectedId={selectedId} onSelect={onSelect} revealToken={revealToken} selectedPoint={selectedPoint} />
      </MapContainer>
    </div>
  );
}
