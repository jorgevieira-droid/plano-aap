# Navegação sem recarregar tudo ao sair da página

## Objetivo
Ao sair de uma página e voltar (ou trocar de aba do navegador), o sistema deve manter os filtros/seleções e não refazer todas as buscas no banco quando os dados foram carregados há pouco.

## O que muda

### 1. Cache de dados (global)
Configurar o cache de dados do app para:
- Considerar os dados "frescos" por 5 minutos (sem novo carregamento ao voltar à página).
- Manter os dados em memória por 30 minutos após sair da página.
- Não recarregar automaticamente ao voltar o foco para a aba do navegador.
- Recarregar somente quando houver salvamento/edição (o app já invalida o cache nessas ações) ou quando o usuário atualizar manualmente.

### 2. Memória de filtros por página
Criar um mecanismo único de "filtros lembrados" (guardados na sessão do navegador, por página) e aplicá-lo às telas principais:
- Dashboard / Painel / Meu Painel
- Programação / Calendário (inclui mês/visão do calendário)
- Registros
- Relatórios Gerais e demais relatórios com filtros

Os filtros voltam ao padrão quando o usuário faz logout ou fecha o navegador, e continuam respeitando as regras de hierarquia e programa (um filtro salvo que o usuário não pode mais ver é descartado).

### 3. Telas com carregamento manual
As páginas que hoje buscam os dados direto no `useEffect` (Dashboard, Programação, Registros e afins) passam a guardar o resultado no mesmo cache global, para que voltar à página seja instantâneo, com atualização em segundo plano quando os dados estiverem velhos.

## Detalhes técnicos
- `src/App.tsx`: `new QueryClient({ defaultOptions: { queries: { staleTime: 5 * 60_000, gcTime: 30 * 60_000, refetchOnWindowFocus: false, refetchOnReconnect: false, retry: 1 } } })`.
- Novo hook `src/hooks/usePersistedState.ts`: `useState` sincronizado com `sessionStorage` por chave (`filters:<rota>:<campo>`), com validação do valor restaurado contra as opções permitidas.
- Aplicar o hook aos estados de filtro em `AdminDashboard.tsx`, `ProgramacaoPage.tsx` (filtros + mês/visão), `RegistrosPage.tsx`, `RelatoriosPage.tsx` e demais páginas de relatório com filtros.
- Migrar as buscas em `useEffect` das páginas principais para `useQuery` com `queryKey` incluindo usuário/filtros, mantendo as mesmas consultas e regras de permissão; preservar as invalidações já existentes após salvar.
- Sem mudanças de banco, RLS ou Edge Functions.

## Riscos
- Dados podem ficar até 5 minutos desatualizados entre abas/usuários diferentes; ações do próprio usuário continuam refletindo na hora.
- A migração para cache nas páginas grandes (Programação/Registros) é a parte mais sensível; será feita mantendo a lógica de consulta atual sem alterações funcionais.
