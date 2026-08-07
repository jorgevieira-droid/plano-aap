# Adicionar Ação — registro direto sem agendamento

Nova página que lista as ações disponíveis para o programa e o perfil do usuário e permite registrar a ação na hora: preenche o cadastro (mesmo formulário já usado na Programação, porém marcado como realizada) e emenda direto no formulário de gerenciamento. A ação registrada passa a aparecer normalmente no calendário/Programação e em Registros.

## Fluxo do usuário

```text
/adicionar-acao
  cards com as ações permitidas (programa + perfil)
        |  clique
        v
  formulário de cadastro atual (Programação), pré-preenchido:
  tipo escolhido, data de hoje, status = realizada
        |  salvar
        v
  abre imediatamente o formulário de gerenciamento da ação
        |  concluir
        v
  ação consta no calendário/Programação e em Registros como realizada
```

## O que será construído

1. **Página `/adicionar-acao`** ("Adicionar Ação")
   - Grade de cards, um por tipo de ação, com ícone e rótulo, ordenados A–Z (pt-BR).
   - Lista filtrada por: ações habilitadas para o(s) programa(s) do usuário (`form_config_settings`) e permissão de criação do perfil (`canUserCreateAcao`).
   - Seletor de programa quando o usuário tem mais de um programa vinculado; auto-seleção quando há apenas um.

2. **Cadastro reaproveitado**
   - O clique no card leva ao formulário de cadastro existente da Programação, aberto já no tipo escolhido, com data de hoje e marcado como realizado (sem etapa de agendamento).
   - Todos os campos condicionais atuais (entidade, entidade filho, ator, horários, projeto, turma etc.) continuam valendo, sem duplicação de regras.

3. **Emenda automática no gerenciamento**
   - Ao salvar, o usuário é levado direto ao formulário de gerenciamento daquele registro (instrumento, presença, consultoria, monitoramento — conforme o tipo), sem passar manualmente por Registros.
   - Concluído o gerenciamento, o registro e a programação ficam com status realizada.

4. **Menu**
   - Novo item "Adicionar Ação" no grupo "Ferramentas de Gestão", acima de "Programação"/"Meu Calendário", visível para todos os perfis que possam criar ao menos um tipo de ação.
   - Rota liberada nas listas de rotas permitidas por nível.

5. **Página inicial para perfis operacionais/locais de Escolas**
   - Usuários dos níveis N4–N8 cujo vínculo de programa seja exclusivamente `escolas` passam a entrar em `/adicionar-acao` em vez do painel.
   - N1–N3 continuam entrando pelo Dashboard.

6. **Manual do Usuário**
   - Nova seção descrevendo a página, mantendo a numeração contínua do agrupamento atual.

## Detalhes técnicos

- Nova página `src/pages/admin/AdicionarAcaoPage.tsx`; rota em `src/App.tsx`; item de menu em `src/components/layout/Sidebar.tsx`; rota adicionada em `ALLOWED_ROUTES` (`AppLayout.tsx`).
- Fonte das ações: `useAcoesByPrograma().getAcoesByPrograma(programa)` + `canUserCreateAcao(effectiveRole, tipo)` de `src/config/acaoPermissions.ts`.
- Reuso do cadastro: navegação para `/programacao?novaAcao=<tipo>&direto=1`. `ProgramacaoPage` ganha um efeito (padrão já existente para `editProgramacao`) que abre o diálogo de criação com o tipo pré-selecionado, data de hoje e modo direto (status realizada, sem exigir agendamento prévio).
- Após o insert de `programacoes` + `registros_acao` no modo direto, redireciona para `/registros?manage=<registro_id>`; `RegistrosPage` ganha leitura desse parâmetro (mesmo padrão do parâmetro `status` já suportado) e dispara o handler de gerenciamento existente para o registro, cobrindo todos os tipos (instrumento, `acompanhamento_aula`, monitoramento regionais, presença).
- Sem mudanças de schema: continua sendo criada uma `programacao` vinculada, o que garante presença no calendário.
- Página inicial: `getDefaultRoute` em `AppLayout.tsx` passa a considerar os programas do usuário (`user_programas` já disponíveis no `AuthContext`); tiers `operational` e `local` com apenas `escolas` recebem `/adicionar-acao`.
