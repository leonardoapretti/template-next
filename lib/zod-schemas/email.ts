import { z } from "zod";

export const emailSchema = z.string().trim().toLowerCase();

export type EmailSchema = z.infer<typeof emailSchema>;
