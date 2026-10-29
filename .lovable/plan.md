# Alteração de Agenda da Visita — opções de "Contexto da alteração"

## Nova lista de opções (no formulário) — ordem A→Z, "Outros" sempre por último
1. Ausência do Consultor (nova)
2. Ausência do Professor/ Coordenador (antes: "Ausência do profissional")
3. Avaliação Externa (nova)
4. Conselho de Classe
5. Convocação Professor/ Coordenador (antes: "Convocação do profissional")
6. Evento na escola
7. Reunião de Pais
8. Outros

A mesma ordem vale para o filtro e os gráficos do painel.

"Feriado" sai do formulário: não pode mais ser escolhido em registros novos nem ao editar.

## Registros já salvos
- Hoje existem 35 registros com "Ausência do profissional" e 14 com "Convocação do profissional". Eles passam a usar os novos nomes, para que antigos e novos sejam somados juntos no painel.
- Os 8 registros com "Feriado" ficam como estão. No painel "Relatório – Alteração de Agenda", "Feriado" continua aparecendo como categoria histórica, mas só quando houver registros no período filtrado.

## Painel "Relatório – Alteração de Agenda"
- A lista de categorias do filtro e dos gráficos é atualizada com os novos nomes e as duas opções novas.

## Detalhes técnicos
- Atualizar `instrument_fields.metadata.options` de `alteracao_agenda_visita / contexto_alteracao`.
- Atualizar via query os valores do array `instrument_responses.responses->'contexto_alteracao'` (substituir os dois rótulos antigos).
- `RelatoriosAlteracaoAgendaPanelPage.tsx`: atualizar `CONTEXTO_OPTIONS`; incluir "Feriado" só se existir nos dados filtrados.
