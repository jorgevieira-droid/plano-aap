

# Tornar a simulação de perfil fiel às permissões reais

## Problema

A simulação de perfil ("Ver como...") altera apenas a **UI** (menus, rotas, visibilidade de botões), mas todas as operações no banco continuam executando com as permissões de **admin**. Isso significa que erros de RLS, filtros de dados e restrições que um coordenador (N3) ou CPed (N4) enfrentaria **nunca aparecem** durante a simulação.

## Limitação fundamental

As políticas de RLS são verificadas pelo banco usando o token real do usuário logado (admin). Não é possível simular RLS no cliente sem mudanças no backend.

## Solução proposta: Camada de validação client-side

Adicionar uma **camada de validação prévia** nas operações de escrita (insert/update) que replica as regras de permissão do papel simulado **antes** de enviar ao banco. Assim, o admin simulando um perfil receberá os mesmos erros que o usuário real receberia.

### 1. Criar utilitário de validação de simulação

**Novo arquivo**: `src/lib/simulationGuard.ts`

- Exportar função `checkSimulatedPermission(params)` que recebe:
  - `effectiveRole`: papel efetivo (simulado ou real)
  - `isSimulating`: se está em modo simulação
  - `operation`: tipo da operação (`insert_registro`, `update_programacao`, `insert_presenca`, etc.)
  - `context`: dados relevantes (programas do usuário, entidades, `aap_id` do registro, etc.)
- Retorna `{ allowed: boolean; reason?: string }`
- Implementar as mesmas regras que as políticas RLS verificam:
  - N3: só pode operar em registros cujo `programa` coincide com seus programas
  - N4/N5: só pode operar em registros onde `aap_id === user.id`
  - N6/N7: só pode operar em entidades vinculadas + tipos restritos
  - N8: somente leitura na maioria dos casos

### 2. Integrar no ProgramacaoPage.tsx

- Antes de cada `supabase.from(...).insert(...)` ou `.update(...)`, chamar `checkSimulatedPermission`
- Se `!allowed`, exibir `toast.error` com a razão e abortar a operação
- Funções afetadas:
  - `handleSaveProgramacao` (criar/editar agendamento)
  - `handleSaveInstrument` (salvar instrumento pedagógico)
  - `handleSavePresencas` (salvar presenças + instrumento)
  - `handleStatusChange` (alterar status da ação)

### 3. Simular filtro de dados nas consultas de leitura

- Quando `isSimulating`, adicionar filtros extras nas queries de listagem em `ProgramacaoPage`:
  - N3: filtrar por `programa` do perfil simulado
  - N4/N5: filtrar por `aap_id === user.id` (mostrará dados vazios, mas é fiel)
  - N6/N7: filtrar por entidades vinculadas
- Usar os dados reais de `profile.programas` e `profile.entidadeIds` do admin como base (com aviso de que os vínculos simulados usam os dados reais do admin)

### 4. Adicionar aviso visual sobre limitações

- No banner de simulação (AppLayout.tsx), adicionar tooltip ou texto informando:
  - "Simulação aplica validação de permissões no cliente. Dados exibidos podem diferir do usuário real pois os vínculos (programas/escolas) são os do administrador."

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/lib/simulationGuard.ts` | **Novo** — validação de permissões por papel |
| `src/pages/admin/ProgramacaoPage.tsx` | Integrar `checkSimulatedPermission` antes de writes |
| `src/components/layout/AppLayout.tsx` | Tooltip no banner de simulação |

## Resultado esperado

- Admin simulando N3 verá erro ao tentar salvar instrumento de programa ao qual não está vinculado
- Admin simulando N4 verá erro se `aap_id` do registro não for o seu
- Erros aparecem como toast com mensagem descritiva (ex: "Coordenador não tem permissão para este programa")
- Operações que passariam para o usuário real continuam funcionando normalmente

