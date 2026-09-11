import z from "zod";

export const atualizarConfiguracaoSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da empresa."),
});

export type AtualizarConfiguracaoFormSchema = z.infer<typeof atualizarConfiguracaoSchema>;
