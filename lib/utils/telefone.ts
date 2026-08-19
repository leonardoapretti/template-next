export const formatarTelefoneBR = (value: string | null | undefined) => {
  if (!value) {
    return "";
  }
  const digits = value.replace(/\D/g, "").slice(0, 11);

  if (digits.length <= 10) {
    // fixo: (11) 3333-4444
    return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{4})(\d)/, "$1-$2");
  }

  // celular: (11) 99999-9999
  return digits.replace(/(\d{2})(\d)/, "($1) $2").replace(/(\d{5})(\d)/, "$1-$2");
};
