import bcrypt from "bcryptjs";
import type { Prisma } from "../generated/prisma/client";
import { permissionKeys } from "../lib/access-control/permission-registry";
import {
  NOME_ROLE_ADMINISTRADOR,
  NOME_ROLE_PROFISSIONAL,
  NOME_ROLE_PROPRIETARIO,
  NOME_ROLE_SECRETARIO,
  papeisPadraoDoSistema,
} from "../lib/access-control/policy";
import type { DbClient } from "../lib/db";
import type { SemCamposHash } from "../lib/services/crypto/tipos";

const SENHA_PADRAO = "senha123";
const CODIGO_PLANO_PADRAO = "PADRAO";
// Mesmo e-mail semeado como admin da plataforma em seed-admin.ts (que roda
// antes desta seed, ver prisma/seed.ts) — vinculado aqui como Administrador
// nas duas empresas pra exercitar, com o mesmo login, tanto o bypass de
// admin da plataforma quanto a troca de empresa ativa no sidebar.
const ADMIN_EMAIL = "admin@example.com";

type UsuarioSeed = { email: string; nome: string };

// Demonstra o cenário pedido explicitamente: um usuário admin vinculado a
// diversas empresas ao mesmo tempo (dupla@example.com), além de usuários
// com um único vínculo cada, em papéis diferentes — para exercitar tanto
// o multi-tenant (troca de empresa ativa) quanto o motor de permissões
// por papel (os 4 papéis padrão do sistema, ver policy.ts).
const USUARIOS: UsuarioSeed[] = [
  { email: "proprietario@example.com", nome: "Proprietário Alfa" },
  { email: "gerente@example.com", nome: "Gerente Beta" },
  { email: "financeiro@example.com", nome: "Financeiro Alfa" },
  { email: "secretaria@example.com", nome: "Secretária Alfa" },
  { email: "profissional@example.com", nome: "Profissional Alfa" },
  { email: "dupla@example.com", nome: "Usuário Multi-empresa" },
];

async function upsertUsuario(db: DbClient, usuario: UsuarioSeed) {
  const senhaHash = await bcrypt.hash(SENHA_PADRAO, 12);

  return db.user.upsert({
    where: { email: usuario.email } as Prisma.UserWhereUniqueInput,
    update: {
      nome: usuario.nome,
      senha: senhaHash,
      emailVerificado: new Date(),
    } satisfies SemCamposHash<Prisma.UserUpdateInput> as Prisma.UserUpdateInput,
    create: {
      nome: usuario.nome,
      email: usuario.email,
      senha: senhaHash,
      emailVerificado: new Date(),
    } satisfies SemCamposHash<Prisma.UserCreateInput> as Prisma.UserCreateInput,
  });
}

async function upsertEmpresaComPapeis(db: DbClient, nome: string, planoId: string) {
  const empresasExistentes = await db.empresa.findMany({
    where: { nome },
    select: { id: true, nome: true },
  });

  const empresa =
    empresasExistentes[0] ??
    (await db.empresa.create({ data: { nome, planoId } }));

  const papeisCriados = await Promise.all(
    papeisPadraoDoSistema().map((papel) =>
      db.role.upsert({
        where: { empresaId_nome: { empresaId: empresa.id, nome: papel.nome } },
        update: { permissoes: papel.permissoes, padraoSistema: true },
        create: {
          empresaId: empresa.id,
          nome: papel.nome,
          permissoes: papel.permissoes,
          padraoSistema: true,
        },
      }),
    ),
  );

  const porNome = Object.fromEntries(papeisCriados.map((papel) => [papel.nome, papel]));

  return {
    empresa,
    roleProprietario: porNome[NOME_ROLE_PROPRIETARIO],
    roleAdministrador: porNome[NOME_ROLE_ADMINISTRADOR],
    roleSecretario: porNome[NOME_ROLE_SECRETARIO],
    roleProfissional: porNome[NOME_ROLE_PROFISSIONAL],
  };
}

async function vincularMembro(
  db: DbClient,
  params: { empresaId: string; usuarioId: string; roleId: string },
) {
  await db.membroEmpresa.upsert({
    where: { empresaId_usuarioId: { empresaId: params.empresaId, usuarioId: params.usuarioId } },
    update: { roleId: params.roleId, ativo: true },
    create: { empresaId: params.empresaId, usuarioId: params.usuarioId, roleId: params.roleId },
  });
}

