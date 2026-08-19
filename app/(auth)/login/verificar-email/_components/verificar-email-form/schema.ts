import { emailSchema } from "@/lib/zod-schemas/email";
import z from "zod";

export const verificarEmailSchema = z.object({
  email: emailSchema,
});

export type VerificarEmailSchema = z.infer<typeof verificarEmailSchema>;
