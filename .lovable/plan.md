# Correções: ação "Acompanhamento Professor Tutor" e recarregamento do calendário

## 1. Ação não aparece para Redes Municipais

O banco já está correto: `acomp_professor_tutor` está habilitada para `regionais` e `redes_municipais`, e as permissões de perfil (N5 Formador pode criar) também estão corretas.

O problema é cache: ao salvar em "Configurar Formulários", a tela invalida as chaves `form_config_settings` e `form_config_settings_admin`, mas quem alimenta o diálogo "Selecione o Tipo de Ação", a página "Adicionar Ação" e os dashboards usa a chave `form_config_settings_programas` — que nunca é invalidada. Com o cache de 30 minutos, a nova liberação só aparece muito depois (ou após recarregar o navegador).

Correção: incluir a invalidação de `form_config_settings_programas` ao salvar as configurações do formulário.

## 2. "Auto refresh" em Programação / Meu Calendário

O carregamento do calendário é disparado por um efeito que depende do objeto `user` inteiro. Quando a sessão renova o token em segundo plano, esse objeto é recriado (mesmo usuário), o efeito roda de novo, `isLoading` volta a `true` e a tela mostra o spinner de tela cheia — o que parece um recarregamento.

Correção: fazer o efeito depender apenas do identificador do usuário (`user?.id`), mantendo o restante da lógica intacta.

## Detalhes técnicos

- `src/pages/admin/FormFieldConfigPage.tsx`: adicionar `queryClient.invalidateQueries({ queryKey: ['form_config_settings_programas'] })` no `onSuccess` de `saveSettingsMutation`.
- `src/pages/admin/ProgramacaoPage.tsx`: trocar o array de dependências `[isGestor, isManager, isAAP, user]` por `[isGestor, isManager, isAAP, user?.id]` no efeito que chama `fetchProgramacoes()` e `fetchData()`.

## Verificação

- Simular um formador de Redes Municipais e confirmar que "Acompanhamento Professor Tutor" aparece no diálogo de nova ação e em "Adicionar Ação".
- Deixar Programação aberta, trocar o foco da aba e voltar: nenhum spinner de tela cheia deve aparecer.
