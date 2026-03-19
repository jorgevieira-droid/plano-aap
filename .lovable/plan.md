

# Acompanhamento de Aula por Programa (Dashboard + Relatórios)

## Problema

O módulo "Acompanhamento de Aula" no Dashboard e em Relatórios só exibe dados de `avaliacoes_aula` (5 dimensões, escala 1-5). Agora existe o modelo REDES (`observacoes_aula_redes`, 9 critérios, escala 1-4) que precisa ser exibido quando o programa é `redes_municipais`. O N1 (admin) com filtro "todos" deve ver ambos os resumos.

## Plano

### 1. Buscar dados de `observacoes_aula_redes`

Em ambos `AdminDashboard.tsx` e `RelatoriosPage.tsx`:
- Adicionar fetch de `observacoes_aula_redes` (campos `nota_criterio_1` a `nota_criterio_9`, `municipio`, `status`)
- Filtrar apenas registros com `status = 'enviado'`

### 2. Lógica de exibição por programa

| Filtro programa | Módulo exibido |
|---|---|
| `escolas` ou `regionais` | Apenas `avaliacoes_aula` (modelo padrão, 5 dimensões, escala 1-5) |
| `redes_municipais` | Apenas `observacoes_aula_redes` (modelo REDES, 9 critérios, escala 1-4) |
| `todos` (N1 admin) | Ambos os módulos, um após o outro |

### 3. Módulo REDES — Conteúdo visual

Criar um bloco semelhante ao módulo padrão, mas com:
- Título: "Acompanhamento de Aula — Redes Municipais"
- Radar chart com 9 eixos (títulos curtos dos critérios de `REDES_OBSERVACAO_CRITERIA`), domínio [0, 4]
- Progress rings com médias por critério (máx 4)
- Labels dos critérios importados de `redesFormShared.tsx`

### 4. Arquivos alterados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/AdminDashboard.tsx` | Fetch `observacoes_aula_redes`, lógica condicional no módulo 4, novo bloco REDES |
| `src/pages/admin/RelatoriosPage.tsx` | Idem: fetch, filtro por programa, bloco REDES, inclusão no export Excel/PDF |

### 5. Detalhes de implementação

- Importar `REDES_OBSERVACAO_CRITERIA` de `redesFormShared.tsx` para obter labels curtos
- Criar constante com labels resumidos para os 9 critérios (ex: "Alinhamento caderno", "Objetivo claro", etc.)
- Calcular médias de cada `nota_criterio_N` sobre os registros filtrados
- No Dashboard, o módulo padrão fica condicionado a `programaFilter !== 'redes_municipais'` e o REDES a `programaFilter !== 'escolas' && programaFilter !== 'regionais'`
- No Relatórios, mesma lógica aplicada ao `programaFilter`

