

# Revisão do Dashboard, Relatório e Edição de Registros por Programa

## Problemas identificados

### 1. Dashboard e Relatório: módulos não filtrados por programa
- O gráfico "Ações Previstas x Realizadas por Tipo" usa `ACAO_TIPOS` completo — mostra todos os 23 tipos sem considerar quais estão habilitados para o programa selecionado
- Módulos hardcoded (Professores por Componente/Ciclo, Presença por Componente/Ciclo, Acompanhamento de Aula padrão, Redes Municipais) usam apenas `showStandardModule` / `showRedesModule` — lógica binária que não cobre "regionais"
- O relatório (`RelatoriosPage`) tem a mesma questão: gráfico de execução fixo em 3 tipos ("Formações, Visitas, Acompanhamentos") e módulos de avaliação/observação sem filtro por programa
- Nenhuma das páginas consulta `form_config_settings.programas` para saber quais ações pertencem a qual programa

### 2. Edição de Registros: formulário genérico
- O diálogo de edição (linhas 1788-1939) mostra **sempre os mesmos campos** independente do tipo de ação: Tipo (só 3 opções fixas: formação/visita/acompanhamento), Segmento, Ano/Série, Turma, Observações, Avanços, Dificuldades
- Ações de instrumentos dinâmicos e REDES não têm campos relevantes (ex: não faz sentido editar "Segmento" num Monitoramento e Gestão)
- O seletor de Tipo na edição está hardcoded com 3 opções, quando existem 23 tipos

### 3. Filtro de Tipo na listagem de registros
- O filtro de tipo também está hardcoded com apenas 3 opções (formação/visita/acompanhamento)

## Solução proposta

### Etapa 1: Buscar ações disponíveis por programa

Criar um hook ou função utilitária que consulta `form_config_settings` e retorna os tipos de ação habilitados para um dado programa. Isso será a fonte de verdade para filtrar o que aparece nos dashboards.

```text
getAcoesByPrograma('regionais') → ['lideranca_gestores_pei', 'monitoramento_gestao', ...]
getAcoesByPrograma('todos')     → todos os tipos
```

### Etapa 2: Dashboard (`AdminDashboard.tsx`)

- **Gráfico "Por Tipo"**: filtrar `ACAO_TIPOS` pelos tipos habilitados para o `programaFilter` selecionado (usando `form_config_settings`)
- **Módulo "Professores/Presença por Componente"**: só exibir quando o programa selecionado tiver ações que usam segmento/componente (escolas)
- **Módulo "Acompanhamento Padrão" (radar 1-5)**: só exibir quando houver tipo `observacao_aula` ou `acompanhamento_aula` habilitado para o programa
- **Módulo "Redes Municipais" (radar 1-4)**: só exibir quando houver tipo `observacao_aula_redes` habilitado para o programa
- **Módulo "Instrumentos Pedagógicos"**: já é dinâmico, mas filtrar por programa no hook `useInstrumentChartData`

### Etapa 3: Relatório (`RelatoriosPage.tsx`)

- **Gráfico de execução**: trocar as 3 categorias fixas por geração dinâmica a partir dos tipos habilitados para o programa (mesma lógica do dashboard "Por Tipo")
- **Módulos de avaliação**: mesma lógica condicional do dashboard
- **Exportação Excel/PDF**: incluir apenas dados dos módulos visíveis

### Etapa 4: Edição contextual de Registros (`RegistrosPage.tsx`)

- **Filtro de Tipo**: substituir as 3 opções fixas por `ACAO_TIPOS` filtrados pelos tipos que existem nos registros do usuário (ou todos para admin)
- **Diálogo de Edição**: condicionar campos ao tipo de ação:
  - Campos sempre visíveis: Data, Status, Escola, Observações
  - Segmento, Componente, Ano/Série, Turma: só quando `ACAO_FORM_CONFIG[tipo].showSegmento/showComponente/showAnoSerie` for `true`
  - Tipo: mostrar seletor com todos os tipos válidos (usando `ACAO_TYPE_INFO`)
  - Avanços, Dificuldades: manter para tipos tradicionais, ocultar para instrumentos/REDES

### Etapa 5: Botão "Gerenciar" contextual

- Atualmente só diferencia `acompanhamento_aula` (avaliações) vs resto (presenças)
- Para tipos de instrumento dinâmico, o botão deve abrir as respostas do instrumento (ou não exibir o botão, já que os dados são salvos via `instrument_responses`)
- Para tipos REDES (encontro_eteg, encontro_professor, observacao_aula_redes), o botão de gerenciamento não faz sentido no mesmo padrão — ocultar ou adaptar

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/hooks/useAcoesByPrograma.ts` | **Novo** — hook que busca `form_config_settings` e retorna tipos habilitados por programa |
| `src/pages/admin/AdminDashboard.tsx` | Filtrar gráficos/módulos por programa usando o hook |
| `src/pages/admin/RelatoriosPage.tsx` | Filtrar gráfico de execução e módulos por programa |
| `src/pages/admin/RegistrosPage.tsx` | Filtro de tipo dinâmico + edição contextual por tipo |

## Fluxo esperado

1. Usuário seleciona "Regionais de Ensino" no filtro de programa
2. Dashboard mostra apenas tipos de ação habilitados para Regionais (Liderança PEI, Monitoramento, Professor Tutor, PEC, VOAR)
3. Módulos de "Professores por Componente", "Acompanhamento Padrão" e "Redes Municipais" ficam ocultos (não se aplicam a Regionais)
4. Na página de Registros, o filtro de tipo lista apenas os tipos relevantes
5. Ao editar um registro de "Monitoramento e Gestão", o formulário exibe apenas campos pertinentes (Data, Status, Escola, Observações) — sem Segmento, Turma, etc.

