import z from "zod";

export const faleConoscoSchema = z.object({
  nome: z.string().trim().min(3, "Informe seu nome completo."),
  email: z.email("Informe um e-mail válido.").transform((value) => value.trim().toLowerCase()),
  mensagem: z.string().trim().min(20, "Descreva sua mensagem com mais detalhes."),
});

export type FaleConoscoFormSchema = z.infer<typeof faleConoscoSchema>;
