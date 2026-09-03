---
name: Bloco Indicadores - Caê
description: Bloco full-width "Indicadores - Caê" na página Relatórios de Gestão - Programa Escolas, alimentado pelo Registro de Apoio Presencial
type: feature
---
Em `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`, bloco full-width "Indicadores - Caê" (sem botão Visualizar Relatório) com: KPI de professores atendidos (distintos, exclui "Sem professor"), barras por componente, barras por ano/série e tabela Professor|Escola com scroll.

Fontes de dados (Registro de Apoio Presencial): professor/componente/ano-série vêm de `programacoes.apoio_professor_nome`, `apoio_componente`, `apoio_ano_serie` (fallback para `registros_acao.componente/ano_serie` quando diferente de 'todos'). Os valores são texto livre — OBRIGATÓRIO normalizar: componente agrupa LP/PORTUG→Língua Portuguesa, MAT→Matemática, POLIVALENTE, EFAI, Não se aplica, Outros; ano/série extrai o dígito 1-9 → "Nº Ano".
