## Objetivo

1. **Não contabilizar** registros de ações/formulários **inativos** em nenhum gráfico ou card do Dashboard e dos Relatórios.
2. **Excluir do banco** os registros de formulários inativos que estejam **pendentes** (não realizados nem cancelados).

## O que é "inativo"

Uma ação/formulário é considerada inativa quando existe um registro em `form_config_settings` com a lista de programas **vazia** (`programas = {}`). Isso já é a fonte de verdade usada pelo hook `useAcoesByPrograma` (`isAcaoInativa`, `src/hooks/useAcoesByPrograma.ts:55`).

Hoje os tipos inativos são: **observacao_aula**, **autoavaliacao** e **formacao**.

## Parte 1 — Excluir inativos de gráficos e cards

Atualmente o gráfico "Previsto x Realizado" já filtra por `getAcoesByPrograma` (exclui inativos), mas os **conjuntos de dados base** usados pelos cards de totais, presença e acompanhamento **não** filtram por tipo inativo. Vou aplicar o filtro `isAcaoInativa(tipo)` nas bases.

### `src/pages/admin/AdminDashboard.tsx`
- Passar a desestruturar `isAcaoInativa` do hook (`linha ~140`).
- Excluir registros/programações de tipo inativo nas bases:
  - `filteredRegistros` (~512), `filteredProgramacoes`/`programacoesUiFiltered` (~494), `programacoesCanceladas` (~498), `filteredRegistrosPendentesDateFiltered` (~525): adicionar `if (isAcaoInativa(tipo)) return false;`.
  - `filteredAvaliacoes`: as avaliações se ligam a `registro_acao_id`; montar um `Set` de IDs de registros com tipo inativo e excluir as avaliações correspondentes (cobre o radar/cards de Acompanhamento padrão, alimentado por `observacao_aula`).

### `src/pages/admin/RelatoriosPage.tsx`
- Desestruturar `isAcaoInativa` (~150).
- Aplicar o mesmo filtro em `filteredRegistros` (~517), `filteredProgramacoes`, e `filteredAvaliacoes` (~603), além do `totalAvaliacoes`/médias derivados.

Resultado: nenhum tipo inativo aparece em contagens, percentuais de presença, médias de acompanhamento ou tabelas.

## Parte 2 — Excluir registros pendentes de formulários inativos

"Pendente" = status diferente de `realizada` e `cancelada` (ou seja, `agendada`, `reagendada`, `prevista`). Registros já realizados são preservados (histórico).

Registros que serão excluídos (derivados dinamicamente dos tipos inativos em `form_config_settings`):

| Tabela | Tipo | Status | Qtd |
|--------|------|--------|-----|
| programacoes | formacao | prevista | 3 |
| programacoes | observacao_aula | prevista | 8 |
| registros_acao | formacao | prevista | 3 |
| registros_acao | observacao_aula | agendada | 1 |
| registros_acao | observacao_aula | prevista | 1 |

SQL (em migration, desativando temporariamente o trigger de auditoria de `registros_acao`, pois ele exige `auth.uid()` que é nulo neste contexto):

```sql
ALTER TABLE public.registros_acao DISABLE TRIGGER USER;
DELETE FROM public.registros_acao
WHERE status NOT IN ('realizada','cancelada')
  AND tipo IN (SELECT form_key FROM public.form_config_settings
               WHERE COALESCE(array_length(programas,1),0) = 0);
ALTER TABLE public.registros_acao ENABLE TRIGGER USER;

DELETE FROM public.programacoes
WHERE status NOT IN ('realizada','cancelada')
  AND tipo IN (SELECT form_key FROM public.form_config_settings
               WHERE COALESCE(array_length(programas,1),0) = 0);
```

## Fora de escopo
- Não altero o schema nem as regras de ativação/desativação de formulários.
- Não excluo registros `realizada`/`cancelada` de formulários inativos (preservados como histórico).

## Detalhe técnico
A filtragem reaproveita `isAcaoInativa` (já exportado pelo hook), garantindo uma única fonte de verdade. A exclusão usa subquery em `form_config_settings`, então permanece correta mesmo que a lista de inativos mude no futuro.
