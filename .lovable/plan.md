## Objetivo

Permitir que, em **Registros de Ações**, seja possível ajustar a presença dos atores envolvidos também nos **encontros formativos** (`encontro_professor_redes`, `encontro_eteg_redes`, `encontro_microciclos_recomposicao`), assim como já acontece hoje para **Formação**.

## Situação atual

- Em `RegistrosPage.tsx`, o botão "Gerenciar Presenças" (ícone Users) abre o diálogo de presença apenas para tipos não-instrumento (ex.: `formacao`, `lista_presenca`).
- Os três tipos de encontro são `INSTRUMENT_TYPE_SET`, então o mesmo botão hoje abre o **formulário do instrumento**, sem oferecer caminho para ajustar presença depois.
- A tabela `presencas` e toda a lógica (`presencaList`, `handleTogglePresenca`, salvamento, contador na coluna "Presença/Avaliações") já existem e funcionam.

## Mudança proposta

Adicionar, **somente para os tipos de encontro formativo**, um segundo botão de ação na coluna "Ações" — "Gerenciar Presenças" — que reaproveita o diálogo de presença já existente, sem alterar o fluxo do instrumento.

### Detalhes da implementação (em `src/pages/admin/RegistrosPage.tsx`)

1. Criar um conjunto `ENCONTRO_PRESENCE_TYPES = new Set(['encontro_professor_redes', 'encontro_eteg_redes', 'encontro_microciclos_recomposicao'])`.

2. Nova função `handleOpenPresencaOnly(registro)` que:
   - faz `setSelectedRegistro(registro)`,
   - calcula `getAvailableProfessors(registro)` (a lógica atual já cobre formação via `tipo_ator_presenca`; replicar/estender para os encontros usando o mesmo critério de escola + filtros do registro),
   - carrega `presencas` existentes em `presencaList`,
   - abre o diálogo de presenças (`setIsManaging(true)`) **sem** abrir o instrumento.

3. Na coluna "Ações" (linha ~1434), quando `ENCONTRO_PRESENCE_TYPES.has(registro.tipo)` e `canEdit(registro)`, renderizar um botão extra com ícone `Users`, title "Gerenciar Presenças", chamando `handleOpenPresencaOnly`. O botão atual continua existindo e abre o formulário do instrumento.

4. Na coluna "Presença/Avaliações" (linha ~1418), passar a exibir o contador `presentes/total` também para os tipos de encontro (já é o comportamento padrão do `else`, então só precisa garantir que não há ramo especial que esconda).

5. Filtro de professores para encontros: usar a mesma base de `getAvailableProfessors` da `formacao` (escola + `tipo_ator_presenca` quando definido na programação). Para `encontro_microciclos_recomposicao` e demais, considerar `turma_formacao` se preenchida (filtrar `professores.turma_formacao` igual), caindo para "todos da escola" caso não haja turma.

### O que NÃO muda

- Lógica de instrumentos (`instrument_responses`) e seu diálogo permanecem idênticos.
- Permissões (`canEdit`, `canDelete`, `acaoPermissions`) não mudam — o novo botão respeita `canEdit`.
- Schema do banco e RLS de `presencas` permanecem inalterados (RLS atual já cobre N1/N2/N3/N4/N5 para registros desses tipos).
- Comportamento de `formacao`, `lista_presenca`, `acompanhamento_aula` e `observacao_aula_redes` segue igual.
