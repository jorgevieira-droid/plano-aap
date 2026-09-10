# Ajustes no Relatório - Alterações de agenda da visita

## Objetivo
Incluir exportação em Excel na tabela de detalhamento e alterar o gráfico de evolução mensal de linha para coluna.

## Alterações

1. **Exportar Excel - Alterações registradas**
   - Arquivo: `src/pages/admin/RelatoriosAlteracaoAgendaPanelPage.tsx`
   - Adicionar import da biblioteca `xlsx`.
   - Criar função `exportDetalhesExcel()` que monte uma planilha com as colunas:
     - Data
     - Consultor(a)
     - Escola
     - Contexto
     - Impacto na agenda
   - Usar `XLSX.utils.json_to_sheet` + `XLSX.utils.book_new` + `XLSX.writeFile`, seguindo o padrão já usado em `RelatoriosGestaoEscolasPage.tsx`.
   - Inserir botão "Exportar Excel" ao lado do título "Detalhamento" no header do card de alterações registradas.

2. **Gráfico Evolução Mensal em colunas**
   - No mesmo arquivo, substituir o componente `<LineChart>` por `<BarChart>` na seção "Evolução mensal".
   - Manter eixos, tooltip, grid e cores; trocar `<Line>` por `<Bar dataKey="qtd" fill="#1a3a5c" radius={[4, 4, 0, 0]}>` com `<LabelList dataKey="qtd" position="top" fontSize={11} />`.

## Validação
- Executar typecheck/build para garantir que os imports e tipos estão corretos.
- Verificar visualmente no preview se o botão de Excel aparece e o gráfico é renderizado como colunas.
