

# Correção: Pendências para Todos os Programas (3 dias)

## Problema
As pendências não aparecem para o programa de Redes porque o filtro de status busca apenas `agendada` e `reagendada`, mas ações podem ser criadas com status `prevista`. Além disso, o prazo está configurado como 2 dias ao invés de 3.

## Regra correta
Uma ação é **pendente** quando:
- Status é `prevista`, `agendada` ou `reagendada` (não foi marcada como realizada, cancelada ou não realizada)
- Passaram-se **3 dias** desde a data da ação (ou data de reagendamento)
- Vale para **todos os programas**

## Alterações

### 1. `src/hooks/usePendencias.ts`
- Filtro de status: `['prevista', 'agendada', 'reagendada']` (linha 36)
- Threshold: `3 dias` ao invés de `2` (linha 43)

### 2. `src/pages/admin/RegistrosPage.tsx`
- 3 ocorrências de `isPendente()` (~linhas 384, 994, 1354): incluir `prevista` no check de status e mudar para 3 dias
- Textos "mais de 2 dias" → "mais de 3 dias" (linhas 1017, 1382)

### 3. `src/pages/admin/AdminDashboard.tsx`
- Query de pendentes (~linha 226): mudar de 2 para 3 dias
- Filtro de status pendentes: incluir `prevista`
- Textos "mais de 2 dias" → "mais de 3 dias" (linhas 678, 681)

### 4. `src/pages/admin/PendenciasPage.tsx`
- Texto "mais de 2 dias" → "mais de 3 dias" (linha 90)

### 5. `src/pages/admin/RelatoriosPage.tsx`
- Texto "mais de 2 dias" → "mais de 3 dias" (linha 931)

## Nenhuma migration necessária
Todas as alterações são no frontend.

