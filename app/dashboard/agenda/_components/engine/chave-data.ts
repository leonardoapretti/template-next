/** Gera a chave "YYYY-MM-DD" usada como índice em `porData`. */
export function chaveData(date: Date): string {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0"),
  ].join("-");
}
