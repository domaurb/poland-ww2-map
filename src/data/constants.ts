/** Shared, dependency-free constants used by both the app and the build scripts. */

export const RANGE_START = "1939-09-01";
export const RANGE_END = "1945-05-08";

export const EVENT_TYPES = [
  "battle",
  "siege",
  "uprising",
  "massacre",
  "camp",
  "deportation",
  "resistance_operation",
  "bombing",
  "occupation_policy",
  "liberation",
  "other",
] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const DATE_PRECISIONS = ["day", "month", "approximate"] as const;
export const LOCATION_PRECISIONS = ["exact", "town", "region"] as const;

/**
 * Colour is assigned by family (validated as a 3-hue categorical set against the
 * basemap surface); shape distinguishes types within a family. "other" is drawn
 * hollow rather than with a fourth fill colour.
 */
export type Family = "military" | "civilian" | "resistance" | "other";
export const FAMILY_COLORS: Record<Family, string> = {
  military: "#3767a6",
  civilian: "#b0302b",
  resistance: "#c07a12",
  other: "#6f6e69",
};

export type Glyph =
  | "cross" | "square" | "ring" | "diamond" | "triangle-down" | "arrow"
  | "bars" | "bar" | "triangle-up" | "star" | "dot";

export const TYPE_STYLE: Record<EventType, { family: Family; glyph: Glyph }> = {
  battle: { family: "military", glyph: "cross" },
  siege: { family: "military", glyph: "square" },
  liberation: { family: "military", glyph: "ring" },
  massacre: { family: "civilian", glyph: "diamond" },
  bombing: { family: "civilian", glyph: "triangle-down" },
  deportation: { family: "civilian", glyph: "arrow" },
  camp: { family: "civilian", glyph: "bars" },
  occupation_policy: { family: "civilian", glyph: "bar" },
  uprising: { family: "resistance", glyph: "triangle-up" },
  resistance_operation: { family: "resistance", glyph: "star" },
  other: { family: "other", glyph: "dot" },
};

/** Generous box around the union of Poland's 31 Aug 1939 territory and present-day Poland. */
export const POLAND_BBOX = { minLat: 47.6, maxLat: 56.3, minLng: 13.9, maxLng: 28.7 };
