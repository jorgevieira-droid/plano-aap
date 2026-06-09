## Objetivo

Na ação "Visitas Técnicas – Microciclos", a **Escola** selecionada no cadastro da ação (Programação) deve aparecer automaticamente — e travada — no formulário de gerenciamento, em vez de exigir que o usuário selecione novamente.

## Situação atual

- No **cadastro** (`ProgramacaoPage.tsx`) a Escola já é gravada em `programacoes.entidade_filho_id` (ajuste anterior já implementado).
- No **gerenciamento** (`RegistrosPage.tsx` → `VisitaTecnicaMicrociclosForm.tsx`) o campo "Escola*" é renderizado vazio, com "Selecione a escola", obrigando nova seleção. O valor só é pré-preenchido quando já existe um relatório salvo (via `relatorios_visita_tecnica_microciclos.nome_escola`).

## Ajuste proposto

### 1. `RegistrosPage.tsx` (abertura do form)
- Ao montar `<VisitaTecnicaMicrociclosForm>`, ler `prog.entidade_filho_id` da `programacao` vinculada e localizar o nome correspondente na lista de `entidades_filho` (já carregada na página) ou via lookup.
- Passar duas novas props ao form: `entidadeFilhoId` e `entidadeFilhoNome`.

### 2. `VisitaTecnicaMicrociclosForm.tsx`
- Adicionar as props `entidadeFilhoId?: string` e `entidadeFilhoNome?: string` na interface.
- Em `defaultValues`, inicializar `nome_escola` com `entidadeFilhoNome` quando presente.
- No `useEffect` de pré-preenchimento (registro existente), priorizar `entidadeFilhoNome` sobre `existing.nome_escola` (a fonte da verdade passa a ser a programação).
- Renderizar o campo "Escola*" como **Input desabilitado** quando `entidadeFilhoNome` for fornecido (mesmo padrão visual do "Município*" no caso single‑entidade), em vez do Select. Quando ausente (legado/fallback), manter o Select atual.
- O valor continua sendo persistido em `relatorios_visita_tecnica_microciclos.nome_escola` no submit (sem mudança de schema).

### 3. Fallback / Compatibilidade
- Ações antigas sem `entidade_filho_id` na programação continuam usando o Select tradicional (não quebram).
- Sem migrations, sem mudança em RLS, sem mudança no fluxo de cadastro.

## Fora de escopo
- Demais ajustes já entregues (Q1 "Outro", Q8 material, Q10 N/A, Q14 30 dias, Parte 2 condicional, etc.).
- Outros tipos de ação.
