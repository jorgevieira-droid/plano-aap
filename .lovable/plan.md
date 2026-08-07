# Renomear "Consultoria Pedagógica" para "Formação do Coordenador"

Troca apenas de rótulos visíveis. Nenhuma mudança de banco, chaves técnicas (`registro_consultoria_pedagogica`), rotas ou lógica.

## O que muda

Ação/evento:
- Rótulo da ação passa a ser "Registro de Formação do Coordenador" na lista de ações, no seletor de instrumentos e no diálogo de preenchimento.

Relatórios e visualizações:
- Menu "Rel. Consultoria Pedagógica" -> "Rel. Formação do Coordenador".
- Menu/página "Visualização Consultoria" -> "Visualização Formação do Coordenador".
- Títulos na tela, no PDF exportado e no e-mail do relatório passam a "Relatório de Formação do Coordenador".

Manual do Usuário:
- Seção correspondente reescrita com os novos nomes.

## Detalhes técnicos

Arquivos a editar (somente strings de exibição):
- `src/config/acaoPermissions.ts` (label da ação)
- `src/hooks/useInstrumentFields.ts` (label no filtro de instrumentos)
- `src/pages/admin/ProgramacaoPage.tsx` (título do diálogo)
- `src/components/layout/Sidebar.tsx` (rótulos dos dois menus)
- `src/pages/admin/RelatorioConsultoriaPage.tsx` e `RelatorioConsultoriaVisualizacaoPage.tsx` (títulos de tela e PDF)
- `src/pages/admin/RelatoriosNarrativosPage.tsx` (menção no texto do prompt/descrição)
- `src/pages/admin/ManualUsuarioPage.tsx` (seção do manual)
- `supabase/functions/_shared/transactional-email-templates/consultoria-report.tsx` (preview, título e assunto do e-mail; requer redeploy da função de e-mail)

Mantidos sem alteração: nomes de tabelas (`consultoria_pedagogica_respostas`), o valor `registro_consultoria_pedagogica` usado em checks e permissões, caminhos de rota (`/relatorio-consultoria`) e nomes de arquivos/componentes.
