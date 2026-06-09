## Objetivo
Renomear o rótulo de exibição da ação `visita_tecnica_alfabetizacao_redes` de **"Visita Técnica — Alfabetização (REDES)"** para **"Visita Técnica — IAB (REDES)"**.

## Escopo
Alteração puramente de UI (label). Mantém-se inalterado:
- Chave do tipo (`visita_tecnica_alfabetizacao_redes`)
- Nome do componente / arquivo (`VisitaTecnicaAlfabetizacaoRedesForm`, etc.)
- Tabela dedicada (`relatorios_visita_tecnica_alfabetizacao_redes`)
- Toda a lógica, hooks, queries e migrações

## Arquivos a alterar (apenas strings visíveis ao usuário)
1. `src/config/acaoPermissions.ts` — label do tipo (fonte primária)
2. `src/hooks/useInstrumentFields.ts` — label do select
3. `src/components/dashboard/VisitaAlfabetizacaoRedesBlock.tsx` — título do card
4. `src/pages/admin/ProgramacaoPage.tsx` — título visível (linha 5841)
5. `src/pages/admin/RegistrosPage.tsx` — títulos visíveis (linhas 3256, 3315)

Comentários de código com a string antiga não precisam ser alterados; ainda assim, podem ser atualizados para manter consistência (`AdminDashboard.tsx`, `RelatoriosPage.tsx`, `AcaoPrintDialog/Form.tsx`, `visitaAlfabetizacaoRedesShared.ts`).

## Resultado
- Em toda a interface (Programação, Registros, Dashboard, Relatórios, PDFs e Impressão) o evento aparecerá como **"Visita Técnica — IAB (REDES)"**.
- Nenhum impacto em dados, permissões ou fluxos.
