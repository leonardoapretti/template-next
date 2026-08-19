/** biome-ignore-all lint/style/noNonNullAssertion: PROV */
import { parse } from "date-fns";

type DateInput = Date | string | number | undefined | null;

function isValidDate(date: Date): boolean {
  return !Number.isNaN(date.getTime());
}

function parseTimestamp(timestamp: number): Date | null {
  const date = new Date(timestamp < 1e12 ? timestamp * 1000 : timestamp);

  return isValidDate(date) ? date : null;
}

function parseNumericString(input: string): Date | null {
  if (!/^\d+$/.test(input)) {
    return null;
  }

  return parseTimestamp(Number(input));
}

function parseDateOnly(input: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return null;
  }

  const date = parse(input, "yyyy-MM-dd", new Date());

  return isValidDate(date) ? date : null;
}

function parseIsoDate(input: string): Date | null {
  if (!input.includes("T")) {
    return null;
  }

  const date = parse(input, "yyyy-MM-dd'T'HH:mm:ssXXX", new Date());

  return isValidDate(date) ? date : null;
}

function parseFallbackDate(input: string): Date | null {
  const date = parse(input, "yyyy-MM-dd HH:mm:ss", new Date());

  return isValidDate(date) ? date : null;
}

/**
 * Converte uma entrada em Date de forma previsível e sem timezone-shift.
 *
 * Suporta:
 *  - Date
 *  - YYYY-MM-DD
 *  - ISO string (com fuso explícito)
 *  - timestamp (ms ou s)
 */
export function safeParseDate(input: DateInput): Date | null {
  if (!input) {
    return null;
  }

  if (input instanceof Date) {
    return isValidDate(input) ? input : null;
  }

  if (typeof input === "number") {
    return parseTimestamp(input);
  }

  if (typeof input !== "string") {
    return null;
  }

  return (
    parseNumericString(input) ??
    parseDateOnly(input) ??
    parseIsoDate(input) ??
    parseFallbackDate(input)
  );
}

export function formatarData(
  input: Date | string | number | undefined | null,
  pattern: string = "dd/MM/yyyy",
): string {
  if (!input) {
    return "";
  }

  const date = safeParseDate(input);

  if (!date) {
    return "";
  }

  const map: Record<string, string> = {
    dd: String(date.getDate()).padStart(2, "0"),
    MM: String(date.getMonth() + 1).padStart(2, "0"),
    yyyy: String(date.getFullYear()),
    yy: String(date.getFullYear()).slice(-2),

    MMMM: new Intl.DateTimeFormat("pt-BR", {
      month: "long",
    }).format(date),

    MMM: new Intl.DateTimeFormat("pt-BR", {
      month: "short",
    }).format(date),
  };

  return pattern.replace(/dd|MM|yyyy|yy|MMMM|MMM/g, (match) => {
    return map[match] ?? match;
  });
}

export function formatarDataDocumentoLegal(data: Date | string | number | null | undefined) {
  if (data instanceof Date) {
    return formatarData(data.toISOString().slice(0, 10));
  }

  return formatarData(data);
}

export function formatarCompetencia(input: string | undefined | null): string {
  if (!input) {
    return "";
  }

  const [ano, mes] = input.split("-");

  if (!ano || !mes) {
    return input;
  }

  return `${mes.padStart(2, "0")}/${ano}`;
}

/**
 * Formata uma data para o padrão brasileiro.
 */
export function formatarDataBr(
  input: Date | string | number | undefined | null,
  opts: Intl.DateTimeFormatOptions = {},
): string {
  if (!input) {
    return "";
  }

  const date = safeParseDate(input);

  if (!date) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: opts.day ?? "numeric",
    month: opts.month ?? "long",
    year: opts.year ?? "numeric",
    ...opts,
  }).format(date);
}

export function calcularIdadeCompleta(
  dataNascimento: Date | string | number | undefined | null,
): string {
  if (!dataNascimento) {
    return "";
  }

  const nascimento = safeParseDate(dataNascimento);

  if (!nascimento) {
    return "";
  }

  const hoje = new Date();

  let anos = hoje.getFullYear() - nascimento.getFullYear();

  let meses = hoje.getMonth() - nascimento.getMonth();

  let dias = hoje.getDate() - nascimento.getDate();

  if (dias < 0) {
    const ultimoDiaMesAnterior = new Date(hoje.getFullYear(), hoje.getMonth(), 0).getDate();

    dias += ultimoDiaMesAnterior;
    meses--;
  }

  if (meses < 0) {
    meses += 12;
    anos--;
  }

  return `${anos} anos, ${meses} meses e ${dias} dias`;
}

