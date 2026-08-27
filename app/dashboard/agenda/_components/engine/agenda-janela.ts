import type { JanelaAgenda } from "./agendamento.types";

function toYYYYMMDD(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

/**
 * Retorna a janela do mês visível no calendário,
 * incluindo os dias do mês anterior/próximo que
 * aparecem no preenchimento da grade.
 */
export function janelaDoMes(date: Date): JanelaAgenda {
  const ano = date.getFullYear();
  const mes = date.getMonth();

  // Primeiro dia do mês → recua até domingo
  const primeiroDia = new Date(ano, mes, 1);
  const inicio = new Date(primeiroDia);
  inicio.setDate(1 - primeiroDia.getDay());

  // Último dia do mês → avança até sábado
  const ultimoDia = new Date(ano, mes + 1, 0);
  const fim = new Date(ultimoDia);
  fim.setDate(ultimoDia.getDate() + (6 - ultimoDia.getDay()));

  return { inicio: toYYYYMMDD(inicio), fim: toYYYYMMDD(fim) };
}

/**
 * Retorna a janela da semana visível (dom → sáb).
 */
export function janelaDaSemana(date: Date): JanelaAgenda {
  const domingo = new Date(date);
  domingo.setDate(date.getDate() - date.getDay());

  const sabado = new Date(domingo);
  sabado.setDate(domingo.getDate() + 6);

  return { inicio: toYYYYMMDD(domingo), fim: toYYYYMMDD(sabado) };
}

export function janelaDoDia(date: Date): JanelaAgenda {
  const dia = toYYYYMMDD(date);

  return { inicio: dia, fim: dia };
}
