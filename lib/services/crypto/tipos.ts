// `emailHash` é required nos tipos de input do Prisma (coluna NOT NULL), mas
// quem o preenche é a encryptionExtension em runtime, nunca o chamador. Este
// tipo omite `emailHash` dos inputs de create/update, para que os services
// continuem passando só `email` em texto claro.
export type SemCamposHash<T> = Omit<T, "emailHash">;
