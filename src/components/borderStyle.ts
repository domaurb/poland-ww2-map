import type { BorderKey } from "../lib/urlState";

/** Line styles; distinguished by dash pattern as well as tone so they do not rely on colour alone. */
export const BORDER_STYLE: Record<BorderKey, { color: string; weight: number; dashArray?: string; opacity: number }> = {
  "1939": { color: "#2b2a27", weight: 2.2, opacity: 0.75 },
  today: { color: "#5f5e59", weight: 1.6, dashArray: "7 6", opacity: 0.8 },
  occupation: { color: "#8a4b14", weight: 2.4, dashArray: "1 6", opacity: 0.9 },
};
