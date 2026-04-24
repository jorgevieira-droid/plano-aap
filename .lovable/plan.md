Plano de ajuste

1. Configurar Formulários
- Adicionar um controle visível “Formulário ativo” acima de “Programas habilitados”.
- Quando ativo: manter a seleção de programas normalmente.
- Quando inativo: salvar `programas: []`, desabilitar visualmente os checkboxes de programas e mostrar uma ajuda curta informando que o formulário não aparecerá para nenhum programa.
- Remover a trava atual que impede desmarcar o último programa, para permitir que o estado inativo seja persistido.
- Atualizar a detecção de alterações para considerar corretamente `programas: []`.

2. Matriz de Ações × Perfis
- Na coluna “Programas”, quando o formulário tiver configuração com `programas` vazio, exibir um badge “Inativo” em vez de “—”.
- Manter o comportamento de fallback para formulários sem configuração explícita, se houver, conforme regra atual do sistema.
- Opcionalmente diferenciar visualmente o badge “Inativo” com estilo neutro/cinza para ficar claro que não pertence a nenhum programa.

3. Regras usadas em novas ações
- Garantir que formulários com `programas: []` não apareçam na seleção de “Nova Ação”.
- Ajustar `getProgramasForTipo` para diferenciar:
  - sem configuração explícita: fallback para todos os programas;
  - configuração existente com lista vazia: formulário inativo.
- Validar antes de salvar uma nova programação que o tipo escolhido está disponível para o programa selecionado.

Arquivos a ajustar
- `src/pages/admin/FormFieldConfigPage.tsx`
- `src/pages/admin/MatrizAcoesPage.tsx`
- `src/pages/admin/ProgramacaoPage.tsx`
- `src/hooks/useAcoesByPrograma.ts`

Sem alteração de banco de dados
- Será usada a coluna existente `form_config_settings.programas`.
- O estado inativo será representado por `programas: []`.