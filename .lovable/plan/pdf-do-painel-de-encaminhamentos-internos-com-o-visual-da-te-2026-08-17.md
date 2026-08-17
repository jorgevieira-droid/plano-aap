# PDF do Painel de Encaminhamentos Internos com o visual da tela

O cabeçalho institucional atual do PDF (faixa azul com as logos Parceiros + Bússola, título e período) permanece exatamente como está. Muda apenas o miolo, que hoje sai como texto simples e tabelas cinzas com bordas.

## Novo miolo

- **Cartões de indicadores** no topo, em três colunas, iguais aos da tela: ícone colorido em caixa arredondada, rótulo pequeno em maiúsculas e número grande.
  - Total de Registros no Período (azul)
  - Consultores(as) selecionados (verde)
  - Escolas Selecionadas (âmbar)
- **Duas tabelas em cartões**, lado a lado como na tela: "Registros por Escola" e "Registros por Consultor(a)".
  - Cabeçalho do cartão com fundo suave e borda inferior.
  - Cabeçalho da tabela em maiúsculas, coluna de quantidade alinhada à direita.
  - Linhas separadas por divisórias finas e faixa alternada leve para leitura.
  - Estado vazio ("Nenhum registro no período.") preservado.
- Se uma das listas for longa, as tabelas quebram em páginas mantendo o cabeçalho do cartão na primeira página.

## Detalhes técnicos

- Alterar apenas o bloco `handleExport` em `src/pages/admin/PainelEncaminhamentosInternosPage.tsx`, que monta o nó React enviado a `exportSectionsToPdf`.
- O nó de exportação é renderizado fora do tema do app, então os estilos continuam inline (hex fixos equivalentes aos tokens da tela: azul `#1a3a5c`/`#eef2f7`, verde `#059669`/`#ecfdf5`, âmbar `#d97706`/`#fffbeb`, bordas `#e5e7eb`).
- Ícones: usar os mesmos componentes `lucide-react` (FileText, Users, School) já importados, renderizados em SVG dentro do nó.
- Sem mudanças em `src/lib/pdfExport.ts`, nos dados, filtros ou permissões.
