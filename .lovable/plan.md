## Diagnóstico

PDF confirma o formulário atual: 24 questões (Q1–Q16 contextuais + Q17–Q22 rubrica 1–4 com evidência + Parte 3 com 3 blocos A/B/C de pontos fortes/aspectos a fortalecer/encaminhamentos + observações gerais).

Estado atual do banco:
- `registros_acao` tipo `observacao_aula_redes`: 205 linhas
- `relatorios_visita_tecnica_microciclos` (destino real do form): 27 linhas — colunas `municipio`, `nome_escola`, `data`, `formador`, `pessoa_acompanhou`, `professor_observado`, `horario_inicio/fim`, `partes_visita`, `q1_organizacao_rotina`(+_outro), `q2..q16` (vários _outro), `nota_q17..nota_q22`, `evidencia_q17..q22`, `enca_*`, `encb_*`, `encc_*`, `observacoes_gerais`, `numero_visita`, `q8_material_didatico`, `q14_aulas_ultimos_30_dias`
- `observacoes_aula_redes`: 0 linhas (tabela legada inutilizada)
- `instrument_fields` para `observacao_aula_redes`: 9 registros legados (`nota_criterio_1..9`) que **não existem** mais na tabela.

Três problemas separados produzem o relatório errado:

### Problema 1 — Hook do gráfico aponta para tabela errada
`src/hooks/useInstrumentComparisonData.ts` (linhas 6–16) duplica `DEDICATED_TABLES` e ainda mapeia `observacao_aula_redes → observacoes_aula_redes` (vazia).

### Problema 2 — Tabela do relatório mistura campos legados (vazios) com colunas reais
`displayFields` em `RelatorioInstrumentosPage.tsx` parte de `orderedFields` (vindo de `instrument_fields`) → adiciona 9 colunas `nota_criterio_*` que estão sempre vazias para este instrumento.

### Problema 3 — `instrument_fields` desatualizado quebra o Comparativo
O Comparativo agrega médias em campos com `scale_min/scale_max`. Como os 9 registros antigos referenciam colunas inexistentes, todas as médias ficam nulas → gráfico vazio.

## Plano

### 1. Sincronizar `DEDICATED_TABLES` em `useInstrumentComparisonData.ts`
Alinhar com a página: `observacao_aula_redes → relatorios_visita_tecnica_microciclos` e adicionar `visita_tecnica_alfabetizacao`, `visita_tecnica_tarl`, `observacao_aula_gpa`, `reuniao_acomp_alfabetizacao`.

### 2. `RelatorioInstrumentosPage.tsx` — quando há tabela dedicada, listar apenas colunas reais
Alterar `displayFields` para:
- **Tabela dedicada:** ignorar `orderedFields`; usar exclusivamente as chaves presentes nas linhas retornadas (excluindo metadados). Labels via map dedicado (passo 3) com fallback para `humanizeKey`.
- **Genérico (`instrument_responses`):** comportamento atual (orderedFields + chaves extras).

Resultado: somem as 9 colunas vazias `nota_criterio_*`.

### 3. Mapa de labels amigáveis para a tabela dedicada de Microciclos
Adicionar em `RelatorioInstrumentosPage.tsx` um `DEDICATED_TABLE_LABELS: Record<string, Record<string,string>>` com entradas para `relatorios_visita_tecnica_microciclos` cobrindo as 24 questões + enca/encb/encc + observações gerais, ex.:

