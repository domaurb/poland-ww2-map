import { FAMILY_COLORS, TYPE_STYLE, type EventType, type Glyph } from "../data/constants";

export type MarkerVariant = "began" | "ongoing";

/** Glyph paths drawn in a 20×20 box centred on (10,10). `fill` = solid shape, else stroked. */
const GLYPHS: Record<Glyph, { d: string; fill: boolean }> = {
  cross: { d: "M6 6 L14 14 M14 6 L6 14", fill: false },
  square: { d: "M6.5 6.5 H13.5 V13.5 H6.5 Z", fill: false },
  ring: { d: "M10 5.5 A4.5 4.5 0 1 1 9.99 5.5 Z", fill: false },
  diamond: { d: "M10 5 L15 10 L10 15 L5 10 Z", fill: true },
  "triangle-down": { d: "M5.5 7 H14.5 L10 14.5 Z", fill: true },
  arrow: { d: "M5 10 H14 M10.5 6.5 L14 10 L10.5 13.5", fill: false },
  bars: { d: "M6 7 H14 M6 10 H14 M6 13 H14", fill: false },
  bar: { d: "M5.5 10 H14.5", fill: false },
  "triangle-up": { d: "M10 5.5 L14.5 13 H5.5 Z", fill: true },
  star: { d: "M10 4.8 L11.5 8.3 L15.2 8.5 L12.3 10.9 L13.3 14.6 L10 12.5 L6.7 14.6 L7.7 10.9 L4.8 8.5 L8.5 8.3 Z", fill: true },
  dot: { d: "M10 8 A2 2 0 1 1 9.99 8 Z", fill: true },
};

export function glyphPath(glyph: Glyph, color: string, strokeWidth = 1.8) {
  const g = GLYPHS[glyph];
  return g.fill
    ? `<path d="${g.d}" fill="${color}"/>`
    : `<path d="${g.d}" fill="none" stroke="${color}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * SVG markup for an event marker. Began → solid family colour with white glyph.
 * Ongoing → smaller, white with a coloured ring and glyph. "other" is always hollow
 * (dashed ring) so it never relies on a fourth fill colour.
 */
export function markerSvg(
  type: EventType,
  variant: MarkerVariant,
  opts: { unverified?: boolean; selected?: boolean; size?: number } = {},
) {
  const { family, glyph } = TYPE_STYLE[type];
  const color = FAMILY_COLORS[family];
  const size = opts.size ?? (variant === "began" ? 28 : 22);
  const hollow = variant === "ongoing" || family === "other";
  const disc = hollow
    ? `<circle cx="10" cy="10" r="8.2" fill="#fff" stroke="${color}" stroke-width="2.2"${family === "other" ? ' stroke-dasharray="3 2"' : ""}/>`
    : `<circle cx="10" cy="10" r="8.6" fill="${color}" stroke="#fff" stroke-width="1.6"/>`;
  const glyphColor = hollow ? color : "#fff";
  const halo = opts.selected ? `<circle cx="10" cy="10" r="10.4" fill="none" stroke="#1d1d1b" stroke-width="1.6"/>` : "";
  const badge = opts.unverified
    ? `<g transform="translate(14.2 1.2)"><circle cx="2.8" cy="2.8" r="3.3" fill="#fff" stroke="#1d1d1b" stroke-width="0.9"/><text x="2.8" y="4.7" font-size="5.4" font-weight="700" text-anchor="middle" fill="#1d1d1b" font-family="system-ui, sans-serif">?</text></g>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 22 22" width="${size}" height="${size}" aria-hidden="true" focusable="false">${halo}${disc}${glyphPath(glyph, glyphColor, hollow ? 1.6 : 1.9)}${badge}</svg>`;
}
