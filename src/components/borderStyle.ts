import type { BorderKey } from "../lib/urlState";

/**
 * Line and tint styles. German is a blue-leaning green so that it stays distinct from the Soviet red with
 * red–green colour blindness (checked with the dataviz palette validator: deutan ΔE 9.6); the two also
 * differ in dash pattern (dotted vs dashed), and the legend names each zone.
 */
export const BORDER_STYLE: Record<BorderKey, { color: string; weight: number; dashArray?: string; opacity: number; fill?: number; fillColor?: string }> = {
  "1939": { color: "#2b2a27", weight: 2.2, opacity: 0.75 },
  neighbours: { color: "#2b2a27", weight: 1.5, opacity: 0.45 },
  today: { color: "#5f5e59", weight: 1.6, dashArray: "7 6", opacity: 0.8 },
  german: { color: "#00664f", weight: 2.4, dashArray: "1 6", opacity: 0.95, fill: 0.14, fillColor: "#008a6e" },
  soviet: { color: "#d0302f", weight: 2.2, dashArray: "9 6", opacity: 0.9, fill: 0.1 },
  // Western Allies: purple, distinct from both the red and the green (validator: normal-vision ΔE ≥ 23 to each).
  allied: { color: "#7b3fa0", weight: 2.2, opacity: 0.9, fill: 0.13 },
};
