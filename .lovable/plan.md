Plano de ajuste:

1. Atualizar `RelatorioApoioPresencialPage.tsx`
   - Trocar a validação de programa de `profile?.programas` para `effectiveProgramas` vindo do `useAuth()`.
   - Manter a checagem por papel efetivo via `hasRole('gestor')` e `hasRole('n3_coordenador_programa')`.
   - Resultado esperado: ao simular N2 ou N3 com Programa de Escolas, a página deixa de redirecionar para `/unauthorized`.

2. Atualizar `RelatorioConsultoriaVisualizacaoPage.tsx`
   - Aplicar o mesmo padrão: usar `effectiveProgramas` para reconhecer o Programa de Escolas na simulação.
   - Preservar a regra atual de acesso somente para Admin real ou N2/N3 do Programa de Escolas.

3. Validação
   - Conferir que as rotas continuam permitidas no `AppLayout`.
   - Validar no preview que N2 e N3 simulados acessam `/visualizacao-apoio-presencial` e `/visualizacao-consultoria` sem cair em “Acesso não autorizado”.

Detalhe técnico:
- O problema restante não está mais no menu nem na lista de rotas. As páginas já usam `hasRole()` para o papel simulado, mas ainda verificam o programa em `profile?.programas`, que representa o usuário real. Em simulação, essa checagem precisa usar `effectiveProgramas`, que já considera o programa simulado.