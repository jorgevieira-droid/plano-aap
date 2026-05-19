## Diagnóstico

A página `Relatório de Instrumentos` (`/relatorio-instrumentos`) consulta sempre a tabela `instrument_responses`. Vários formulários, porém, gravam em tabelas dedicadas e nunca em `instrument_responses`. Resultado: o relatório some com os registros desses instrumentos.

Verificado no banco para Programa de Escolas:

| Instrumento (`form_type`) | Realizadas | Em `instrument_responses` | Em tabela dedicada |
|---|---|---|---|
| registro_consultoria_pedagogica | 58 | **1** | **58** (`consultoria_pedagogica_respostas`) |
| registro_apoio_presencial | 44 | 45 | — |
| qualidade_implementacao | 26 | 26 | — |
| obs_engajamento_solidez | 24 | 24 | — |
| sustentabilidade_programa | 24 | 24 | — |

Mapeamento de formulários com tabela dedicada (`src/components/formularios/*.tsx`):

| `form_type` | Tabela dedicada | Registros hoje |
|---|---|---|
| `registro_consultoria_pedagogica` | `consultoria_pedagogica_respostas` | 58 |
| `monitoramento_gestao` | `relatorios_monitoramento_gestao` (dual-write com `instrument_responses`) | 20 |
| `observacao_aula_redes` | `observacoes_aula_redes` | 0 |
| `monitoramento_acoes_formativas` | `relatorios_monit_acoes_formativas` | 0 |
| `encontro_microciclos_recomposicao` | `relatorios_microciclos_recomposicao` | 0 |
| `visita_tecnica_microciclos` | `relatorios_visita_tecnica_microciclos` | 0 |
| `encontro_eteg_redes` | `relatorios_eteg_redes` | 0 |
| `encontro_professor_redes` | `relatorios_professor_redes` | 0 |
| `observacao_aula` (form de avaliação) | `avaliacoes_aula` | 0 |

Em todos esses casos, os `field_key` cadastrados em `instrument_fields` para cada instrumento correspondem 1:1 aos nomes das colunas da tabela dedicada, então a conversão para o formato esperado pelo restante da página (`responses` como `{ field_key: valor }`) é direta e dirigida pelos próprios `orderedFields`.

## Solução

Alterar **apenas** `src/pages/admin/RelatorioInstrumentosPage.tsx` para que, quando o instrumento selecionado tiver tabela dedicada, o relatório leia dela em vez de `instrument_responses`. Nenhuma mudança em formulários, em outras páginas ou na UI.

### Mudanças em `RelatorioInstrumentosPage.tsx`

1. **Mapa de tabelas dedicadas** no topo do arquivo:
   ```ts
   const DEDICATED_TABLES: Record<string, string> = {
     registro_consultoria_pedagogica:   'consultoria_pedagogica_respostas',
     monitoramento_gestao:              'relatorios_monitoramento_gestao',
     monitoramento_acoes_formativas:    'relatorios_monit_acoes_formativas',
     observacao_aula_redes:             'observacoes_aula_redes',
     encontro_microciclos_recomposicao: 'relatorios_microciclos_recomposicao',
     visita_tecnica_microciclos:        'relatorios_visita_tecnica_microciclos',
     encontro_eteg_redes:               'relatorios_eteg_redes',
     encontro_professor_redes:          'relatorios_professor_redes',
     observacao_aula:                   'avaliacoes_aula',
   };
   const hasDedicated = (ft: string) => !!DEDICATED_TABLES[ft];
   ```

2. **Query `rel-instr-formtypes`** (instrumentos disponíveis no programa): manter a busca atual e, em paralelo, sondar cada tabela dedicada com `select('id, registros_acao!inner(programa)').contains('registros_acao.programa', [programa]).limit(1)`. Se vier ≥1 registro, adiciona o `form_type` correspondente ao set.

3. **Query `rel-instr-atores`**: quando `hasDedicated(instrumento)`, buscar `aap_id` na tabela dedicada (mesmo join/filtro de programa) em vez de `instrument_responses`.

4. **Query principal `rel-instr-rows`** (a essencial): quando `hasDedicated(instrumento)`:
   - `select('id, created_at, aap_id, registros_acao!inner(programa, tipo, data, status), <todas as colunas mapeadas a partir de orderedFields.map(f => f.field_key)>')` da tabela dedicada.
   - Aplicar os mesmos filtros: `contains('registros_acao.programa', [programa])`, `aap_id` (quando ≠ 'todos'), `registros_acao.status`, `registros_acao.data >=/<=`, `order created_at desc`, `limit 5000`.
   - Após o fetch, montar `responses` no cliente: `responses = Object.fromEntries(orderedFields.map(f => [f.field_key, row[f.field_key]]))`. O restante do pipeline (`tableRows`, render da tabela e geração do XLSX) é reaproveitado sem mudanças.
   - Para `monitoramento_gestao` (dual-write): usar **apenas** a tabela dedicada (`relatorios_monitoramento_gestao`), que tem o conjunto completo de campos, evitando duplicação.

### Fora do escopo

- Migrar/unificar dados antigos entre as tabelas.
- Alterar comportamento de qualquer formulário ou de outras páginas de relatório específicas (`RelatorioConsultoriaPage`, `RelatorioRegionaisPage`, etc.).
- Mudanças na UI de filtros.