

# Correções na Programação: auto-fill programa, permissões de gerenciamento, e erro acompanhamento REDES

## Problemas identificados

### 1. Programa não pré-preenchido ao criar ação
O campo `programa` no formulário de criação inicia com `['escolas']` fixo (linha 237), independente do programa do usuário logado.

### 2. Gerenciamento de ações nem sempre acessível
O botão "Gerenciar" aparece para ações `prevista` sem verificar permissões do usuário — mas o fluxo de submissão pode falhar se o usuário não tiver acesso adequado. A questão é garantir que usuários com permissão de CRUD na ação possam sempre gerenciá-la.

### 3. Erro "Selecione o ator responsável pelo acompanhamento" em formação REDES
Quando um Coordenador (N3) marca uma `formacao` como realizada e o checkbox "Agendar Acompanhamento" está marcado, a validação exige um ator responsável. Se nenhum ator elegível é encontrado (ex: o original é excluído da lista), o formulário bloqueia. Além disso, o fluxo de `formacao` vai para presença (linha 845) mas a validação de acompanhamento (linha 758) roda antes, bloqueando indevidamente.

## Solução

### Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

**1. Auto-fill do programa do usuário:**
- No `formData` inicial e ao abrir o dialog, definir `programa` com base em `gestorProgramas[0]` ou `aapProgramas[0]` em vez de `['escolas']` fixo
- Aplicar a mesma lógica ao resetar o form após submissão (linha 688)
- Adicionar um `useEffect` que atualize `formData.programa` quando `gestorProgramas` ou `aapProgramas` forem carregados (pois o fetch é assíncrono)

**2. Garantir acesso ao gerenciamento:**
- O botão "Gerenciar" já aparece para ações `prevista` sem restrição de permissão (linhas 2428-2437 e 2540-2555). Validar que o botão verifica `canUserEditAcao` ou `canUserCreateAcao` com o papel efetivo, garantindo que N3 (CRUD_PRG para formação) sempre o veja para ações do seu programa

**3. Corrigir validação do acompanhamento:**
- Na função `handleManageSubmit`, mover a validação de `agendarAcompanhamento` (linhas 753-761) para DEPOIS das verificações de tipo que redirecionam para outros dialogs (observação de aula, presença, instrumento)
- Isso permite que formações sigam para o dialog de presença sem serem bloqueadas pela validação de acompanhamento
- A validação de acompanhamento só deve rodar no fluxo genérico (linhas 918+) e no fluxo de formação já realizada (linha 809)

## Alterações específicas

### Auto-fill programa (3 pontos)
1. Linha ~237: `programa: ['escolas']` → usar getter que retorna o programa do usuário
2. Linha ~688: mesmo ajuste no reset pós-submit
3. Novo `useEffect`: quando `gestorProgramas`/`aapProgramas` carregam, atualizar `formData.programa` se ainda estiver no default

### Reordenar validação no handleManageSubmit
Mover o bloco de validação das linhas 753-761 para depois da linha 913 (após as verificações que redirecionam para observação, presença e instrumento). Dessa forma, o fluxo de presença da formação não é bloqueado pela validação de acompanhamento quando o checkbox está marcado mas o ator ainda não foi selecionado.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Auto-fill programa, reordenar validação de acompanhamento no manage submit |

