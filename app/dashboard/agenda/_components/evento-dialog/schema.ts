import { z } from "zod";

const recorrencias = ["NENHUMA", "DIARIA", "SEMANAL", "MENSAL", "ANUAL"] as const;

export const eventoFormSchema = z
  .object({
    titulo: z.string().trim(),
    data: z.string().min(1, "Preencha a data."),
    horaInicio: z.string().min(1, "Preencha o horário inicial."),
    horaFim: z.string().min(1, "Preencha o horário final."),
    recorrencia: z.enum(recorrencias),
    recorrenciaAte: z.string(),
    observacao: z.string(),
  })
  .refine((data) => data.horaInicio < data.horaFim, {
    message: "O horário final deve ser maior que o inicial.",
    path: ["horaFim"],
  });

export type EventoFormSchema = z.infer<typeof eventoFormSchema>;
