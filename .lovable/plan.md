## Objetivo

Implementar a mecânica completa do programa **Regionais**: garantir que o cadastro de ações exiba SOMENTE "Monitoramento de Ações Formativas (Regionais)" quando o usuário tem acesso ao programa Regionais (real ou simulado), e adicionar a pergunta inicial "A ação aconteceu?" no gerenciamento, antes do formulário das 5 perguntas obrigatórias e do fluxo de rubrica.

## Contexto do que JÁ existe

- **Cadastro** (`ProgramacaoPage.tsx`) já tem todos os campos da sua lista para `monitoramento_acoes_formativas`: Programa, Título, Descrição, Tags, Data, Hora Início/Fim, Entidade, Frente de Trabalho/Projeto, Público do Encontro, Local do Encontro. Os 5 campos de fechamento já foram removidos do cadastro.
- **Gerenciamento** (`MonitoramentoRegionaisManageDialog.tsx`) já tem as 5 perguntas obrigatórias (Fechamento Sim/Parcialmente/Não, Encaminhamentos, Observações, Avanços, Dificuldades), AlertDialog "Deseja preencher uma rubrica?", e seleção da rubrica entre as ações do programa Regionais excluindo `monitoramento_acoes_formativas` e `lista_presenca`.
- `REGIONAIS_CADASTRABLE_TIPOS = {monitoramento_acoes_formativas}` já restringe o tipo cadastrável sob o programa Regionais.

## O que está errado hoje

1. **Seletor "Selecione o Tipo de Ação" abre vazio** quando o usuário tem acesso só a Regionais (caso real do simulador N2-Gestor + programa Regionais demonstrado no print). Causa: o filtro usa `gestorProgramas` (estado carregado da tabela `gestor_programas` do usuário REAL); na simulação esse array fica vazio porque o usuário real é admin.
2. **Falta a pergunta "A ação aconteceu?"** antes do gerenciamento. Hoje o dialog abre direto na 1ª pergunta.

## Mudanças

### `src/pages/admin/ProgramacaoPage.tsx`

**A) Seletor de tipo respeita programas efetivos (real ou simulado)**

- Importar `effectiveProgramas` do `useAuth()` (já exposto pelo `AuthContext`).
- Calcular `effectiveProgramasForFilter`: se `isSimulating && simulatedPrograma` → `[simulatedPrograma]`; caso contrário, manter prioridade atual (`gestorProgramas` → `aapProgramas` → `effectiveProgramas` do profile → vazio).
- No filtro do seletor (≈linha 2697-2702), substituir as checagens por uma única regra: se `effectiveProgramasForFilter.length > 0` → exigir interseção com `getProgramasForTipo(t)`; se vazio (admin sem restrição) → mostrar todos.
- Aplicar a mesma lógica no botão "Programar" inline da página (≈linha 3703) para consistência.
- Resultado prático: simulando Regionais → o seletor lista APENAS "Monitoramento de Ações Formativas – Regionais".

**B) Confirmação "A ação aconteceu?" no gerenciamento (em `RegistrosPage.tsx`)**

- Novo state `showConfirmMonitRegionaisAconteceu` (espelho do `showConfirmRedesAconteceu`).
- No bloco `registro.tipo === 'monitoramento_acoes_formativas'` (≈linha 662): se status ∈ {`agendada`, `reagendada`, `prevista`} → abrir o AlertDialog de confirmação; caso contrário → abrir direto o `MonitoramentoRegionaisManageDialog` (comportamento atual).
- Novo handler `handleConfirmMonitRegionaisAconteceu(aconteceu)`:
  - **Não** → `registros_acao.status='nao_realizada'` (e `programacoes.status='nao_realizada'` se houver `programacao_id`); toast "Ação marcada como não realizada"; invalida queries; fecha tudo.
  - **Sim** → abre o `MonitoramentoRegionaisManageDialog` no passo `form` (5 perguntas → AlertDialog rubrica → seleção/preenchimento).
- Renderizar `<AlertDialog>` com título "A ação aconteceu?", descrição contextual (tipo + escola) e botões Não/Sim — visualmente alinhado ao já existente do REDES.

## Fora de escopo

- `MonitoramentoRegionaisManageDialog` permanece intocado (5 perguntas + rubrica continuam idênticos).
- Cadastro: nenhum campo adicionado/removido (já está conforme sua lista).
- Sem alterações em outros programas ou tipos de ação.
- Sem migração de banco; reaproveita `nao_realizada` já existente.
