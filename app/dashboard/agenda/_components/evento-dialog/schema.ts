import { z } from "zod";

const recorrencias = ["NENHUMA", "DIARIA", "SEMANAL", "MENSAL", "ANUAL"] as const;

export const eventoFormSchema = z
  .object({
    titulo: z.string().trim(),
    periodo: z.object({
      from: z.string().min(1, "Preencha a data inicial."),
      to: z.string().min(1, "Preencha a data final."),
    }),
    diaTodo: z.boolean(),
    horaInicio: z.string(),
    horaFim: z.string(),
    recorrencia: z.enum(recorrencias),
    recorrenciaAte: z.string(),
    observacao: z.string(),
  })
  .refine((data) => data.periodo.to >= data.periodo.from, {
    message: "A data final não pode ser anterior à inicial.",
    path: ["periodo", "to"],
  })
  .refine((data) => data.diaTodo || Boolean(data.horaInicio && data.horaFim), {
    message: "Preencha o horário ou marque como dia inteiro.",
    path: ["horaFim"],
  })
  .refine(
    (data) => {
      if (data.diaTodo || data.periodo.from !== data.periodo.to) return true;
      if (!data.horaInicio || !data.horaFim) return true;
      return data.horaInicio < data.horaFim;
    },
    {
      message: "O horário final deve ser maior que o inicial.",
      path: ["horaFim"],
    },
  );

export type EventoFormSchema = z.infer<typeof eventoFormSchema>;
