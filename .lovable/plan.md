## Problema

Ao clicar em **"Salvar Presenças"** no encontro formativo de microciclo, aparece o toast genérico **"Erro ao salvar presenças"**.

A usuária do replay (Heloisa Jordão, **CPed / N4.1**, programa REDES Municipais) está tentando salvar presenças em uma `programacao` cujo `aap_id` é de outro ator (Formador/GPI da mesma rede). Ela enxerga a ação porque o RLS de SELECT permite visualizar dentro do mesmo programa, mas as policies de **INSERT/UPDATE** das tabelas envolvidas exigem `aap_id = auth.uid()` — ou seja, só o "dono" da ação consegue gravar.

Tabelas afetadas (policies atuais "N4N5 Operational ..."):
- `presencas` — INSERT exige `EXISTS registros_acao r WHERE r.id = ... AND r.aap_id = auth.uid()`
- `instrument_responses` — INSERT exige `aap_id = auth.uid()`
- `relatorios_microciclos_recomposicao` — ALL exige `aap_id = auth.uid()`
- `registros_acao` — UPDATE/DELETE exige `aap_id = auth.uid()`
- `programacoes` — UPDATE de status realizada (mesmo padrão)

Como microciclos (e demais encontros REDES) são uma rotina **compartilhada entre o time da rede municipal** (Formador agenda, CPed/GPI podem registrar), o comportamento esperado é: qualquer N4.1/N4.2/N5 que **compartilhe entidade e programa** com a ação deve poder registrar presenças e instrumento.

## Plano

### 1. Migração de RLS — abrir gravação compartilhada para N4N5

Adicionar policies extras (sem remover as atuais de "owner") usando o helper já existente `user_has_full_data_access(_user_id, _escola_id, _programa text[])` (mesmo critério usado no SELECT de `registros_acao`). Aplicar nas tabelas:

- `presencas` — INSERT/UPDATE/DELETE quando `is_operational(auth.uid())` E existe `registros_acao r` com `r.id = presencas.registro_acao_id` E `user_has_full_data_access(auth.uid(), r.escola_id, r.programa)`.
- `instrument_responses` — INSERT/UPDATE/DELETE com mesma checagem via `registros_acao`.
- `relatorios_microciclos_recomposicao` — INSERT/UPDATE/DELETE quando `registro_acao_id` aponta para registro acessível (mesmo padrão); manter policy de owner para o caso `registro_acao_id IS NULL`.
- `registros_acao` — UPDATE quando `is_operational(auth.uid()) AND user_has_full_data_access(auth.uid(), escola_id, programa)` (necessário para o passo de marcar `status='realizada'` quando o registro já existe).
- `programacoes` — UPDATE de status quando o usuário compartilha entidade/programa (mesma checagem). Manter policies atuais de owner.

Escopo: apenas tipos de ação compartilhados (encontros REDES e microciclo). Como `user_has_full_data_access` já é o critério oficial de "atuação compartilhada" usado no SELECT de registros, reaproveitá-lo mantém consistência sem precisar filtrar por tipo na policy.

### 2. Front-end — `handleSavePresencas` em `src/pages/admin/ProgramacaoPage.tsx`

- Quando criar um novo `registros_acao` para uma `programacao` de outro ator, **usar `selectedProgramacao.aap_id` como `aap_id` do registro** (em vez de `user.id`). Isso preserva a "titularidade" da ação e mantém a integridade dos relatórios por ator. (As novas policies acima permitirão a inserção mesmo que `aap_id != auth.uid()`.)
- Mesma lógica para o `instrument_responses` salvo em sequência: usar `selectedProgramacao.aap_id`.
- Trocar o toast genérico `"Erro ao salvar presenças"` pela mensagem detalhada do backend (`error?.message ?? error?.details ?? "Erro ao salvar presenças"`), seguindo o padrão Core de "priorizar erros do backend".

### 3. Validação

- Testar com a conta de Heloisa (N4.1 REDES) salvando presenças em uma programação de microciclo de outro ator dentro da mesma rede → deve concluir sem erro e criar `registros_acao` + `presencas` + `instrument_responses`.
- Testar que um N4.1 de **outra rede** (sem `user_has_full_data_access`) continua bloqueado.
- Testar fluxo do dono original (Formador) — não deve regredir.
- Testar formulário detalhado em `EncontroMicrociclosForm` (insert em `relatorios_microciclos_recomposicao`) com um CPed compartilhado.

## Arquivos a alterar

- Nova migração SQL em `supabase/migrations/` com as policies adicionais.
- `src/pages/admin/ProgramacaoPage.tsx` — `handleSavePresencas` (uso de `selectedProgramacao.aap_id` e mensagem de erro detalhada).
