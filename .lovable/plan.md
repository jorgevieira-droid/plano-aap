## Diagnóstico (confirmado no banco)

Existem **duas ações distintas** no dia 23/04/2026 em Caraguatatuba:

- "Formação Microciclos | Caraguatatuba - 1º encontro (**Turma A**)" — 48 registros de presença gravados, 45 presentes
- "Formação Microciclos | Caraguatatuba - 1º encontro (**Turma B**)" — 23 registros, 23 presentes

A rede tem 24 atores na Turma A e 23 na Turma B (47 no total).

Causa: as presenças da ação da Turma A foram gravadas **antes/sem o filtro de turma**, salvando os 48 atores da rede inteira (a lista completa da entidade). Hoje o diálogo "Gerenciar Presenças" filtra corretamente pela turma da programação e mostra 24 pessoas (23 presentes), mas a coluna da tabela conta as linhas cruas de `presencas` (48 linhas / 45 presentes). Daí a divergência 45/48 vs 23/24.

Levantamento: **2 registros** afetados, com **51 linhas de presença** de pessoas fora da turma da ação.

## O que fazer

1. **Limpeza de dados (migração pontual)**
   Remover as linhas de `presencas` cujo `professores.turma_formacao` difere da `turma_formacao` da programação vinculada (apenas para ações com turma definida). Isso corrige os 2 registros existentes e alinha a tabela ao diálogo.

2. **Contagem coerente na tabela (`src/pages/admin/RegistrosPage.tsx`)**
   Fazer a coluna "Presença/Avaliações" contar apenas as presenças de atores que ainda pertencem à lista elegível (`getAvailableProfessors`), em vez de todas as linhas de `presencas`. Assim, mesmo que sobre resíduo, a tela nunca mostra número diferente do diálogo.

3. **Prevenção ao salvar**
   No salvamento de presenças, além do `delete` por `registro_acao_id` já existente, garantir que só sejam inseridos atores da lista elegível (já é o comportamento atual do `presencaList`) — o passo 2 cobre registros legados; nenhuma mudança de regra de negócio é introduzida.

## Detalhes técnicos

- Tabelas envolvidas: `presencas`, `registros_acao`, `programacoes.turma_formacao`, `professores.turma_formacao`.
- Alteração de front-end restrita ao cálculo de `presentes`/`total` em `RegistrosPage.tsx` (linhas ~1773-1775), reaproveitando `getAvailableProfessors(registro)`.
- Nenhuma alteração em RLS, permissões ou fluxo de registro.