```
municipio → "Município"
nome_escola → "Escola"
data → "Data"
formador → "Formador"
numero_visita → "Nº da Visita"
horario_inicio / horario_fim → "Horário início" / "Horário fim"
pessoa_acompanhou → "Pessoa que acompanhou"
professor_observado → "Professor observado"
partes_visita → "Partes da visita"
q1_organizacao_rotina → "Q1. Escola organizada para rotina (3 encontros/semana)"
q1_organizacao_rotina_outro → "Q1. Outro"
q2_inicio_aulas → "Q2. Início das aulas de recomposição"
q3_tres_encontros → "Q3. Realiza 3 encontros semanais?"
q4_modelos_agrupamento → "Q4. Modelo(s) de agrupamento"
q4_modelos_agrupamento_outro → "Q4. Outro"
q5_anos_escolares → "Q5. Anos escolares contemplados"
q6_num_turmas → "Q6. Nº de turmas de recomposição"
q7_num_estudantes → "Q7. Nº de estudantes participantes"
q8_material_didatico → "Q8. Material didático"
q8_material_suficiente → "Q9. Material suficiente para todos?"
q9_registros_avaliacao → "Q10. Registros da avaliação de percurso"
q10_tempo_formativo → "Q11. Tempo formativo do CP"
q11_estudantes_matriculados → "Q12. Estudantes matriculados na turma observada"
q12_estudantes_presentes → "Q13. Estudantes presentes"
q14_aulas_ultimos_30_dias → "Q14. Aulas nos últimos 30 dias"
q13_componente → "Q15. Componente observado"
q14_agrupamento_turma → "Q16. Modelo de agrupamento observado"
q14_agrupamento_turma_outro → "Q16. Outro"
q15_uso_material → "Q17. Uso do material didático"
q16_cadernos_uso → "Q18. Cadernos em uso"
nota_q17..nota_q22 / evidencia_q17..q22 → títulos curtos das rubricas Q19..Q24 (intervenções alinhadas, metodologias, objetivo claro, verificação de compreensão, gestão do tempo, clima da sala) + "(nota)" / "(evidência)"
enca_pontos_fortes / enca_aspectos_fortalecer / enca_encaminhamentos → "A. Pontos fortes / Aspectos a fortalecer / Encaminhamentos"
encb_* → "B. ..."
encc_* → "C. ..."
observacoes_gerais → "Observações gerais"
```

A ordem das colunas seguirá a ordem das `column_name` na tabela (que já está alinhada com a numeração do PDF).

### 4. Atualizar `instrument_fields` para `observacao_aula_redes` (migration)
- **DELETE** dos 9 registros legados `nota_criterio_1..9` onde `form_type='observacao_aula_redes'`.
- **INSERT** dos 6 critérios reais (escala 1–4) conforme a imagem que você enviou:
  | field_key | scale_min | scale_max | sort_order | label |
  |---|---|---|---|---|
  | nota_q17 | 1 | 4 | 1 | As intervenções estavam alinhadas ao caderno e à faixa de desempenho de cada grupo? |
  | nota_q18 | 1 | 4 | 2 | O professor utilizou metodologias que favorecem a aprendizagem? |
  | nota_q19 | 1 | 4 | 3 | O objetivo de aprendizagem estava claro e foi comunicado aos estudantes? |
  | nota_q20 | 1 | 4 | 4 | O professor verificou a compreensão dos estudantes? |
  | nota_q21 | 1 | 4 | 5 | O professor gerenciou bem o tempo para atividades e dúvidas? |
  | nota_q22 | 1 | 4 | 6 | O clima da sala é de colaboração, respeito mútuo e favorável à aprendizagem? |

  `field_type='rating'`, `is_required=false`, `dimension=null`.

### 5. Validação
- Em REDES, abrir Relatório de Instrumentos → "Visitas Técnicas - Microciclos":
  - Tabela exibe apenas as colunas reais, com cabeçalhos correspondentes à numeração do PDF.
  - "Baixar XLS" gera planilha com os mesmos cabeçalhos.
- Abrir Comparativo Temporal: gráfico renderiza médias de Q19–Q24 (escala 1–4).
- Verificar que outros instrumentos (Observação de Aula, Microciclos Recomposição, IAB REDES, Monitoramento Gestão, etc.) seguem funcionando.

## Fora de escopo
- Refatorar os dois `DEDICATED_TABLES` num módulo único (mantém escopo curto).
- Cadastrar `instrument_fields` para os outros 4 instrumentos novos (`visita_tecnica_alfabetizacao`, `visita_tecnica_tarl`, `observacao_aula_gpa`, `reuniao_acomp_alfabetizacao`). A tabela deles vai funcionar via colunas dinâmicas; o Comparativo desses só será preenchido quando os campos forem cadastrados — posso fazer depois se você pedir.
