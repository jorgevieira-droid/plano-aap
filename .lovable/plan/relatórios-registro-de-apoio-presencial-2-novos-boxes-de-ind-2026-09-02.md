# Relatórios - Registro de Apoio Presencial: 2 novos boxes de indicadores

Adicionar dois boxes na linha de Indicadores da página `/relatorios-apoio-presencial`:

1. **Total de professores apoiados** — contagem de professores distintos nos apoios do período filtrado.
2. **Total de Apoio por componente** — box único com detalhamento interno: cada componente (ex.: Língua Portuguesa, Matemática) com sua quantidade de apoios, ordenado A-Z (pt-BR).

## Detalhes

Arquivo único: `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx` (sem mudanças de banco, RLS ou formulários).

- **Novo memo `professoresApoiados`**: `new Set` com `r.professor` de `filtered`, excluindo o valor sentinela `'Sem professor'`; valor = tamanho do set.
- **Novo memo `porComponente`**: agrupa `filtered` por `r.componente` (já existe no `Row`, vindo de `programacoes.apoio_componente`), retorna `{ nome, qtd }` ordenado com `sortPt`.
- **Grid de KPIs (UI)**: passa de 4 para 6 cards (continua responsivo, quebra em 2 linhas).
  - Card "Total de professores apoiados": ícone `Users` (lucide), valor numérico.
  - Card "Total de Apoio por componente": card com o total geral de apoios como número principal e a lista `componente — qtd` abaixo (linhas pequenas, A-Z).
- **PDF (`handleExport`)**: incluir os dois novos boxes em `pdfKpis`/render equivalente, na mesma ordem da tela; o box por componente renderiza o detalhamento em linhas dentro do cartão. Estilo existente (`cardStyle`, cores hex fixas) mantido.
- Filtros existentes (Consultor, Escola, datas) aplicam-se normalmente aos novos boxes, pois usam `filtered`.
