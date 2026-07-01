## Problema

Em **Configurar Formulários** → *Visitas Técnicas - Microciclos*, você desativou os campos `nota_q18` (pergunta 20 — metodologias) e `nota_q22` (pergunta 24 — clima da sala). A configuração está salva corretamente no banco (`form_field_config`, `form_key = observacao_aula_redes`), mas o formulário `VisitaTecnicaMicrociclosForm.tsx` renderiza a lista `RUBRICAS` de forma **estática** — nunca consulta `useFormFieldConfig`. Por isso as perguntas continuam aparecendo.

## Plano

**1. Passar a respeitar `form_field_config` no formulário**
- Em `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`:
  - Importar `useFormFieldConfig` e chamar com `'observacao_aula_redes'`.
  - Filtrar `RUBRICAS` antes do `.map(renderRubric)`: manter apenas itens cuja `nota_q{n}` esteja habilitada (`isFieldEnabled('nota_q17')`, ..., `'nota_q22'`).
  - Nas rubricas ocultas, também não salvar `nota_qX` nem `evidencia_qX` no submit (enviar `null`/`''`), para não persistir valores de campos desabilitados.

**2. Ajustar visualizações que dependem dessas dimensões**
- `src/components/dashboard/VisitaMicrociclosBlock.tsx`: já calcula média ignorando itens com valor `0`/nulo, então continuará funcionando quando a coluna vier vazia. Sem mudanças necessárias.
- Relatórios (`RelatorioInstrumentosPage`, PDF, narrativo): continuam listando todas as colunas da tabela dedicada — comportamento intencional, pois registros históricos podem ter valores. Sem mudanças.

**3. Escopo do que NÃO será feito**
- Não vou remover as perguntas do schema/tabela — apenas ocultar no formulário conforme o toggle. Isso preserva o histórico (registros já preenchidos com q18/q22 continuam visíveis nos relatórios) e permite reativar depois via *Configurar Formulários*.
- Sem migrações de banco.

## Validação

- Abrir o formulário como qualquer perfil: só devem aparecer 4 rubricas (Q19, Q21, Q22, Q23).
- Reativar `nota_q18` em *Configurar Formulários* → pergunta 20 volta a aparecer sem redeploy.

Confirma que devo seguir por essa abordagem (ocultar dinamicamente respeitando o toggle, mantendo os dados históricos intactos)?