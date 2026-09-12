import z from "zod";

export const convidarMembroSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  roleId: z.string().trim().min(1, "Escolha um perfil."),
});

export type ConvidarMembroFormSchema = z.infer<typeof convidarMembroSchema>;
