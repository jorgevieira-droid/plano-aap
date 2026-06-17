## Diagnóstico

A página `Relatório de Instrumentos` (`src/pages/admin/RelatorioInstrumentosPage.tsx`) busca dados de duas formas:
- **Tabela dedicada** (mapa `DEDICATED_TABLES`, linhas 40-50): lê colunas listadas em `instrument_fields` (config).
- **Genérico**: lê de `instrument_responses` por `form_type`.

Hoje há dois grupos de problemas:

### A) Rótulo incorreto
`src/hooks/useInstrumentFields.ts` linha 61:
- `observacao_aula_redes` está rotulado como **"Visitas Técnicas - Microciclos"** — mas a tabela é `observacoes_aula_redes` (formulário ObservacaoAulaRedesForm).

### B) Instrumentos com tabela dedicada NÃO mapeados em `DEDICATED_TABLES` (afeta outros relatórios)
Existem formulários que gravam em tabelas próprias mas o relatório não sabe disso, então as colunas vêm vazias / da tabela errada:

| form_type | Tabela real | Hoje em DEDICATED_TABLES? |
|---|---|---|
| `visita_tecnica_microciclos` | `relatorios_visita_tecnica_microciclos` | ❌ Falta |
| `visita_tecnica_alfabetizacao` | `relatorios_visita_tecnica_alfabetizacao` | ❌ Falta |
| `visita_tecnica_tarl` | `relatorios_visita_tecnica_tarl` | ❌ Falta |
| `observacao_aula_gpa` | `observacoes_aula_gpa` | ❌ Falta |
| `reuniao_acomp_alfabetizacao` | `relatorios_reuniao_acomp_alfabetizacao` | ❌ Falta |

(Já mapeados corretamente: `observacao_aula_redes`, `visita_tecnica_alfabetizacao_redes`, `encontro_microciclos_recomposicao`, `encontro_eteg_redes`, `encontro_professor_redes`, `monitoramento_gestao`, `monitoramento_acoes_formativas`, `registro_consultoria_pedagogica`, `observacao_aula`.)

## Plano

### 1. Corrigir rótulo
Em `src/hooks/useInstrumentFields.ts`, trocar o label de `observacao_aula_redes` de `"Visitas Técnicas - Microciclos"` para **`"Observação de Aula — REDES"`** (mantém `value` para preservar a config existente em `instrument_fields`).

### 2. Completar o mapa de tabelas dedicadas
Em `src/pages/admin/RelatorioInstrumentosPage.tsx`, adicionar ao `DEDICATED_TABLES`:
```
visita_tecnica_microciclos: 'relatorios_visita_tecnica_microciclos',
visita_tecnica_alfabetizacao: 'relatorios_visita_tecnica_alfabetizacao',
visita_tecnica_tarl: 'relatorios_visita_tecnica_tarl',
observacao_aula_gpa: 'observacoes_aula_gpa',
reuniao_acomp_alfabetizacao: 'relatorios_reuniao_acomp_alfabetizacao',
```

### 3. Mostrar TODAS as colunas de resposta (sem depender de `instrument_fields`)
Refatorar o ramo de tabela dedicada na query (linhas 298-327) e a montagem da tabela/XLS (linhas 385-415) para, quando o instrumento tiver tabela dedicada:

- Fazer `select('*')` na tabela dedicada.
- Descobrir dinamicamente as colunas existentes nas linhas retornadas.
- Excluir um conjunto fixo de metadados:
  `id`, `created_at`, `updated_at`, `created_by`, `updated_by`, `registro_acao_id`, `status`, `aap_id`, `aap_email`.
- Usar as demais colunas como cabeçalhos da tabela e do XLS (na ordem retornada pelo Supabase, com fallback alfabético).
- Cabeçalhos: usar o nome da coluna formatado (snake_case → "Snake Case") já que não há label em `instrument_fields` para campos não cadastrados.
- Para o ramo genérico (`instrument_responses`), manter o comportamento atual (campos do JSON `responses`), mas também passar a listar **todas** as chaves de `responses` (não só as que estão em `instrument_fields`), aplicando a mesma exclusão de metadados.

### 4. Validação
- Selecionar cada instrumento da tabela acima em seu programa e conferir que as colunas batem com o respectivo formulário/PDF (ex.: `visita_tecnica_microciclos` em Redes Municipais traz `municipio`, `nome_escola`, `turma`, `nota_criterio_*`, `evidencia_criterio_*`, `encaminhamentos`, etc.).
- Conferir que "Observação de Aula — REDES" (rótulo corrigido) continua trazendo as colunas de `observacoes_aula_redes`.
- Conferir que o "Baixar XLS" exporta exatamente as mesmas colunas exibidas.
- Conferir que instrumentos genéricos (sem tabela dedicada) continuam funcionando.

## Observação sobre o "Comparativo Temporal"
A aba Comparativo usa `useInstrumentComparisonData`, que depende de campos com escala numérica (notas). Esses campos seguem vindos de `instrument_fields`. Mudar a tabela para "todas as colunas" **não afeta** o comparativo, que continua dependente da configuração existente — sem regressão.
