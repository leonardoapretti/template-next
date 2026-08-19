import { CredentialsSignin } from "next-auth";

export class EmailNaoVerificadoError extends CredentialsSignin {
  code = "EMAIL_NAO_VERIFICADO";

  constructor() {
    super("EMAIL_NAO_VERIFICADO");
  }
}

export class RateLimitExcedidoError extends CredentialsSignin {
  code = "RATE_LIMIT_EXCEDIDO";

  constructor() {
    super("RATE_LIMIT_EXCEDIDO");
  }
}
