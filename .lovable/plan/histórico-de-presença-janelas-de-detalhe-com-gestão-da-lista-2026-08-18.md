# Histórico de Presença — janelas de detalhe com gestão da lista

## O que muda

### Aba "Por Formação"
- Cada linha da tabela passa a ser clicável e abre uma janela secundária com a lista de presença daquele encontro: nome do professor, escola e situação (Presente / Ausente).
- Cada participante tem uma ação **Remover da lista**, que o retira daquele encontro (deixa de ser contabilizado no total e no % de presença).
- Participantes removidos aparecem em uma seção "Removidos deste encontro" dentro da mesma janela, com ação **Reincluir** (volta como ausente, podendo ser marcado depois no fluxo normal de registro).
- Os indicadores da linha (Presentes / Total / % Presença) são recalculados ao fechar a janela.

### Aba "Por Professor"
- Clique no nome do professor abre uma janela secundária listando os encontros elegíveis dele (título, data, escola, horas, situação de presença).
- Cada encontro tem ação **Remover deste encontro** e, para os já removidos, **Reincluir**.
- Elegíveis, presenças, % e horas do professor são recalculados após as alterações.

### Permissões
- As ações de remover/reincluir só aparecem para perfis N1, N2 e N3 (admin, gestor, coordenador de programa). Demais perfis veem as janelas apenas em modo leitura.
- N2/N3 continuam limitados aos encontros dos seus programas pelas regras já existentes de acesso aos dados.

## Detalhes técnicos

- Arquivo principal: `src/pages/admin/HistoricoPresencaPage.tsx`. Dois novos componentes de diálogo (shadcn `Dialog`), no padrão do projeto: `max-h-[85vh] overflow-y-auto w-[95vw] sm:max-w-lg` (a lista do encontro pode usar `sm:max-w-2xl`).
- "Remover da lista" = `delete` na tabela `presencas` pelo par (`registro_acao_id`, `professor_id`). "Reincluir" = `insert` com `presente = false`.
- Consistência das métricas: nas duas abas, um encontro passa a ser considerado **elegível para o professor quando existe linha em `presencas`** para o par encontro/professor. Hoje a aba "Por Professor" calcula elegibilidade apenas por escola + período de atividade do professor; esse critério passa a ser usado somente para montar a lista de "quem pode ser reincluído", e não mais para contar elegíveis. Isso é o que torna a remoção efetiva nos percentuais.
- Após cada mutação, os dados da página são recarregados (mesmo `fetchData` já existente) para manter tabelas, exportação Excel e diálogos sincronizados.
- Feedback via `toast` (sucesso/erro) e exibição de erro detalhado do backend quando houver.
- As políticas de RLS de `presencas` já cobrem N1–N3; nenhuma migração de banco é necessária.
