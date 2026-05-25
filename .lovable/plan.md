# Histórico de Alterações em Ações

Criar uma página administrativa que lista todas as criações, edições e exclusões de ações (Programação), mostrando o usuário responsável, data/hora e o que mudou.

## O que será entregue

**Nova página `/historico-alteracoes`** no menu admin (visível para Admin N1, Gestor N2 e Coordenador N3), com:

- Tabela cronológica (mais recente primeiro) com colunas:
  - Data/hora
  - Usuário (nome + papel)
  - Ação (Criação / Edição / Exclusão)
  - Tipo de ação afetada (ex.: "Formação", "Observação de Aula")
  - Escola/Entidade
  - Programa
  - Resumo do que mudou (campos alterados, com valor anterior → novo)
- Filtros: período (data inicial/final), usuário, tipo de evento (criação/edição/exclusão), programa, escola
- Busca por título da ação
- Paginação (50 por página)
- Botão "Exportar CSV" do recorte filtrado
- Coordenador (N3) e Gestor (N2) veem apenas alterações de ações dos programas a que pertencem; Admin vê tudo

## Como funciona por trás

1. **Captura automática via triggers no banco** — hoje a tabela `registros_alteracoes` existe (com `tabela`, `registro_id`, `usuario_id`, `alteracao` JSONB, `created_at`) mas não há nada populando ela. Adicionar trigger `AFTER INSERT/UPDATE/DELETE` em `registros_acao` que grava:
   - `operacao`: 'INSERT' | 'UPDATE' | 'DELETE'
   - `alteracao`: JSONB com `{ before, after, changed_fields }` (apenas campos que realmente mudaram em UPDATE)
   - `usuario_id`: `auth.uid()`
   - Snapshot do contexto (escola_id, programa, tipo_acao, data) em colunas adicionais para filtros rápidos sem precisar fazer JOIN com a ação (importante porque em DELETE o registro original some)

2. **Novas colunas em `registros_alteracoes`** para suportar filtros e exibição mesmo após exclusão:
   - `operacao text`
   - `contexto jsonb` (escola_nome, programa, tipo_acao, titulo, data_acao no momento do evento)

3. **RLS atualizada**: SELECT permitido para Admin (tudo) e Gestor/N3 (eventos onde `contexto->>'programa'` está em seus programas atribuídos). INSERT continua só via trigger (security definer).

4. **Trigger function** em SQL com `SECURITY DEFINER` e `search_path` fixo, comparando OLD/NEW e gravando apenas o diff.

5. **Frontend**: nova página `src/pages/admin/HistoricoAlteracoesPage.tsx` usando `DataTable`, `FilterBar` e o mesmo padrão de outras páginas admin (ex.: `RelatorioAcessosPage`). Rota e item de menu adicionados em `App.tsx` / `Sidebar.tsx` / `roleConfig.ts`.

## Fora do escopo (podem virar pedidos futuros)

- Histórico de presenças, instrumentos pedagógicos e entidades — só a Programação por agora
- Aba "Histórico" dentro do diálogo de cada ação (escolhido apenas página dedicada)
- Reverter/desfazer alterações
- Histórico retroativo: só passará a registrar a partir da instalação do trigger; as 51 linhas atuais permanecem visíveis

## Observação

Para que o `usuario_id` seja preenchido corretamente, todas as gravações em `registros_acao` precisam ocorrer com o JWT do usuário (já é o caso no app). Em edições feitas via Edge Function com service role, o trigger registrará `usuario_id` nulo — vamos exibir "Sistema" nesses casos.
