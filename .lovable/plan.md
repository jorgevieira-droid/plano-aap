
# Ajustes na ação "Visitas Técnicas – Microciclos"

## Decisões confirmadas
- **Renumeração apenas visual** — colunas do banco mantêm os nomes atuais (`q8_material_suficiente`, `q9_registros_avaliacao`, `q10_tempo_formativo`).
- **Parte 2 condicional**: ocultar quando "Observação de aula" não estiver marcada em `partes_visita`. Dados já gravados não são apagados (apenas ocultados). Em novos gerenciamentos, a Parte 2 só aparece após a marcação.
- A "mecânica aconteceu? → preencher checklist?" **já existe** hoje no fluxo de Registros — sem mudança.

## 1. Cadastro da ação — `src/pages/admin/ProgramacaoPage.tsx`
Incluir Escola (Entidade Filho) obrigatória, no mesmo padrão da Visita Técnica – Alfabetização (REDES):
- Adicionar `visita_tecnica_microciclos` em `needsEntidadeFilho`.
- Renderizar o seletor de Escola filtrado pela Entidade Pai.
- Persistir em `programacoes.entidade_filho_id` (coluna já existente).
- `handleEdit` repõe o valor; submit bloqueia se vazio.

## 2. Formulário — `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`

### Parte 0 (cabeçalho de gerenciamento)
- "Durante a visita técnica, houve:" (já existe). Sem alteração estrutural.

### Parte 1
- **Q1** ("organização da rotina"): incluir opção "Outro" que abre caixa de texto, gravada em nova coluna `q1_organizacao_rotina_outro`.
- **Nova Q8** "Qual material didático será utilizado?" — seleção única:
  - Cadernos de Curadoria
  - Horizonte + Cadernos de Curadoria
  - Cadernos de Curadoria + Descobertas
  - Descobertas
  - Persistida em nova coluna `q8_material_didatico`.
- Renumeração **visual**: o atual "Q8 material suficiente" passa a exibir "9.", e os subsequentes seguem. Nomes de colunas inalterados.
- **Q10 visual ("tempo formativo")**: incluir opção "Não se aplica" na lista do campo `q10_tempo_formativo`.

### Parte 2 — passa a ser exibida somente se `partes_visita` contiver `"observacao_aula"`
- Bloco inteiro Q11→Q22 oculto quando a opção não está marcada. Sem apagar respostas existentes.
- **Nova Q14** "Quantas aulas ocorreram nos últimos 30 dias?" — número inteiro. Persistida em nova coluna `q14_aulas_ultimos_30_dias`. Renumera visualmente as posteriores.
- **Q19** (alinhamento ao caderno): corrigir grafia para "alinhadas ao caderno e à faixa de desempenho **de cada** grupo".

### Parte 3 e Observações Gerais
Sem alterações.

## 3. Impressão — `src/components/print/VisitaMicrociclosPrintSection.tsx`
Espelhar todas as mudanças do formulário:
- Nova Q8 (material didático) e nova Q14 (aulas últimos 30 dias).
- Opção "Outro" em Q1 (exibe texto se presente) e "Não se aplica" em Q10.
- Renumeração visual.
- Ocultar bloco da Parte 2 quando `partes_visita` não contém `"observacao_aula"`.
- Corrigir texto da Q19.

## 4. Migration

Adicionar três colunas em `relatorios_visita_tecnica_microciclos`:
- `q1_organizacao_rotina_outro TEXT`
- `q8_material_didatico TEXT`
- `q14_aulas_ultimos_30_dias INTEGER`

Sem alterações em RLS/GRANTs (tabela já configurada).

## Fora de escopo
- Fluxo "aconteceu/preencher" (já implementado).
- Renomeação de colunas existentes.
- Mudanças em dashboards/relatórios consolidados.