export async function seedEmpresas(db: DbClient) {
  const plano = await db.plano.upsert({
    where: { codigo: CODIGO_PLANO_PADRAO },
    update: {},
    create: { codigo: CODIGO_PLANO_PADRAO, nome: "Padrão" },
  });

  await db.$transaction(
    permissionKeys.map((chave) =>
      db.planoPermissao.upsert({
        where: { planoId_chave: { planoId: plano.id, chave } },
        update: { permitido: true },
        create: { planoId: plano.id, chave, permitido: true },
      }),
    ),
  );

  const alfa = await upsertEmpresaComPapeis(db, "Empresa Alfa Ltda", plano.id);
  const beta = await upsertEmpresaComPapeis(db, "Empresa Beta Comércio", plano.id);

  const usuarios = Object.fromEntries(
    await Promise.all(
      USUARIOS.map(async (usuario) => [usuario.email, await upsertUsuario(db, usuario)] as const),
    ),
  );

  const admin = await db.user.findUniqueOrThrow({
    where: { email: ADMIN_EMAIL } as Prisma.UserWhereUniqueInput,
  });

  // proprietario@: só Empresa Alfa, como Proprietário.
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: usuarios["proprietario@example.com"].id,
    roleId: alfa.roleProprietario.id,
  });

  // financeiro@: só Empresa Alfa, como Administrador.
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: usuarios["financeiro@example.com"].id,
    roleId: alfa.roleAdministrador.id,
  });

  // secretaria@: só Empresa Alfa, como Secretário (tudo menos exclusões).
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: usuarios["secretaria@example.com"].id,
    roleId: alfa.roleSecretario.id,
  });

  // profissional@: só Empresa Alfa, como Profissional.
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: usuarios["profissional@example.com"].id,
    roleId: alfa.roleProfissional.id,
  });

  // gerente@: só Empresa Beta, como Administrador.
  await vincularMembro(db, {
    empresaId: beta.empresa.id,
    usuarioId: usuarios["gerente@example.com"].id,
    roleId: beta.roleAdministrador.id,
  });

  // dupla@: vinculado às duas empresas ao mesmo tempo — Proprietário na
  // Alfa, Administrador na Beta. É o cenário de "admin compartilhado
  // entre diversas empresas" pedido explicitamente.
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: usuarios["dupla@example.com"].id,
    roleId: alfa.roleProprietario.id,
  });
  await vincularMembro(db, {
    empresaId: beta.empresa.id,
    usuarioId: usuarios["dupla@example.com"].id,
    roleId: beta.roleAdministrador.id,
  });

  // admin@: admin da plataforma (bypass total em canUseFeature) e também
  // Administrador nas duas empresas ao mesmo tempo — precisa de mais de um
  // vínculo pra o dropdown de troca de empresa no sidebar ter o que listar,
  // exercitando alternância de empresa com o mesmo login de admin.
  await vincularMembro(db, {
    empresaId: alfa.empresa.id,
    usuarioId: admin.id,
    roleId: alfa.roleAdministrador.id,
  });
  await vincularMembro(db, {
    empresaId: beta.empresa.id,
    usuarioId: admin.id,
    roleId: beta.roleAdministrador.id,
  });

  console.log("Empresas e usuários de demonstração:");
  console.log(`  Plano: ${plano.nome} (${plano.codigo}) — todas as permissões liberadas`);
  console.log(`  Empresa: ${alfa.empresa.nome}`);
  console.log(`  Empresa: ${beta.empresa.nome}`);
  console.log(`  Usuários (senha para todos: ${SENHA_PADRAO}):`);
  console.log("    proprietario@example.com — Proprietário da Empresa Alfa Ltda");
  console.log("    financeiro@example.com   — Administrador da Empresa Alfa Ltda");
  console.log("    secretaria@example.com   — Secretário da Empresa Alfa Ltda");
  console.log("    profissional@example.com — Profissional da Empresa Alfa Ltda");
  console.log("    gerente@example.com      — Administrador da Empresa Beta Comércio");
  console.log(
    "    dupla@example.com        — Proprietário da Empresa Alfa Ltda + Administrador da Empresa Beta Comércio",
  );
  console.log(
    "    admin@example.com        — Admin da plataforma + Administrador da Empresa Alfa Ltda + Administrador da Empresa Beta Comércio",
  );
}
