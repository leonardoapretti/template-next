-- Backfill dos perfis Secretário/Profissional (ver
-- lib/access-control/policy.ts.papeisPadraoDoSistema) em empresas que só
-- tinham os 2 perfis antigos (Proprietário/Administrador) — inclui a
-- empresa bootstrap criada pela migration de multi-tenant
-- (20260909213632_adiciona_multi_tenant_e_permissoes_por_plano). Não edita
-- a migration já aplicada; correções em migration já aplicada sempre
-- entram numa nova migration.
INSERT INTO "roles" ("id", "nome", "permissoes", "empresaId", "padraoSistema", "updatedAt")
SELECT
  'seed-secretario-' || e."id",
  'Secretário',
  ARRAY[
    'empresa:convidar', 'empresa:configurar', 'papeis:gerenciar',
    'agenda:read', 'agenda:create', 'agenda:update'
  ],
  e."id",
  true,
  CURRENT_TIMESTAMP
FROM "empresas" e
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."empresaId" = e."id" AND r."nome" = 'Secretário'
)
ON CONFLICT ("empresaId", "nome") DO NOTHING;

INSERT INTO "roles" ("id", "nome", "permissoes", "empresaId", "padraoSistema", "updatedAt")
SELECT
  'seed-profissional-' || e."id",
  'Profissional',
  ARRAY[
    'empresa:convidar', 'empresa:configurar', 'papeis:gerenciar',
    'agenda:read', 'agenda:create', 'agenda:update'
  ],
  e."id",
  true,
  CURRENT_TIMESTAMP
FROM "empresas" e
WHERE NOT EXISTS (
  SELECT 1 FROM "roles" r WHERE r."empresaId" = e."id" AND r."nome" = 'Profissional'
)
ON CONFLICT ("empresaId", "nome") DO NOTHING;

-- Papéis criados antes de "agenda:read" existir no catálogo (ex.: os
-- bootstrap-role-* da migration de multi-tenant) tinham create/update/
-- delete liberados sem read — viola a trava de leitura introduzida depois
-- (permission-registry.ts.aplicarDependenciasDeLeitura). Corrige
-- adicionando "agenda:read" onde falta.
UPDATE "roles"
SET "permissoes" = array_append("permissoes", 'agenda:read')
WHERE NOT ('agenda:read' = ANY("permissoes"))
  AND (
    'agenda:create' = ANY("permissoes")
    OR 'agenda:update' = ANY("permissoes")
    OR 'agenda:delete' = ANY("permissoes")
  );
