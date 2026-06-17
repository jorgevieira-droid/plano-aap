## Nova página: "Extração de Bases - Instrumentos"

Página para baixar (Excel) os registros de qualquer ação/evento habilitada para o programa, respeitando hierarquia e filtros do usuário.

### Localização
- **Menu:** grupo `Admin` (Sidebar) — entre "Histórico de Alterações" e "Relatório de Acessos".
- **Rota:** `/extracao-bases-instrumentos`.
- **Ícone:** `Download` (lucide-react).
- **Visibilidade:** `allowedTiers: ['admin', 'manager']` (N1–N3). Filtros de programa já são aplicados via `effectiveProgramas` no `AuthContext`.

### Layout (UI)

```text
┌─────────────────────────────────────────────────┐
│ Extração de Bases - Instrumentos                │
├─────────────────────────────────────────────────┤
│ [Programa ▼]   [Instrumento ▼ (disabled)]       │
│                                                 │
│ Filtros adicionais (após escolher Instrumento): │
│ [Ator ▼] [Entidade ▼] [Status ▼]                │
│ [Data início] [Data fim]                        │
│                                                 │
│             [Gerar Relatório]  (disabled)       │
├─────────────────────────────────────────────────┤
│ Prévia da tabela (após gerar)        [⬇ Excel]  │
│  ┌──────────────────────────────────────────┐   │
│  │ Data | Ator | Entidade | Status | …      │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
```

### Comportamento

1. **Filtro Programa** — opções vindas de `effectiveProgramas` (admin vê os 3). Auto-seleciona se houver apenas 1.
2. **Filtro Instrumento** — habilitado só após selecionar Programa. Lista **todas as ações/eventos habilitadas** para o programa via `useAcoesByPrograma().getAcoesByPrograma(programa)` (não apenas instrumentos), ordenadas A→Z usando `ACAO_TYPE_INFO[tipo].label`. Inclui também tipos sem formulário (Formação, Acompanhamento, etc.).
3. **Filtros adicionais** (igual à página atual de Relatório de Instrumentos): Ator (`profiles` via `aap_id`), Entidade (`escolas` ativas do programa), Status (`prevista/agendada/realizada/cancelada/reagendada`), Data início/fim. Resetam ao trocar Programa/Instrumento.
4. **Botão "Gerar Relatório"** — habilitado quando `programa && instrumento` estão definidos. Ao clicar, dispara a consulta e mostra a prévia.
5. **Prévia** — tabela com cabeçalho fixo, scroll vertical e horizontal, mesma estética de `DataTable`. Mostra primeiras N linhas (ex.: 50) com contador "X de Y registros".
6. **Botão "Baixar Excel"** — exporta **todos** os registros (não apenas a prévia) via `xlsx` (`XLSX.utils.json_to_sheet` + `book_append_sheet` + `writeFile`). Nome do arquivo: `extracao_{instrumento}_{programa}_{YYYY-MM-DD}.xlsx`.

### Fonte e estrutura dos dados

- **Base:** `registros_acao` filtrado por `tipo IN actionTypeAliases(instrumento)`, `programa @> [programa]`, e filtros opcionais (ator/entidade/status/datas).
- **Colunas exportadas:**
  1. **Campos do registro:** `data`, `status`, `programa`, `created_at`, `aap_nome` (resolvido via `profiles`), `escola_nome` (via `escolas`), e demais colunas relevantes de `registros_acao` (ex.: `hora_inicio`, `hora_fim`, `observacoes`, `tags`, `entidade_filho_id`, etc. — excluindo IDs internos puros).
  2. **Campos da resposta** (quando existir):
     - Se o instrumento tem entrada em `DEDICATED_TABLES` → faz `LEFT JOIN` por `registro_acao_id` e expande todas as colunas (exceto `METADATA_COLUMNS`).
     - Caso contrário → busca `instrument_responses.responses` (JSON) e expande chaves dinamicamente.
     - Para tipos **sem instrumento** (ex.: `formacao`, `acompanhamento_formacoes`) → somente os campos do registro (mais participantes resolvidos via `presencas` se aplicável — ver item de "extensões opcionais" abaixo).
- **Labels das colunas:** reutiliza o `DEDICATED_TABLE_LABELS` já existente em `RelatorioInstrumentosPage.tsx` (será extraído para `src/lib/instrumentLabels.ts` para reuso). Fallback: `humanizeKey`.

### Implementação técnica

1. **Novo arquivo** `src/pages/admin/ExtracaoBasesInstrumentosPage.tsx`:
   - Reaproveita helpers de `RelatorioInstrumentosPage` (`DEDICATED_TABLES`, `METADATA_COLUMNS`, `DEDICATED_TABLE_LABELS`, `humanizeKey`, `actionTypeAliases`, `formatCell`, `slugify`, `STATUS_OPTIONS`).
   - **Refatoração mínima:** extrair esses constantes/helpers para `src/lib/instrumentExport.ts` e importar nas duas páginas (sem alterar o comportamento da página atual).
   - Usa `useAuth`, `useAcoesByPrograma`, React Query.
   - Tabela prévia com `Table`/`TableHeader`/`TableBody` (shadcn) e contêiner `max-h-[60vh] overflow-auto`.
2. **Rota** em `src/App.tsx`: `<Route path="/extracao-bases-instrumentos" element={<ExtracaoBasesInstrumentosPage />} />`.
3. **Sidebar** em `src/components/layout/Sidebar.tsx`: novo item no grupo `Admin`:
   ```ts
   { icon: Download, label: 'Extração de Bases - Instrumentos', path: '/extracao-bases-instrumentos', allowedTiers: ['admin', 'manager'] }
   ```
4. **Hard guard** na página: redirect para `/unauthorized` se `!isManager` (mesmo padrão do `RelatorioInstrumentosPage`).
5. **Export Excel:** `xlsx` (já no projeto). Auto-width simples baseado no maior valor de cada coluna.

### Memória / Não escopo

- **Não** vamos incluir programações previstas (apenas `registros_acao`, conforme escolha do usuário).
- **Não** vamos adicionar gráficos/PDF/comparativo temporal (foco em exportação).
- **Não** alteramos `RelatorioInstrumentosPage` além da extração de helpers para o `src/lib/instrumentExport.ts` (mantendo todo comportamento atual).

### Validação ao final
- Login simulado N2/N3 com apenas 1 programa → vê só esse programa e seus instrumentos.
- Selecionar "Formação" (tipo sem instrument_fields) → tabela exporta dados do registro.
- Selecionar "Visitas Técnicas - Microciclos" → tabela exporta colunas com labels do PDF.
- Excel abre no Excel/LibreOffice sem erros, datas formatadas, cabeçalhos legíveis.