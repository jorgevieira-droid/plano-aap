## Por que está dando "Database error deleting user"

O usuário `Gestor de Parceria Teste` tem registros vinculados: 2 em `registros_acao`, 1 em `programacoes`, 1 em `instrument_responses`. Investigando as foreign keys, encontrei a causa exata:

1. `profiles.id` → `auth.users` está com **ON DELETE CASCADE**.
2. `registros_acao.aap_id` / `programacoes.aap_id` / `avaliacoes_aula.aap_id` → `profiles.id` também com **CASCADE**.
3. Quando o admin apaga o usuário, o profile é apagado em cascata, e isso dispara DELETE em `registros_acao`.
4. Esse DELETE aciona o trigger `log_registro_acao_changes`, que faz `INSERT INTO registros_alteracoes` com `usuario_id = auth.uid()`.
5. Como a deleção roda no contexto admin (service role), `auth.uid()` retorna NULL — e a coluna `registros_alteracoes.usuario_id` é **NOT NULL**. Tudo a transação aborta e a auth devolve "Database error deleting user".

Há também um problema sério de **perda de histórico**: hoje, apagar um usuário apagaria em cascata todas as ações, programações e avaliações dele.

## O que vou fazer

### 1. Preservar histórico (migração de FKs)
Trocar `ON DELETE CASCADE` por `ON DELETE SET NULL` nas FKs de "autor/ator" — assim apagar um usuário **mantém** os registros, apenas zera o vínculo:

- `registros_acao.aap_id` → SET NULL
- `programacoes.aap_id` → SET NULL
- `programacoes.created_by` → já é `a` (no action), trocar para SET NULL
- `avaliacoes_aula.aap_id` → SET NULL
- `relatorios_*` (`created_by`, `avaliador_id`) → SET NULL (alguns já são `n`, padronizar)
- `notion_sync_config.system_user_id` → SET NULL

As FKs de "associação" (`user_roles`, `user_programas`, `user_entidades`, `aap_escolas`, `aap_programas`, `gestor_programas`) ficam em CASCADE — faz sentido remover esses vínculos quando o usuário some.

`profiles.id → auth.users` continua CASCADE (1-pra-1 com a conta).

### 2. Corrigir o trigger de auditoria
Duas mudanças complementares para que a auditoria nunca quebre uma operação:

- Tornar `registros_alteracoes.usuario_id` **nullable** (ações automáticas/sistema legitimamente não têm usuário).
- Ajustar `log_registro_acao_changes` para gravar `usuario_id = auth.uid()` (que vira NULL) sem falhar; opcionalmente pular o INSERT quando `TG_OP = 'DELETE' AND auth.uid() IS NULL` para não poluir o histórico com cascatas.

### 3. Sem mudança no frontend
A `manage-users` (edge function) e a tela de usuários não precisam de alteração — o fluxo de exclusão atual passa a funcionar e o usuário "Gestor de Parceria Teste" poderá ser deletado preservando os registros que ele criou.

## Fora de escopo
- Não vou apagar registros existentes do usuário em questão; após a migração eles passarão a ter `aap_id = NULL` quando ele for excluído pela tela.
- Não vou alterar a coluna `instrument_responses.aap_id` (ela já não tem FK, então não bloqueia nada — fica como está).
