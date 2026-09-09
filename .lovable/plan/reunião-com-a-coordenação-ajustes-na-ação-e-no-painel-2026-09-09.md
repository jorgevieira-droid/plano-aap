# Reunião com a coordenação — ajustes na ação e no painel

## 1. Cadastro da ação

- Ocultar os campos **Título**, **Hora Início** e **Hora Fim** (Título preenchido automaticamente como "Reunião com a coordenação").
- Manter: Consultor, Escola, Data e Coordenador (obrigatórios).

## 2. Formulário de registro (perguntas numeradas)

Todas obrigatórias, exceto Anotações.

1. **Foco** (seleção múltipla) — opções ampliadas:
   - Análise de resultados das avaliações
   - Discussão de Documentos Orientadores e Lives
   - Construção conjunta de pautas formativas
   - Acompanhamento formativo de professores
   - Acompanhamento da aplicação de avaliações
   - Acompanhamento de projetos/ações de recomposição
   - Outros (abre campo "Qual outro foco?")
2. **Tema da reunião** (texto longo) — renomeado de "Tema do Apoio"
3. **Como foi a participação do coordenador?** — descompromissada / parcialmente descompromissada / parcialmente compromissada / compromissada
4. **A reunião gerou encaminhamentos?** — Sim / Não. Em "Sim", abre **Quais?** (texto longo, obrigatório)
5. **Anotações** (texto longo, opcional)

Removido: **NPS Apoio**.

## 3. Painel "Relatório - Reunião com a coordenação"

- Remover indicadores de NPS (Nota média de NPS e NPS) dos KPIs e do PDF.
- KPIs: total de reuniões, escolas atendidas, coordenadores atendidos, % de reuniões com encaminhamentos.
- Distribuições: **Foco** (com as novas opções), **Participação do coordenador**, **Encaminhamentos (Sim/Não)**.
- Listas qualitativas: Temas da reunião, Encaminhamentos ("Quais?") e Anotações — com data, escola, coordenador e consultor.
- Rankings por Escola e por Consultor mantidos, sem colunas de NPS.
- Registros detalhados: colunas data, escola, coordenador, consultor, foco, participação, encaminhamentos; ao expandir, tema, encaminhamentos e anotações.
- Exportações PDF e Excel refletem as mesmas mudanças.

## Detalhes técnicos

- `ApoioCoordenadorContent.tsx`: novas opções de foco (`APOIO_COORDENADOR_FOCO_OPTIONS`), chaves `tema_apoio` (rótulo alterado), `participacao_coordenador`, `encaminhamentos`, `encaminhamentos_quais`, `anotacoes`; remoção de `nps`; função `validateApoioCoordenador` exportada.
- `ProgramacaoPage.tsx` e `RegistrosPage.tsx`: aplicar a validação; ocultar Título/Hora Início/Hora Fim para `registro_apoio_coordenador` e preencher título padrão.
- `RelatoriosApoioCoordenadorPanelPage.tsx`: remover cálculos de NPS (`npsMedio`, `npsScore`, `calcNps`) e adicionar as novas agregações e blocos (UI + PDF).
- `RelatoriosGestaoEscolasPage.tsx`: remover eventual KPI de NPS dessa ação no resumo consolidado.
- Registros antigos com `nps` permanecem no banco, apenas não são mais exibidos.
- Atualizar a memória `features/action-types/registro-apoio-coordenador`.
- Validar com `npx tsgo --noEmit -p tsconfig.app.json`.
