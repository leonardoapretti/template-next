// src/lib/email/resend.ts
import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;

if (!apiKey) {
  throw new Error("RESEND_API_KEY não configurada.");
}

const isDevelopment = process.env.NODE_ENV === "development";

const destinatarioDev = process.env.EMAIL_DESTINATARIO_DEV || undefined;

export const resend = new Resend(apiKey);

export const resendConfig = {
  from: process.env.RESEND_FROM_EMAIL ?? "Template <onboarding@resend.dev>",

  /**
   * Em development, se EMAIL_DESTINATARIO_DEV estiver definido,
   * todos os e-mails são enviados para esse endereço.
   *
   * Em production, sempre envia para o destinatário real.
   */
  destinatarioDev: isDevelopment ? destinatarioDev : undefined,

  isDevelopment,
};
