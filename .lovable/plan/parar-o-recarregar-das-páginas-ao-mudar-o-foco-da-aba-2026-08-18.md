# Parar o "recarregar" das páginas ao mudar o foco da aba

## O que foi verificado

Não existe nenhuma chamada a `location.reload()` nem nenhum listener de `visibilitychange`/`focus` no código do app (busca em `src/` e nas funções de backend não retornou nada). O cache global já está com `refetchOnWindowFocus: false`.

A causa real do efeito de "recarregar tudo" ao voltar para a aba está no contexto de autenticação (`src/contexts/AuthContext.tsx`):

- O cliente de autenticação renova o token automaticamente quando a aba volta a ficar visível.
- Cada renovação dispara o listener `onAuthStateChange`, que hoje executa `setIsLoading(true)` e busca o perfil de novo — mesmo sendo o mesmo usuário já carregado.
- Enquanto `isLoading` é `true`, o layout (`AppLayout`) troca a página inteira por um spinner de tela cheia. Ao voltar, a página é montada do zero e perde o estado local (abas, rolagem, seleções não persistidas).

## O que será feito

1. No listener de mudança de sessão, tratar apenas trocas reais de usuário:
   - Se o usuário logado é o mesmo que já está no estado, apenas atualizar a sessão/token em silêncio — sem `setIsLoading(true)` e sem refazer a busca do perfil.
   - Buscar perfil com indicador de carregamento apenas quando não há perfil carregado ou quando o usuário mudou (login, troca de conta).
   - Logout continua limpando o estado imediatamente.
2. Ignorar explicitamente os eventos de renovação de token (`TOKEN_REFRESHED`, `INITIAL_SESSION` já resolvido) para fins de recarregar dados.
3. Garantia adicional: manter `refetchOnWindowFocus: false` e `refetchOnMount: false` como já estão, e não introduzir nenhum listener de visibilidade.

Resultado: sair da aba e voltar não mostra mais o spinner de tela cheia nem remonta a página; os filtros, abas e resultados continuam exatamente como estavam.

## Detalhes técnicos

- `src/contexts/AuthContext.tsx`: guardar o `user.id` atual em um `ref`; dentro de `onAuthStateChange`, comparar `session?.user?.id` com o ref e só chamar `fetchProfile` + `setIsLoading` quando houver diferença (ou perfil ausente). Sessão e usuário continuam sendo atualizados sempre, para o token novo valer nas requisições.
- Sem alterações de banco, RLS, permissões ou regras de negócio.

## Riscos

- Alterações de perfil feitas em outra aba/por um admin passam a ser refletidas apenas no próximo login ou ao usar o refresh existente (`refreshProfile`), que continua disponível e é chamado após ações que alteram o perfil.
