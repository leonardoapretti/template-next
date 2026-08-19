import z from "zod";
import { emailSchema } from "@/lib/zod-schemas/email";

export const verificarEmailSchema = z.object({
  email: emailSchema,
});

export type VerificarEmailSchema = z.infer<typeof verificarEmailSchema>;
