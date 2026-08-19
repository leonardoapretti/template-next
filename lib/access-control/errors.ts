export class AccessDeniedError extends Error {
  code = "ACCESS_DENIED";

  constructor(message = "Você não tem permissão para acessar este recurso.") {
    super(message);
    this.name = "AccessDeniedError";
  }
}

export class AuthenticationRequiredError extends Error {
  code = "AUTHENTICATION_REQUIRED";

  constructor(message = "Faça login para continuar.") {
    super(message);
    this.name = "AuthenticationRequiredError";
  }
}

export class ProfileRequiredError extends AccessDeniedError {
  code = "PROFILE_REQUIRED";

  constructor(message = "Perfil de acesso obrigatório para esta ação.") {
    super(message);
    this.name = "ProfileRequiredError";
  }
}
