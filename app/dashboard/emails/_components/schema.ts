import z from "zod";

export const enviarEmailSchema = z.object({
  destinatario: z.email("Informe um e-mail válido."),
  assunto: z.string().trim().min(3, "Informe um assunto."),
  corpo: z.string().trim().min(10, "Escreva o conteúdo do e-mail."),
});

export type EnviarEmailFormSchema = z.infer<typeof enviarEmailSchema>;
