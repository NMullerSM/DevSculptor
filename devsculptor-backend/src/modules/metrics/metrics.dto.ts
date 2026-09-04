import { z } from 'zod';

export const projectMetricsSchema = z.object({
  total_rf: z.number().int().nonnegative(),
  total_rnf: z.number().int().nonnegative(),
  total_entities: z.number().int().nonnegative(),
  total_adrs_accepted: z.number().int().nonnegative(),
  total_adrs_total: z.number().int().nonnegative(),
  maturity_index: z.number().int().min(0).max(100),
});

export type ProjectMetrics = z.infer<typeof projectMetricsSchema>;
