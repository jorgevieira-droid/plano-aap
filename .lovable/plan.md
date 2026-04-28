## Conectar Metabase ao banco de dados

Sim, é possível. O backend deste projeto roda em PostgreSQL gerenciado (Lovable Cloud / Supabase), e o Metabase tem suporte nativo a Postgres. Há duas formas recomendadas — escolha conforme o caso de uso.

---

### Opção A — Usuário read-only dedicado (recomendado)

Criar um usuário Postgres separado, somente-leitura, exclusivo para o Metabase. É a abordagem mais segura e auditável.

**O que será feito:**

1. **Migração SQL** criando:
   - Role `metabase_ro` com senha forte (gerada e entregue uma única vez).
   - `GRANT CONNECT` no banco e `USAGE` no schema `public`.
   - `GRANT SELECT` em todas as tabelas existentes do schema `public`.
   - `ALTER DEFAULT PRIVILEGES` para que tabelas futuras também fiquem legíveis automaticamente.
   - `REVOKE` explícito de qualquer permissão de escrita (INSERT/UPDATE/DELETE/TRUNCATE).
   - Bloqueio de acesso a schemas sensíveis (`auth`, `storage`, `vault`, `supabase_functions`, `realtime`).

2. **Credenciais de conexão para o Metabase:**
   - Host: `db.ynqpvyimpqovcbqtcntw.supabase.co` (porta direta `5432`) **ou** o pooler `aws-0-<region>.pooler.supabase.com` (porta `6543`, modo transaction — preferível para Metabase que abre muitas conexões).
   - Database: `postgres`
   - User: `metabase_ro`
   - Password: gerada na migração
   - SSL: **obrigatório** (`sslmode=require`)

3. **Considerações de RLS:**
   - As políticas RLS atuais são por `auth.uid()`. Um usuário Postgres direto **bypassa RLS** quando não é `authenticated`. Como o `metabase_ro` terá apenas SELECT e nenhum vínculo com `auth.users`, ele verá todas as linhas — comportamento esperado para BI interno.
   - Se quiser restringir tabelas específicas (ex.: ocultar `profiles.email`, hashes, logs sensíveis), criamos views públicas reduzidas e damos `SELECT` apenas nelas, revogando das tabelas-base.

---

### Opção B — Replicar para um Postgres externo / BigQuery

Já existe export diário para BigQuery (10 tabelas core, ver memória `gcp-bigquery-export`). O Metabase também conecta nativamente a BigQuery. Vantagens: zero impacto no banco de produção, sem credenciais Postgres expostas. Desvantagem: defasagem de até 24h.

Não exige nenhuma mudança no projeto se o conjunto atual de 10 tabelas já atende.

---

### Recomendação

Opção A com o **pooler** (porta 6543) e SSL obrigatório, restringindo a `SELECT` em `public`. Cobre dashboards em tempo real e mantém o banco protegido.

---

### Perguntas antes de implementar

1. **Opção A (Postgres direto read-only) ou B (usar o BigQuery já existente)?**
2. Se Opção A: alguma tabela/coluna que **não** deve ficar visível no Metabase (ex.: `profiles.email`, `user_access_log`, secrets)?
3. O Metabase está hospedado onde? (Cloud, self-hosted com IP fixo) — útil para avaliar se vale restringir por IP no futuro.

Após sua resposta, gero a migração e entrego as credenciais de conexão.