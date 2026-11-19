import { z } from "zod";
import { EVENT_TYPES, DATE_PRECISIONS, LOCATION_PRECISIONS } from "./constants";

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "expected YYYY-MM-DD");
const nonEmpty = z.string().trim().min(1);
/** Every piece of event text is stored in both languages. */
export const Bilingual = z.object({ en: nonEmpty, pl: nonEmpty }).strict();

export const SourceSchema = z
  .object({
    title: nonEmpty,
    publisher: nonEmpty,
    url: z.url({ protocol: /^https$/ }),
    tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
    accessed: isoDate,
  })
  .strict();

export const EventSchema = z
  .object({
    id: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, "id must be a lowercase slug"),
    title: Bilingual,
    startDate: isoDate,
    endDate: isoDate,
    datePrecision: z.enum(DATE_PRECISIONS),
    location: z
      .object({
        lat: z.number().min(-90).max(90),
        lng: z.number().min(-180).max(180),
        name: Bilingual,
        precision: z.enum(LOCATION_PRECISIONS),
      })
      .strict(),
    type: z.enum(EVENT_TYPES),
    belligerents: z.array(nonEmpty).optional(),
    summary: Bilingual,
    casualties: Bilingual.optional(),
    significanceRank: z.number().int().optional(),
    sources: z.array(SourceSchema).min(1, "at least one source is required"),
    verified: z.boolean(),
    notes: Bilingual.optional(),
  })
  .strict();

export type HistEvent = z.infer<typeof EventSchema>;
export type Source = z.infer<typeof SourceSchema>;
export type Bilingual = z.infer<typeof Bilingual>;
