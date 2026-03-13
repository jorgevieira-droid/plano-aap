

# Correções: Programa em branco e Professores ausentes para CPED

## Causa raiz

Ambos os problemas têm a mesma causa: o código do frontend lê das tabelas legadas (`aap_programas` e `aap_escolas`) para usuários operacionais, mas o cadastro de CPED (`n4_1_cped`) só grava nas tabelas unificadas (`user_programas` e `user_entidades`). O sync legado na `UsuariosPage` só é feito para roles `aap_inicial`, `aap_portugues`, `aap_matematica`.

### Problema 1: Programa em branco
- `ProgramacaoPage` e `AAPRegistrarAcaoPage` buscam programas de `aap_programas` para isAAP
- CPED não tem dados em `aap_programas` → lista vazia → Select não mostra valor

### Problema 2: Professores ausentes na observação
- `AAPRegistrarAcaoPage` busca escolas atribuídas de `aap_escolas` (linha 148-151)
- CPED não tem dados em `aap_escolas` → `escolaIds` vazio → nenhum professor carregado

## Solução

Duas opções:
1. **Opção A** — Atualizar o sync legado em `UsuariosPage` para incluir `n4_1_cped`, `n4_2_gpi`, `n5_formador`
2. **Opção B (recomendada)** — Migrar os dois frontends para ler das tabelas unificadas (`user_programas` e `user_entidades`) em vez das legadas

A **Opção B** é a melhor porque elimina a dependência de tabelas legadas e previne reincidência.

## Alterações (Opção B)

### 1. `src/pages/admin/ProgramacaoPage.tsx`
- Na função `fetchData` (~linha 290-307): trocar a leitura de `aap_programas` e `aap_escolas` por `user_programas` e `user_entidades` para o bloco `isAAP`
- Substituir queries:
  - `aap_programas.aap_user_id` → `user_programas.user_id`
  - `aap_escolas.aap_user_id` → `user_entidades.user_id` (renomear `escola_id` correspondente)

### 2. `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- Na função `fetchData` (~linha 138-145): trocar `aap_programas` por `user_programas`
- Na busca de escolas atribuídas (~linha 148-155): trocar `aap_escolas` por `user_entidades`
- Ajustar mapeamento: `ap.programa` permanece igual; `r.escola_id` permanece igual

### 3. `src/pages/admin/UsuariosPage.tsx` (melhoria complementar)
- Estender o sync legado (linhas 379-391) para incluir `n4_1_cped`, `n4_2_gpi`, `n5_formador` nas escritas a `aap_programas` e `aap_escolas`, garantindo compatibilidade retroativa caso algum outro ponto do código ainda leia dessas tabelas

## Detalhes técnicos

| Item | Detalhe |
|---|---|
| Arquivos | `ProgramacaoPage.tsx`, `AAPRegistrarAcaoPage.tsx`, `UsuariosPage.tsx` |
| Migração DB | Nenhuma |
| RLS | Sem alteração (as tabelas unificadas já possuem políticas corretas) |
| Risco | Baixo — apenas troca de fonte de leitura para tabelas que já contêm os dados corretos |

