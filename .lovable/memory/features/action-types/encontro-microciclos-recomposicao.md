---
name: Encontro Formativo Microciclos de Recomposição
description: Independent action available in all 3 programs with 0–2 binary instrument and auto next-meeting scheduling
type: feature
---
Tipo `encontro_microciclos_recomposicao` é uma ação independente disponível nos 3 programas (Escolas, Regionais, REDES Municipais).

Permissões: N1 CRUD all, N2/N3 CRUD prog, N4.1/N4.2/N5 CRUD ent, N6/N7/N8 NONE (mesmo padrão dos outros REDES).

Formulário (escala 0-1-2):
- Cabeçalho: município, data, formador, local, horário, **Ponto Focal da Rede**.
- 10 itens de verificação (item_1..item_10) sobre microciclo, agrupamento por proficiência, quórum, Plataforma Trajetórias, Quizzes/QR Code, agrupamentos, materiais, percurso.
- 2 single-choice de Plataforma Trajetórias (acesso, quizzes) + observações.
- Encaminhamentos: pontos fortes, aspectos a fortalecer, encaminhamentos acordados, prazo, responsável.
- Próximo encontro: **se data preenchida → cria automaticamente nova `programacao` agendada** (mesma escola/formador/programa, status='prevista', descricao=pauta).

Lista de presença usa atores educacionais da entidade (sem filtro por turma_formacao — campo TURMA desconsiderado conforme pedido).

Tabela: `relatorios_microciclos_recomposicao`. Disponível em ProgramacaoPage, RegistrosPage, AAPRegistrarAcaoPage, HistoricoPresencaPage, MatrizAcoesPage, FormFieldConfigPage (registrado em form_config_settings com 3 programas).
