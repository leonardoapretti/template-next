// src/lib/services/email.service.ts
import { db } from "@/lib/db";
import { resend, resendConfig } from "@/lib/email/resend";
import { DataBaseResponse } from "./config/database-response";
import { getUsuarioAtualId } from "../access-control/current-user";

export type EnviarEmailParams = {
  destinatario?: string;
  assunto: string;
  texto?: string;
  html?: string;
  replyTo?: string;
  usarEmailUsuarioComoReplyTo?: boolean;
};

type EmailInfoItem = {
  label: string;
  value?: string | null;
};

export type EmailTemplateParams = {
  preheader?: string;
  titulo: string;
  saudacao?: string;
  paragrafos: string[];
  cta?: {
    label: string;
    url: string;
  };
  informacoes?: EmailInfoItem[];
  observacao?: string;
};

export function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      "'": "&#39;",
      '"': "&quot;",
    };

    return entities[character];
  });
}

function renderizarParagrafos(paragrafos: string[]) {
  return paragrafos
    .map(
      (paragrafo) =>
        `<p style="margin: 0 0 16px; color: #374151; font-size: 15px; line-height: 1.6;">${escapeHtml(paragrafo)}</p>`,
    )
    .join("");
}

function renderizarInformacoes(informacoes: EmailInfoItem[] = []) {
  const itens = informacoes.filter((item) => item.value);

  if (!itens.length) {
    return "";
  }

  return `
    <div style="margin: 24px 0; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      ${itens
        .map(
          (item) => `
            <div style="padding: 14px 16px; border-bottom: 1px solid #e5e7eb;">
              <div style="font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: #6b7280;">${escapeHtml(item.label)}</div>
              <div style="margin-top: 4px; font-size: 15px; color: #111827;">${escapeHtml(item.value ?? "")}</div>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

export function criarEmailHtml({
  preheader,
  titulo,
  saudacao,
  paragrafos,
  cta,
  informacoes,
  observacao,
}: EmailTemplateParams) {
  return `
    <!doctype html>
    <html lang="pt-BR">
      <head>
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>${escapeHtml(titulo)}</title>
      </head>
      <body style="margin: 0; padding: 0; background: #f3f4f6; font-family: Arial, sans-serif;">
        ${preheader ? `<div style="display:none;max-height:0;overflow:hidden;">${escapeHtml(preheader)}</div>` : ""}
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: #f3f4f6; padding: 32px 16px;">
          <tr>
            <td align="center">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 640px; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb;">
                <tr>
                  <td style="background: #111827; padding: 24px 28px;">
                    <div style="font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: #9ca3af;">Template</div>
                    <div style="margin-top: 8px; font-size: 24px; font-weight: 700; line-height: 1.25; color: #ffffff;">${escapeHtml(titulo)}</div>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 28px;">
                    ${saudacao ? `<p style="margin: 0 0 16px; color: #111827; font-size: 16px; font-weight: 700;">${escapeHtml(saudacao)}</p>` : ""}
                    ${renderizarParagrafos(paragrafos)}
                    ${renderizarInformacoes(informacoes)}
                    ${
                      cta
                        ? `<p style="margin: 24px 0;">
                            <a href="${escapeHtml(cta.url)}" style="display: inline-block; padding: 12px 18px; background: #111827; color: #ffffff; text-decoration: none; border-radius: 8px; font-weight: 700; font-size: 14px;">${escapeHtml(cta.label)}</a>
                          </p>`
                        : ""
                    }
                    ${
                      observacao
                        ? `<p style="margin: 24px 0 0; color: #6b7280; font-size: 13px; line-height: 1.5;">${escapeHtml(observacao)}</p>`
                        : ""
                    }
                  </td>
                </tr>
                <tr>
                  <td style="padding: 18px 28px; background: #f9fafb; border-top: 1px solid #e5e7eb; color: #6b7280; font-size: 12px; line-height: 1.5;">
                    Este e-mail foi enviado automaticamente. Se você não reconhece esta mensagem, ignore este e-mail.
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  `;
}

function resolverDestinatario(destinatario?: string) {
  return resendConfig.destinatarioDev ?? destinatario;
}

class EmailService {
  private async buscarEmailUsuarioAtual() {
    try {
      const usuarioId = await getUsuarioAtualId();

      const usuario = await db.user.findUnique({
        where: {
          id: usuarioId,
        },
        select: {
          email: true,
        },
      });

      return usuario?.email ?? null;
    } catch {
      return null;
    }
  }

  private async resolverReplyTo(params: EnviarEmailParams) {
    if (params.replyTo) {
      return params.replyTo;
    }

    if (params.usarEmailUsuarioComoReplyTo === false) {
      return null;
    }

    return this.buscarEmailUsuarioAtual();
  }

  async enviarEmail(params: EnviarEmailParams) {
    try {
      if (!params.texto && !params.html) {
        return DataBaseResponse.error({
          code: "VALIDATION_ERROR",
          message: "Informe o conteúdo do e-mail.",
        });
      }

      const destinatario = resolverDestinatario(params.destinatario);
      const replyTo = await this.resolverReplyTo(params);

      if (!destinatario) {
        return DataBaseResponse.error({
          code: "EMAIL_DESTINATION_NOT_CONFIGURED",
          message: "Informe o destinatário do e-mail.",
        });
      }

      const base = {
        from: resendConfig.from,
        to: destinatario,
        subject: params.assunto,
        ...(replyTo ? { replyTo } : {}),
      };

      const payload = params.html
        ? {
            ...base,
            html: params.html,
          }
        : {
            ...base,
            text: params.texto ?? "",
          };

      const { data, error } = await resend.emails.send(payload);

      if (error) {
        return DataBaseResponse.error({
          code: "EMAIL_SEND_ERROR",
          message: error.message ?? "Não foi possível enviar o e-mail.",
        });
      }

      return DataBaseResponse.success({
        data,
        message: "E-mail enviado com sucesso.",
      });
    } catch (error) {
      console.error(error);

      return DataBaseResponse.error({
        code: "EMAIL_SEND_ERROR",
        message: "Erro inesperado ao enviar e-mail.",
      });
    }
  }

}

export const emailService = new EmailService();
