## Plano de correção

1. **Corrigir o carregamento de perfil/papel**
   - Ajustar `AuthContext` para buscar o papel do usuário de forma determinística usando `get_user_role`, evitando falhas quando houver histórico/duplicidade em `user_roles`.
   - Manter o estado de carregamento até o perfil estar resolvido, para não redirecionar N2/N3 antes da hora.

2. **Corrigir a página `Extração de Bases - Instrumentos` para N2/N3 reais**
   - Usar a mesma lógica de permissão de páginas gerenciais: liberar apenas `N1`, `N2` e `N3`.
   - Para N2/N3, limitar a lista de programas ao vínculo real do usuário (`effectiveProgramas`).
   - Para N1 simulando N2/N3, manter a simulação funcional sem depender de vínculos reais do admin.
   - Exibir um estado claro caso o N2/N3 não tenha programa vinculado, em vez de parecer que a página “não abriu”.

3. **Corrigir origem dos instrumentos disponíveis**
   - Hoje a extração lista instrumentos pela matriz de ações, mesmo sem registro disponível para o programa.
   - Vou alinhar com o padrão do `Relatório de Instrumentos`, listando instrumentos a partir dos registros/respostas realmente existentes e habilitados para o programa.

4. **Tratar erros de dados na própria página**
   - Mostrar mensagem objetiva quando uma consulta falhar por permissão/RLS ou ausência de vínculo.
   - Evitar tela vazia silenciosa quando filtros não carregarem.

5. **Validar**
   - Validar via código e, se houver sessão disponível, abrir a rota como perfil gerencial/simulação para confirmar: menu visível, página abre, programas aparecem, instrumentos carregam e relatório é gerado respeitando programa.