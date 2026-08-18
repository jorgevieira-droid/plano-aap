# Visitas Técnicas — Microciclos: atualização do formulário

Ajuste do formulário conforme o documento enviado, mantendo intactos os registros já preenchidos.

## Cabeçalho e roteiro
- Mantém identificação atual (município, escola, data, formador, pessoa que acompanhou, professor observado, horários, nº da visita).
- Mantém o bloco "Durante a visita técnica, houve" (seleção múltipla, 4 opções) e a regra: Parte 2 só aparece se "Observação de aula" estiver marcada.

## Parte 1 — Implementação na escola (últimos 30 dias)
Novas perguntas:
1. Quantas vezes por semana acontecem as aulas de recomposição? (única: 1, 2, 3 vezes, Outro + texto)
2. Quantas horas-aula por componente? (única: 1, 2, 3, Outro + texto)
3. Qual material didático será utilizado? (agora **seleção múltipla**: Cadernos de Curadoria; Horizonte + Cadernos de Curadoria; Cadernos de Curadoria + Descobertas; Descobertas; Outro + texto)
4. O coordenador pedagógico consulta os dados da plataforma Trajetória? (Sim/Não)
5. Os professores consultam os dados da plataforma Trajetória? (todos ou quase todos / a maioria / alguns / não)
6. A Direção da Escola faz caminhada pedagógica? (em todas as salas / apenas nas salas dos Microciclos / não)

Mantidas: material suficiente para todos (Sim/Não); registros da avaliação de percurso; tempo formativo do ponto focal (texto da 3ª alternativa atualizado para "…mas a pauta relacionada aos microciclos é pouco ou quase não é abordada").

Removidas do preenchimento: organização da rotina de 3 encontros, início/previsão das aulas, "realiza 3 encontros semanais", modelo de agrupamento da escola, anos escolares contemplados, nº de turmas, nº de estudantes participantes.

## Parte 2 — Observação de aula
Novas/ajustadas:
- O professor é identificado como professor "modelo"? (Sim / Não / Ainda não foi avaliado) — nova
- Componente observado (LP / Matemática) — mantida
- Modelo de agrupamento da turma — rótulos atualizados: Modelo 1 Seriado, Modelo 1 Multisseriado, Modelo 2 (professor adicional), Modelo 3 (agrupamento interno), Outro (texto), Não há reagrupamento
- Uso do material didático (cadernos de curadoria/Descobertas) — mantida

Rubricas 1–4 (nota 1 a 4 + campo de evidência, que será mantido):
1. Intervenções alinhadas ao caderno e à faixa de desempenho
2. Objetivo de aprendizagem claro e comunicado
3. Verificação da compreensão dos estudantes
4. Gestão do tempo para atividades e dúvidas

Removidas: rubricas "metodologias que favorecem a aprendizagem" e "clima da sala"; nº de matriculados/presentes; nº de aulas nos últimos 30 dias; cadernos em uso.

## Parte 3 — Devolutiva
Passa a ser um único campo de texto longo: "Observações gerais — outros pontos relevantes relacionados à implementação da metodologia ou devolutiva ao Coordenador Pedagógico (CP)".
Os três blocos A/B/C (pontos fortes / aspectos a fortalecer / encaminhamentos) saem do preenchimento.

## Preservação do histórico
- Nenhuma coluna existente é apagada: campos descontinuados permanecem no banco e continuam aparecendo no PDF, no Relatório de Instrumentos e na extração de bases **quando o registro antigo tiver conteúdo**.
- Registros antigos abertos para edição mostram o formulário novo; os valores antigos continuam salvos e visíveis na impressão.
- Gráficos do dashboard/relatórios continuam calculando as 6 dimensões: as duas rubricas descontinuadas seguem no gráfico enquanto houver registros antigos com nota, e as 4 novas seguem alimentadas.

## Detalhes técnicos
- Migração aditiva em `relatorios_visita_tecnica_microciclos`: novas colunas nullable (`q_frequencia_semanal` + `_outro`, `q_horas_aula` + `_outro`, `q_material_didatico_multi text[]` + `_outro`, `q_cp_consulta_trajetoria`, `q_professores_consultam_trajetoria`, `q_caminhada_pedagogica`, `q_professor_modelo`). Nenhum DROP COLUMN.
- `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`: novo schema/UI conforme acima; leitura de registros existentes mantém compatibilidade (usa colunas novas quando presentes, senão as antigas).
- `src/components/print/VisitaMicrociclosPrintSection.tsx`: renderiza os novos campos e mantém a exibição condicional dos campos legados.
- `src/components/dashboard/VisitaMicrociclosBlock.tsx`: mantém as 6 dimensões, mas oculta as descontinuadas quando não houver nenhum dado.
- `RelatorioInstrumentosPage`/`ExtracaoBasesInstrumentosPage`: incluir as novas colunas nas exportações.
