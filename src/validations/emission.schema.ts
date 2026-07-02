import { z } from "zod";

export const submitGroundDataSchema = z.object({
  facilityId: z.string().min(1, "Facility is required"),
  measurementDate: z.string().min(1, "Measurement date is required"),
  methaneReading: z.coerce.number().positive("Reading must be positive"),
  methodology: z.string().min(1, "Methodology is required"),
  latitude: z.coerce.number().min(-90).max(90).optional(),
  longitude: z.coerce.number().min(-180).max(180).optional(),
});
export type SubmitGroundDataInput = z.infer<typeof submitGroundDataSchema>;

export const emissionFiltersSchema = z.object({
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sector: z.string().optional(),
  gasType: z.string().optional(),
  instrument: z.string().optional(),
  provider: z.string().optional(),
  minEmissionRate: z.coerce.number().optional(),
  maxEmissionRate: z.coerce.number().optional(),
  minPlumes: z.coerce.number().optional(),
  maxPlumes: z.coerce.number().optional(),
  minPersistence: z.coerce.number().optional(),
  maxPersistence: z.coerce.number().optional(),
  page: z.coerce.number().optional(),
  limit: z.coerce.number().optional(),
  bbox: z.string().optional(),
  state: z.string().optional(),
  lga: z.string().optional(),
  oilBlock: z.string().optional(),
  operator: z.string().optional(),
  facilityType: z.string().optional(),
  subSector: z.enum(["Upstream", "Midstream", "Downstream"]).optional(),
});
export type EmissionFiltersInput = z.infer<typeof emissionFiltersSchema>;
