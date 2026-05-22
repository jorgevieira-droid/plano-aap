## Ajustes solicitados

### 1. Dashboard — incluir coluna "Canceladas" nos dois gráficos
Arquivo: `src/pages/admin/AdminDashboard.tsx`

- Hoje `programacoesUiFiltered` (linha 476) exclui `status = 'cancelada'`.
- Criar um array paralelo `programacoesCanceladas` aplicando os mesmos filtros (programa, escola, componente, ator, ano, mês, excluindo entidades internas) mas mantendo apenas `status === 'cancelada'`.
- Em `acoesPorAAP` (linhas 526–534): adicionar `Canceladas: programacoesCanceladas.filter(p => p.aap_id === aap.user_id).length` e ajustar o `.filter` final para incluir `|| a.Canceladas > 0`.
- Em `acoesPorTipo` (linhas 538–544): adicionar `Canceladas: programacoesCanceladas.filter(p => p.tipo === tipo).length` e ajustar o filtro final.
- Nos dois `<BarChart>` ("Por Ator do Programa" linha ~975 e "Por Tipo" linha ~1006): adicionar uma terceira `<Bar dataKey="Canceladas" fill="hsl(var(--destructive))" radius={[4,4,0,0]}>` com `<LabelList position="top">` no mesmo padrão das demais barras.

### 2. Relatórios — incluir coluna "Canceladas" no gráfico Previsto vs Realizado
Arquivo: `src/pages/admin/RelatoriosPage.tsx`

- `filteredProgramacoes` (linha 489) já inclui canceladas (não filtra por status).
- Em `execucaoData` (linhas 535–540): adicionar `Canceladas: filteredProgramacoes.filter(p => p.tipo === tipo && p.status === 'cancelada').length`.
- No `<BarChart>` "Previsto vs Realizado" (linha ~1249): acrescentar `<Bar dataKey="Canceladas" fill="hsl(var(--destructive))" radius={[4,4,0,0]}>` com `<LabelList position="top">`.
- Ajustar filtros `.some(...)`/`.filter(...)` (linhas 1221, 1244, 1249) para considerar também `Canceladas > 0`.
- Cards de resumo, Excel e PDF: fora do escopo (não foi pedido).

### 3. Relatórios — permitir envio de e-mails para N2/N3 e incluir N3 como "Administradores"
Arquivo: `src/pages/admin/RelatoriosPage.tsx`

- Importar `getRoleLevel` de `@/config/roleConfig`.
- Definir `const canSendEmails = profile?.role ? getRoleLevel(profile.role) <= 3 : false;`.
- Substituir o gate `{isAdmin && (...)}` (linha 952) e o `if (isAdmin) {...}` (linha 426) por `canSendEmails`.
- No carregamento de `adminUsers` (linhas 427–440): trocar `.eq('role', 'admin')` por `.in('role', ['admin', 'n3_coordenador_programa'])`, mantendo a ordenação por nome — assim o select "Administradores" passa a listar N1 + N3.
- Bloco de gestores (N2) permanece inalterado.
- Sem alterações em edge functions.

### Observações
- Apenas mudanças de frontend; nenhuma alteração de schema.
- Cor da nova coluna usa o token semântico `hsl(var(--destructive))`.
