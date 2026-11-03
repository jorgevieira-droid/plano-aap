## Mesmo critério de contagem de professores apoiados

Critério único: cada combinação **Professor + Escola + Segmento + Componente** conta como 1 professor apoiado (igual à tabela "Apoios por professor"). Registros sem nome de professor ficam fora.

### 1. Relatórios de Apoio Presencial
- O card "Total de professores apoiados" (e o PDF do painel) passa a mostrar o número de linhas da tabela "Apoios por professor" (ex.: 88 em vez de 77).

### 2. Reunião Mensal N1 (PRG Escolas) — gráfico 7
- "Professores apoiados por escola segundo a frequência de apoio presencial" passa a usar o mesmo critério: um professor que aparece com dois componentes ou segmentos diferentes na mesma escola conta 2 vezes, e cada um é classificado em "Com 1 AP" ou "Com 2+ APs" pela quantidade de apoios daquela combinação.
- Somente o gráfico 7 muda; os demais módulos (painel geral, cobertura, recorrência) ficam como estão.

### Detalhe técnico
- `RelatoriosApoioPresencialPanelPage.tsx`: `professoresApoiados = apoiosPorProfessor` filtrado sem "Sem professor"/vazio, `.length`.
- `ReuniaoMensalEscolasPage.tsx`: no `porEscola`, agrupar `apoios` por chave `escolaId|professor|segmento|normalizeApoioComponente(componente)` (minúsculas) em vez de usar `profsApoiados`.
