import type { BorderKey } from "../lib/urlState";

/**
 * Line and tint styles. Brown (German) and red (Soviet) are hard to tell apart with red–green colour
 * blindness, so they also differ in lightness and in dash pattern (dotted vs dashed), and the legend
 * names each zone.
 */
export const BORDER_STYLE: Record<BorderKey, { color: string; weight: number; dashArray?: string; opacity: number; fill?: number; fillColor?: string }> = {
  "1939": { color: "#2b2a27", weight: 2.2, opacity: 0.75 },
  today: { color: "#5f5e59", weight: 1.6, dashArray: "7 6", opacity: 0.8 },
  german: { color: "#6e4a2a", weight: 2.4, dashArray: "1 6", opacity: 0.95, fill: 0.16, fillColor: "#a0581c" },
  soviet: { color: "#d0302f", weight: 2.2, dashArray: "9 6", opacity: 0.9, fill: 0.1 },
};
