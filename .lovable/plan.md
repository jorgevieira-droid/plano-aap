# Nova ação: Registro da Reunião com o Professor (Programa Escolas)

Segue o mesmo modelo da "Reunião com a coordenação", que já existe.

## 1. Cadastro da ação
- Exclusiva do Programa Escolas. Aparece em Programação, Calendário e Adicionar Ação, para os mesmos perfis que hoje criam a Reunião com a coordenação.
- Campos: Consultor(a) responsável, Escola, Data e Professor (texto curto).
- O título não é pedido: é preenchido automaticamente como "Reunião com o Professor". Descrição, Tags e horários ficam ocultos.

## 2. Formulário de registro
1. Foco * (seleção múltipla): as 12 opções enviadas. Se marcar "Outros", abre um campo para descrever.
2. Tema da reunião * (texto)
3. Como foi a participação do professor? * Descompromissada / Parcialmente descompromissada / Parcialmente compromissada / Compromissada
4. A reunião gerou encaminhamentos? * Sim / Não
5. Anotações (opcional)

O sistema avisa se faltar alguma resposta obrigatória. O registro também aparece na visualização e na impressão em Registros.

## 3. Painel "Relatório – Reunião com o Professor"
Para N1 e N2/N3 do Programa Escolas, com os filtros de período, consultor(a) e escola:
- Números: reuniões realizadas, escolas atendidas, professores atendidos, reuniões com encaminhamentos.
- Gráficos: distribuição dos focos, participação do professor, encaminhamentos Sim/Não.
- Rankings por escola e por consultor(a).
- Lista de registros com tema e anotações, e exportação para Excel.

## 4. Resumo em "Relatórios de Gestão - Programa Escolas"
Novo cartão com os mesmos números do painel e o botão "Visualizar Relatório". A página fica fora do menu lateral, como os outros relatórios agrupados.

## Detalhes técnicos
- Novo tipo `registro_reuniao_professor`: incluir em `programacoes_tipo_check` e `registros_acao_tipo_check` (migração) antes do frontend; `acaoPermissions.ts` (rótulo, ícone, programa escolas, permissões copiadas de `registro_apoio_coordenador`), `INSTRUMENT_TYPE_SET`, `DEDICATED_CONTENT_TYPES`, habilitação em `form_config_settings` para `escolas`.
- Professor gravado em `programacoes.apoio_professor_nome`; título automático no salvamento em `ProgramacaoPage.tsx`.
- Novo `ReuniaoProfessorContent.tsx` + `validateReuniaoProfessor` (chaves: `foco`, `foco_outros`, `tema_reuniao`, `participacao_professor`, `encaminhamentos`, `anotacoes`) roteado em `InstrumentFormRouter.tsx`; seção de impressão em `AcaoPrintForm.tsx`.
- Nova página `RelatoriosReuniaoProfessorPanelPage.tsx` (rota `/relatorios-reuniao-professor`, em `App.tsx` e `ALLOWED_ROUTES`), lendo `instrument_responses` + `registros_acao` com `status='realizada'` e paginação em blocos de 1.000.
- Cartão novo em `RelatoriosGestaoEscolasPage.tsx`.
- Salvar memória da ação em `mem://features/action-types/registro-reuniao-professor`.
