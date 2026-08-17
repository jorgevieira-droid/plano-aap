# Redesign visual do Painel - Registro de Encaminhamentos Internos

## Objetivo
Tornar a página "Painel - Registro de Encaminhamentos Internos" mais visualmente atraente e profissional, seguindo a direção "Modern corporate dashboard" escolhida pelo usuário.

## Direção escolhida
- **Paleta:** Navy Trust (azul marinho profundo com branco e acentos azul institucional)
- **Tipografia:** Manter a fonte do sistema (Plus Jakarta Sans)
- **Layout:** Dashboard corporativo — cabeçalho + filtros + KPIs + tabelas laterais

## Mudanças visuais

1. **Cabeçalho**
   - Título maior e em negrito com subtítulo explicativo.
   - Botão "Exportar PDF" à direita, com ícone e estilo primário.

2. **Barra de filtros**
   - Card branco com borda sutil e sombra leve.
   - Filtros em grid de 4 colunas no desktop:
     - Consultor(a) (multi-select)
     - Escola (multi-select)
     - Data Início
     - Data Fim
   - Labels em caixa alta, pequenas e em cinza.

3. **Cards de KPI**
   - 3 cards brancos com ícone colorido em fundo suave, título em caixa alta e número em destaque.
   - Métricas:
     - Total de Registros no Período
     - Consultores(as) selecionados
     - Escolas Selecionadas

4. **Tabelas por Escola e por Consultor**
   - Cards brancos separados com header e borda.
   - Cabeçalho em cinza com caixa alta.
   - Hover sutil nas linhas.
   - Scroll interno com altura máxima preservada.

5. **Tokens semânticos**
   - Reutilizar `card`, `background`, `foreground`, `muted-foreground`, `primary`, `border`, `radius`.
   - Evitar cores hardcoded; usar `bg-primary/10`, `text-primary` etc.

## Funcionalidade preservada
- Dados reais vindo de `instrument_responses` com `form_type = 'registro_encaminhamentos_internos'`.
- Filtros múltiplos de consultor(a) e escola, e filtro por período.
- Contagens por escola e por consultor.
- Exportação para PDF com o layout atual da página.
- Permissões N1-N3 e visibilidade condicionada à ação habilitada no programa.

## Arquivos alterados
- `src/pages/admin/PainelEncaminhamentosInternosPage.tsx`
- Ajuste pontual no `exportSectionsToPdf` se necessário para refletir o novo layout visual.

## Validação
- Verificar se o build/typecheck passa.
- Capturar screenshot do preview para confirmar alinhamento com a direção aprovada.
