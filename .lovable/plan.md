## Correção

Confirmado no código:
- `src/config/acaoPermissions.ts` linha 100 define o tipo `observacao_aula_redes` com label **"Visitas Técnicas - Microciclos"** — esse é o nome canônico em todo o app.
- O formulário renderizado para esse tipo é `VisitaTecnicaMicrociclosForm`, que persiste em **`relatorios_visita_tecnica_microciclos`** (linhas 271 e 370 do form).
- A tabela `observacoes_aula_redes` existe mas não é o destino real desse instrumento na prática.

### Mudanças

**1. `src/hooks/useInstrumentFields.ts`** — reverter o rótulo de `observacao_aula_redes` para **"Visitas Técnicas - Microciclos"** (voltar ao original).

**2. `src/pages/admin/RelatorioInstrumentosPage.tsx` — `DEDICATED_TABLES`:**
- Trocar `observacao_aula_redes: 'observacoes_aula_redes'` → `observacao_aula_redes: 'relatorios_visita_tecnica_microciclos'`.
- Remover a entrada redundante `visita_tecnica_microciclos: 'relatorios_visita_tecnica_microciclos'` (não é um tipo de ação registrável; o canônico é `observacao_aula_redes`).

**3. (Opcional, mesmo arquivo)** Remover `visita_tecnica_microciclos` de `INSTRUMENT_FORM_TYPES` em `useInstrumentFields.ts` para não aparecer como instrumento separado/duplicado no seletor.

### Validação
- Em REDES, selecionar "Visitas Técnicas - Microciclos" e confirmar que a tabela traz colunas de `relatorios_visita_tecnica_microciclos` (município, nome_escola, turma, nota_criterio_*, evidencia_criterio_*, encaminhamentos etc.), batendo com o PDF.
- Conferir que o XLS exporta as mesmas colunas.
- Conferir que nenhum outro instrumento foi afetado.
