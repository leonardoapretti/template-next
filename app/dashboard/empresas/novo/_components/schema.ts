import z from "zod";

export const criarEmpresaSchema = z.object({
  nome: z.string().trim().min(2, "Informe o nome da empresa."),
});

export type CriarEmpresaFormSchema = z.infer<typeof criarEmpresaSchema>;
