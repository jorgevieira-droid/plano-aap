## Objetivo

Tornar o **Dashboard** (`/dashboard`) e a página **Relatórios** (`/relatorios`) totalmente sensíveis ao programa selecionado. Hoje as duas páginas já usam `useAcoesByPrograma` para esconder o gráfico "Ações por Tipo" e os módulos de Acompanhamento, mas vários outros blocos (filtros, cards, instrumentos pedagógicos, presença por componente, segmento) continuam aparecendo mesmo quando o programa selecionado não usa aquela ação/instrumento.

## O que muda

### 1. Fonte da verdade
Manter `useAcoesByPrograma` como única fonte de verdade. Estender o hook com helpers já calculados para evitar duplicação:

- `getInstrumentFormTypesByPrograma(programa)` → `string[]` dos `form_type` de `instrument_responses` habilitados.
- `getModuleVisibility(programa)` ganha:
  - `showSegmentoCharts` (Professores/Presença por Componente e Ciclo, filtro Componente, filtro Segmento)
  - `showAtorFilter` (existem ações com AAP/Consultor/Formador no programa)
  - `showPresencaPorEscola` (algum tipo "Formação" habilitado)
  - `showRedesObservacao` (já existe)
  - `showStandardObservacao` (já existe)

### 2. `src/pages/admin/AdminDashboard.tsx`
- Os filtros **Componente** e **Ator do Programa** só aparecem quando o programa selecionado os utiliza (`moduleVisibility.showSegmentoCharts` / `showAtorFilter`); idem para o filtro de **Escola** quando o programa só tem ações sem `escola_id` (ex.: REDES com entidades-filho).
- Card de "Avaliações de Aula" só aparece quando `showStandardObservacao || showRedesObservacao`.
- Bloco "Ações Previstas x Realizadas — Por Ator" só renderiza se `showAtorFilter`.
- Módulo 3 (Professores/Presença por Componente e Ciclo) já é guardado por `showProfessoresComponente`; vamos reusar a mesma flag para Componente.
- Módulos 4 (Padrão) e 4b (REDES) continuam guardados pelas flags atuais.
- Subtítulo do header passa a listar exatamente os módulos visíveis para o programa.

### 3. `src/pages/admin/RelatoriosPage.tsx`
- Filtro **Componente** só aparece se `showSegmentoCharts`.
- Filtro **Entidade Filho** já condicional; manter.
- Cards de resumo (`execucaoData`) já são derivados de `enabledTipos` — ok.
- Gráfico "Previsto vs Realizado" só renderiza se houver dados (já ok).
- **Instrumentos Pedagógicos** (`<InstrumentDimensionCharts/>`): hoje carrega TODOS os instrumentos visíveis por permissão. Passaremos `programaFilter` para `useInstrumentChartData`, que filtrará os `form_type` por `getInstrumentFormTypesByPrograma`.
- "Presença por Escola/Regional/Rede" só é renderizada se houver tipo Formação habilitado.
- Título da página passa a refletir o programa selecionado (ex.: "Relatórios — Programa de Redes Municipais").
- Exportações Excel/PDF passam a incluir apenas as seções visíveis (resumo, presença, instrumentos, REDES) condicionalmente, evitando abas vazias.

### 4. `src/hooks/useInstrumentChartData.ts`
- Aceitar `programaFilter` e usar `useAcoesByPrograma().getAcoesByPrograma(programaFilter)` para reduzir `viewableInstrumentTypes` à interseção com instrumentos habilitados naquele programa.

### 5. Pré-seleção de programa
Quando o usuário tem apenas 1 programa, a página deve abrir já com `programaFilter = userProgramas[0]` (Dashboard hoje deixa "todos"; Relatórios já faz). Padronizar nas duas páginas.

## Detalhes técnicos

```text
useAcoesByPrograma
 ├─ getAcoesByPrograma(programa)                  (já existe)
 ├─ isAcaoEnabledForPrograma(tipo, programa)      (já existe)
 ├─ getModuleVisibility(programa)                 (estender)
 │   ├─ showProfessoresComponente / showSegmentoCharts
 │   ├─ showStandardAcompanhamento
 │   ├─ showRedesAcompanhamento
 │   ├─ showAtorFilter   (novo)
 │   └─ showPresencaPorEscola (novo, baseado em tipos "formacao*")
 └─ getInstrumentFormTypesByPrograma(programa)    (novo)
```

Os tipos considerados "Formação" virão de `ACAO_FORM_CONFIG`/`ACAO_TIPOS` por convenção (já existe `formacao` etc.). Os tipos de instrumento são os listados em `INSTRUMENT_FORM_TYPES`.

## Arquivos afetados

- `src/hooks/useAcoesByPrograma.ts` — novos helpers e flags.
- `src/hooks/useInstrumentChartData.ts` — filtragem por programa.
- `src/pages/admin/AdminDashboard.tsx` — filtros e módulos condicionais por programa, pré-seleção.
- `src/pages/admin/RelatoriosPage.tsx` — filtros, instrumentos, presença e exportações condicionais por programa.

## Não-objetivos

- Não alterar RLS nem schema do banco.
- Não mexer nas páginas `RelatorioConsultoriaVisualizacaoPage` / `RelatorioApoioPresencialPage` (já são específicas por ação).
- Não alterar comportamento para perfis admin com `programaFilter = todos` (continua agregando tudo).
