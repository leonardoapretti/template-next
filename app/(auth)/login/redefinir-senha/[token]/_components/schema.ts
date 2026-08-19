import z from "zod";
import { senhaForteSchema } from "@/app/(auth)/cadastro/_components/schema";

export const redefinirSenhaSchema = z
  .object({
    senha: senhaForteSchema,
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  });

export type RedefinirSenhaFormSchema = z.infer<typeof redefinirSenhaSchema>;
