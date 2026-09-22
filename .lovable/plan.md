# Relatórios - Apoio Presencial: exportar Excel nas tabelas de Professores e Evidências

## Objetivo
No painel "Relatórios - Apoio Presencial", adicionar botão de download em Excel nas tabelas **"Apoios realizados por professor"** e **"Evidências da observação de aula"**, seguindo o mesmo padrão já usado na tabela "Devolutiva Formativa" (botão no cabeçalho do card + `exportDevolutivasExcel`).

## Arquivo
`src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx` (XLSX já importado; dados já existem nos memos `apoiosPorProfessor` e `evidencias`, respeitando os filtros aplicados).

## Alterações

1. **Exportar "Apoios realizados por professor"** — nova função `exportApoiosProfessorExcel()`:
   - Colunas: Professor | Escola | Segmento | Componente | Qtd de apoios (mesmas linhas visíveis da tabela, já filtradas).
   - Larguras de coluna ajustadas (`!cols`).
   - Arquivo: `apoio-presencial-apoios-por-professor_<inicio>_a_<fim>.xlsx`.

2. **Exportar "Evidências da observação de aula"** — nova função `exportEvidenciasExcel()`:
   - Colunas: Consultor(a) | Nome da Escola | Data (dd/MM/yyyy) | Evidências da observação de aula.
   - Arquivo: `apoio-presencial-evidencias-observacao_<inicio>_a_<fim>.xlsx`.

3. **Botões no cabeçalho dos dois cards** — botão "Exportar Excel" (ícone FileSpreadsheet, `variant="outline" size="sm"`), posicionado à direita do título, no mesmo estilo do botão existente em "Devolutiva Formativa - Respostas Registradas". Desabilitado quando a tabela estiver vazia.

## Validação
- `npx tsgo --noEmit -p tsconfig.app.json`.
- Conferir no preview os dois botões e o download dos arquivos com os dados filtrados.
