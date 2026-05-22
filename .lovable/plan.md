# Adicionar totais de aulas observadas (OE e Professor Tutor) ao Relatório de Consultoria Pedagógica

Os campos já existem na tabela `consultoria_pedagogica_respostas` e são preenchidos pelo formulário `ConsultoriaPedagogicaForm`:

- `aulas_obs_oe_lp` — Aulas observadas – OE Língua Portuguesa
- `aulas_obs_oe_mat` — Aulas observadas – OE Matemática
- `aulas_obs_tutor_lp` — Aulas observadas – Professor Tutor Língua Portuguesa
- `aulas_obs_tutor_mat` — Aulas observadas – Professor Tutor Matemática

## Alterações em `src/pages/admin/RelatorioConsultoriaPage.tsx`

1. **Agregação `totals`**: somar os 4 novos campos a partir do `filtered`.
2. **Cards de resumo**: expandir o grid de StatCards para incluir os 4 novos totais, mantendo os existentes (Total Consultorias, Aulas Obs. LP, Aulas Obs. Mat, Devolutivas). Ajustar o grid para acomodar 8 cards (ex.: `grid-cols-2 md:grid-cols-4` mantendo 2 linhas).
3. **PDF (`handleExportPDF`)**: incluir os 4 novos valores no bloco "Resumo".
4. **E-mail (`handleSendEmail`)**: incluir os 4 novos valores na lista de resumo do HTML.

Os rótulos exibidos seguem o padrão dos cards existentes ("Aulas Obs. OE LP", "Aulas Obs. OE Mat", "Aulas Obs. Tutor LP", "Aulas Obs. Tutor Mat"), mantendo nomes completos no PDF/e-mail.

## Fora do escopo

- Nenhuma alteração de schema, RLS, filtros ou tabela de detalhamento.
- Sem mudanças no formulário de coleta.
