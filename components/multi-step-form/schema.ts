//packages/design-system/components/multi-step-form/schema.ts
import { z } from "zod";

export function createStepSchema<T extends Record<string, z.ZodType>>(steps: T) {
  return z.object(steps);
}
