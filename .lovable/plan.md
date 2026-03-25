
## Correção das pendências de Redes Municipais

### Diagnóstico
Identifiquei o problema principal no dado e na lógica atual:

- A página de pendências hoje busca **apenas `registros_acao`** (`usePendencias.ts`).
- No banco, existem **18 programações de `redes_municipais` com mais de 3 dias de atraso** e status `prevista`.
- Para essas mesmas ações, há **0 registros em `registros_acao`** para `redes_municipais`.
- Ou seja: as ações existem em `programacoes`, mas várias nunca ganharam o `registro_acao` correspondente, então o filtro de pendências fica vazio.

Resumo: o bug não é só de filtro por programa; a regra de pendência está olhando para a tabela errada para esses casos.

## O que vou corrigir

### 1. Tornar `programacoes` a fonte principal de pendências
Vou ajustar a regra para considerar como pendente toda **programação** que:
- esteja com status ainda “em aberto” (`prevista`; e, se houver casos equivalentes, manter compatibilidade),
- tenha data há mais de 3 dias,
- ainda não tenha sido concluída/cancelada corretamente.

Isso resolve imediatamente os casos de Redes Municipais que existem como programação, mas não têm `registro_acao`.

### 2. Manter compatibilidade com dados legados
Além de `programacoes`, vou complementar com fallback para casos antigos em `registros_acao` **sem `programacao_id`** e ainda pendentes, para não perder histórico legado nem duplicar resultados.

Regra prática:
- prioridade: `programacoes`
- fallback: `registros_acao` órfãos/legados

### 3. Unificar a regra em todos os pontos da interface
Vou aplicar a mesma lógica em:
- `src/hooks/usePendencias.ts`
- `src/pages/admin/PendenciasPage.tsx` (via hook)
- `src/components/layout/Sidebar.tsx` (badge via hook)
- `src/pages/admin/AdminDashboard.tsx` (card/alerta de pendências)

Hoje o Dashboard tem uma lógica separada baseada em `registros_acao`; isso também precisa ser alinhado para não continuar divergente da página `/pendencias`.

### 4. Fechar as lacunas de gravação para não voltar a acontecer
Vou revisar e corrigir os fluxos que criam `programacoes` sem criar o `registro_acao` espelho, especialmente onde isso ainda está faltando, como:
- importação em lote em `ProgramacaoPage.tsx`
- alguns fluxos de reagendamento/acompanhamento em `ProgramacaoPage.tsx`
- reagendamento em `AAPRegistrarAcaoPage.tsx`

Mesmo com a pendência passando a usar `programacoes`, essa sincronização é importante para consistência do sistema e para outras telas que dependem de `registros_acao`.

### 5. Backfill dos dados já quebrados
Como já existem ações antigas sem `registro_acao`, vou incluir uma correção de dados para criar os registros faltantes a partir de `programacoes` quando:
- a programação ainda existir,
- não houver `registro_acao` vinculado,
- e os dados necessários estiverem presentes.

Isso evita que outras telas continuem “cegas” para essas ações históricas.

## Arquivos envolvidos
- `src/hooks/usePendencias.ts`
- `src/pages/admin/AdminDashboard.tsx`
- `src/pages/admin/ProgramacaoPage.tsx`
- `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- nova migration SQL de backfill/sincronização de dados faltantes

## Detalhes técnicos
- A consulta de pendências deixará de depender exclusivamente de `registros_acao.status in ('prevista','agendada','reagendada')`.
- A fonte principal passará a ser `programacoes` com atraso de mais de 3 dias.
- Vou evitar duplicidade por `programacao_id`.
- Se durante a implementação eu confirmar que alguma permissão de leitura em `programacoes` está mais restritiva do que deveria para o mesmo perfil que já enxerga `registros_acao`, ajustarei a política de leitura correspondente sem abrir acesso além do necessário.

## Validação após a correção
Vou validar estes cenários:
1. Selecionar **Redes Municipais** em `/pendencias` e confirmar que as ações antigas aparecem.
2. Conferir se o total da badge lateral e o card do Dashboard batem com a página de pendências.
3. Verificar que ações já realizadas/canceladas não entram como pendentes.
4. Confirmar que não há duplicação quando existir `programacao` + `registro_acao`.
5. Testar um novo cadastro de ação e confirmar que, após 3 dias sem atualização, ela passa a constar como pendente.