export function toDateInputValue(input: Date | string | number | undefined | null): string {
  if (!input) {
    return "";
  }

  const date = safeParseDate(input);

  if (!date) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function criarDataLocal(data: string): Date {
  const [ano, mes, dia] = data.split("-").map(Number);

  return new Date(ano, mes - 1, dia);
}

export function formatarDataIso(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}

export interface DiaGrade {
  date: Date;
  mesAtual: boolean;
  isHoje: boolean;
}

function isSameDia(a: Date, b: Date): boolean {
  return (
    a.getDate() === b.getDate() &&
    a.getMonth() === b.getMonth() &&
    a.getFullYear() === b.getFullYear()
  );
}

export function getDiasDoMes(ano: number, mes: number): DiaGrade[] {
  const hoje = new Date();
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const inicioPadding = primeiroDia.getDay();
  const fimPadding = 6 - ultimoDia.getDay();
  const dias: DiaGrade[] = [];

  for (let i = inicioPadding - 1; i >= 0; i--) {
    const date = new Date(ano, mes, -i);
    dias.push({ date, mesAtual: false, isHoje: isSameDia(date, hoje) });
  }

  for (let dia = 1; dia <= ultimoDia.getDate(); dia++) {
    const date = new Date(ano, mes, dia);
    dias.push({ date, mesAtual: true, isHoje: isSameDia(date, hoje) });
  }

  for (let i = 1; i <= fimPadding; i++) {
    const date = new Date(ano, mes + 1, i);
    dias.push({ date, mesAtual: false, isHoje: isSameDia(date, hoje) });
  }

  return dias;
}

export function getDiasDaSemana(date: Date): DiaGrade[] {
  const hoje = new Date();
  const domingo = new Date(date);
  domingo.setDate(date.getDate() - date.getDay());

  return Array.from({ length: 7 }, (_, i) => {
    const dia = new Date(domingo);
    dia.setDate(domingo.getDate() + i);
    return { date: dia, mesAtual: true, isHoje: isSameDia(dia, hoje) };
  });
}

export const DIAS_SEMANA_ABREV = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export const HORAS_DIA = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, "0")}:00`);

export function adicionarMinutosHorario(horario: string, minutos: number): string {
  const [hora, minuto] = horario.split(":").map(Number);
  const totalMinutos = hora * 60 + minuto + minutos;
  const horaFinal = Math.max(0, Math.min(23 * 60 + 59, totalMinutos));
  const horas = String(Math.floor(horaFinal / 60)).padStart(2, "0");
  const minutosRestantes = String(horaFinal % 60).padStart(2, "0");

  return `${horas}:${minutosRestantes}`;
}

export function proximoHorarioPadrao(date = new Date()): string {
  const horas = date.getHours();
  const minutos = date.getMinutes();

  if (minutos === 0) {
    return `${String(horas).padStart(2, "0")}:00`;
  }

  const proximaHora = Math.min(23, horas + 1);
  return `${String(proximaHora).padStart(2, "0")}:00`;
}

export function somarDias(date: Date, dias: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + dias);

  return next;
}

export function somarHoras(date: Date, horas: number): Date {
  const next = new Date(date);
  next.setHours(next.getHours() + horas);

  return next;
}

export function somarMeses(date: Date, meses: number): Date {
  const next = new Date(date);
  next.setMonth(next.getMonth() + meses);

  return next;
}

export function somarAnos(date: Date, anos: number): Date {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + anos);

  return next;
}

// lib/agendamento.ts
// Mapeia o enum do Prisma para o índice do JS (0 = domingo)
const DIA_SEMANA_JS: Record<string, number> = {
  DOMINGO: 0,
  SEGUNDA: 1,
  TERCA: 2,
  QUARTA: 3,
  QUINTA: 4,
  SEXTA: 5,
  SABADO: 6,
};

/**
 * Retorna todas as datas "YYYY-MM-DD" num intervalo
 * que batem com o diaSemana da recorrência.
 */
export function getDatasNaFaixa(
  inicio: string, // "YYYY-MM-DD"
  fim: string, // "YYYY-MM-DD"
  diaSemana: string,
): string[] {
  const diaAlvo = DIA_SEMANA_JS[diaSemana];
  const atual = safeParseDate(inicio)!;
  const dataFim = safeParseDate(fim)!;
  const datas: string[] = [];

  // avança até o primeiro dia da semana alvo
  while (atual.getDay() !== diaAlvo) {
    atual.setDate(atual.getDate() + 1);
  }

  while (atual <= dataFim) {
    datas.push(formatarData(atual, "yyyy-MM-dd"));
    atual.setDate(atual.getDate() + 7);
  }

  return datas;
}

/**
 * Combina "YYYY-MM-DD" + "HH:mm" num Date local,
 * sem nenhum risco de timezone shift.
 */
export function combinaDataHora(data: string, hora: string): Date {
  const [h, m] = hora.split(":").map(Number);
  const date = criarDataLocal(data);
  date.setHours(h, m);

  return date;
}

export function diaAnterior(data: string) {
  return formatarDataIso(somarDias(criarDataLocal(data), -1));
}

export function getInicioMesIso(
  input: Date | string | number | undefined | null = new Date(),
): string {
  const data = toDateInputValue(input);

  if (!data) {
    return "";
  }

  return `${data.slice(0, 7)}-01`;
}

export function getFimMesIso(
  input: Date | string | number | undefined | null = new Date(),
): string {
  const data = safeParseDate(input);

  if (!data) {
    return "";
  }

  return formatarDataIso(new Date(data.getFullYear(), data.getMonth() + 1, 0));
}

export function getMesAno(input: Date | string | number | undefined | null = new Date()): string {
  const data = safeParseDate(input);

  if (!data) {
    return "";
  }

  return new Intl.DateTimeFormat("pt-BR", {
    month: "long",
    year: "numeric",
  }).format(new Date(data.getFullYear(), data.getMonth(), 1));
}
