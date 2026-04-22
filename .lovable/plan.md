

## Investigar erro ao criar "Encontro Formativo – Microciclos de Recomposição"

### Diagnóstico inicial
Verifiquei o código e a configuração — a ação está corretamente registrada em `ACAO_FORM_CONFIG`, `ACAO_PERMISSION_MATRIX`, e o insert em `programacoes` cobre os campos NOT NULL (`segmento`, `componente`, `ano_serie` recebem `"todos"`). O build atual está OK.

Para corrigir com precisão, **preciso saber qual é o erro exato** (mensagem do toast ou do console). Sem isso, vou investigar e tratar os 3 cenários mais prováveis:

### Hipóteses prioritárias

**1. Sem Formador/Responsável elegível**
`ACAO_FORM_CONFIG.encontro_microciclos_recomposicao.eligibleResponsavelRoles` aceita apenas: `gestor`, `n3_coordenador_programa`, `n4_1_cped`, `n4_2_gpi`, `n5_formador`. Se o usuário N1 não tiver Formador cadastrado vinculado à entidade + programa, o dropdown fica vazio → submit dispara "Você precisa selecionar...".

**2. Programa incompatível**
Se o programa selecionado não estiver mapeado em `form_config_settings` para o tipo `encontro_microciclos_recomposicao`, o tipo nem aparece — mas se aparecer e o programa filtrar zero entidades, o submit pode quebrar silenciosamente.

**3. Validação ou erro de RLS/insert**
Algum campo obrigatório (titulo, data, horários) ou política de inserção bloqueando.

### Plano de execução

1. **Capturar o erro real**: abrir o console no navegador ao tentar criar a ação e copiar a mensagem completa (ou consultar `analytics_query` em `postgres_logs` no momento do submit).
2. **Inspeção do payload**: adicionar `console.log` temporário antes do `supabase.from("programacoes").insert(payload)` — apenas para esta sessão de debug — para validar que todos os campos NOT NULL estão preenchidos.
3. **Correção pontual**: aplicar o fix conforme diagnóstico:
   - Se for falta de elegibilidade → revisar `eligibleResponsavelRoles` ou orientar cadastro.
   - Se for campo NOT NULL vazio → ajustar defaults no handleSubmit.
   - Se for RLS → revisar policy de INSERT em `programacoes` para esse tipo.
4. **Remover logs temporários** após confirmar a causa.

### Arquivos potencialmente afetados
- `src/pages/admin/ProgramacaoPage.tsx` (handleSubmit, filteredAaps)
- `src/config/acaoPermissions.ts` (config + permissões da ação)

### Pedido ao usuário
Antes de implementar, por favor cole aqui:
- A mensagem de erro exata (toast vermelho ou erro do console).
- O perfil do usuário usado (ex.: N1 admin) e qual programa/entidade/formador foi selecionado.

Com isso eu vou direto na causa raiz em vez de tentar mais de um caminho.

