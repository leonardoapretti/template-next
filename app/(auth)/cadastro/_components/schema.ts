import z from "zod";

const SENHAS_SEQUENCIAIS_COMUNS = [
  "0123456789",
  "9876543210",
  "abcdefghijklmnopqrstuvwxyz",
  "zyxwvutsrqponmlkjihgfedcba",
  "qwertyuiop",
  "poiuytrewq",
  "asdfghjkl",
  "lkjhgfdsa",
  "zxcvbnm",
  "mnbvcxz",
];

function possuiSequencia(value: string) {
  const senha = value.toLowerCase();

  // bloqueia 3 caracteres iguais seguidos: aaa, 111, !!! etc.
  if (/(.)\1\1/.test(senha)) {
    return true;
  }

  // bloqueia sequências comuns com 3 ou mais caracteres: abc, 123, qwe, asd etc.
  for (const sequencia of SENHAS_SEQUENCIAIS_COMUNS) {
    for (let tamanho = 3; tamanho <= Math.min(6, sequencia.length); tamanho++) {
      for (let index = 0; index <= sequencia.length - tamanho; index++) {
        const trecho = sequencia.slice(index, index + tamanho);

        if (senha.includes(trecho)) {
          return true;
        }
      }
    }
  }

  return false;
}

export const senhaForteSchema = z
  .string()
  .min(8, "A senha deve ter ao menos 8 caracteres.")
  .regex(/[A-Za-zÀ-ÿ]/, "A senha deve conter ao menos uma letra.")
  .regex(/\d/, "A senha deve conter ao menos um número.")
  .regex(/[^A-Za-zÀ-ÿ0-9]/, "A senha deve conter ao menos um caractere especial.")
  .refine((senha) => !possuiSequencia(senha), {
    message: "A senha não pode conter sequências como 123, abc, qwe ou caracteres repetidos.",
  });

export const cadastroSchema = z
  .object({
    nome: z.string().trim().min(3, "Informe seu nome completo."),
    email: z.email("Informe um e-mail válido."),
    senha: senhaForteSchema,
    confirmarSenha: z.string(),
  })
  .refine((data) => data.senha === data.confirmarSenha, {
    message: "As senhas não conferem.",
    path: ["confirmarSenha"],
  });

export type CadastroFormSchema = z.infer<typeof cadastroSchema>;
