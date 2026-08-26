# Nova Ação: Registro de Apoio ao Coordenador

Nova ação/formulário exclusiva do **Programa de Escolas**, seguindo o mesmo padrão das ações recentes (Formação Coletiva, Planejamento Conjunto).

## 1. Cadastro da ação (Programação / Adicionar Ação)

Campos exibidos:
- **Consultor** (responsável, seletor de usuário)
- **Escola** (entidade obrigatória)
- **Data**
- **Título**
- **Coordenador** (texto curto — reaproveita o campo `coord_nome` já existente na base)

Ocultos: **Descrição** e **Tags**. Sem segmento, componente ou ano/série.

## 2. Formulário de registro

- **Foco** — seleção múltipla: Análise de resultados das avaliações / Discussão de Documentos Orientadores e Lives / Construção conjunta de pautas formativas / Outros (com campo de texto quando "Outros")
- **Tema do Apoio** — texto longo
- **NPS Apoio** — botões de nota de 1 a 10
- **Anotações sobre conquistas e desafios do Apoio** — texto longo

## 3. Página "Relatório - Registro de Apoio ao Coordenador"

Rota `/relatorios-apoio-coordenador`, visível para N1/N2/N3 do Programa de Escolas, com filtros persistidos de período, escola e consultor (mesmo padrão de "Relatórios - Apoio Presencial"), exportação em PDF com marca dupla e exportação Excel.

Layout proposto:

1. **Cards de KPI**
   - Total de apoios registrados
   - Escolas atendidas
   - Coordenadores atendidos (nomes distintos)
   - Nota média de NPS
   - NPS (fórmula oficial: % promotores 9-10 − % detratores 0-6)

2. **Distribuição de Foco** — gráfico de barras horizontais com contagem e % de cada opção (seleção múltipla), ordenado do maior para o menor.

3. **Evolução mensal** — gráfico de linhas com: apoios no mês, escolas atendidas, Nota média de NPS e NPS.

4. **Ranking por Escola** — tabela com escola, nº de apoios, coordenadores atendidos, nota média de NPS e barra de progresso.

5. **Ranking por Consultor** — tabela com consultor, nº de apoios, escolas atendidas e nota média de NPS.

6. **Registros detalhados** — tabela expansível com data, escola, coordenador, consultor, foco, NPS; ao expandir mostra Tema do Apoio e as Anotações de conquistas/desafios na íntegra.

Listas e rankings ordenados em pt-BR; "0"/vazio não entra nas médias.

## Detalhes técnicos

- Migração: adicionar `registro_apoio_coordenador` aos checks `programacoes_tipo_check` e `registros_acao_tipo_check`; inserir em `form_config_settings` com `programas = {escolas}`.
- `src/config/acaoPermissions.ts`: novo `AcaoTipo`, label "Registro de Apoio ao Coordenador", permissões por papel (mesmo conjunto de Formação Coletiva), `responsavelLabel: 'Consultor'`, `requiresEntidade: true`.
- Novo `ApoioCoordenadorContent.tsx` em `src/components/formularios/`, registrado em `InstrumentFormRouter` e em `DEDICATED_CONTENT_TYPES`.
- `ProgramacaoPage.tsx`: ocultar Descrição/Tags e exibir o campo Coordenador (`coord_nome`) para este tipo.
- Nova página `RelatoriosApoioCoordenadorPanelPage.tsx` lendo `instrument_responses` com `form_type = 'registro_apoio_coordenador'`, registrada em `App.tsx`, `AppLayout.tsx` e `Sidebar.tsx` (`requiresAcao`).
- `useInstrumentFields.ts`: incluir o novo tipo na lista de instrumentos para extração/relatórios.
- Registrar memória da nova ação em `.lovable/memory/features/action-types/`.
