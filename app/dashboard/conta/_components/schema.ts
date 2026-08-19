import z from "zod";

export const alterarEmailSchema = z.object({
  senhaAtual: z.string().min(1, "Informe sua senha atual."),
  novoEmail: z.email("Informe um e-mail válido."),
});

export type AlterarEmailFormSchema = z.infer<typeof alterarEmailSchema>;
