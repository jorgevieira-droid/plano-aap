

# Permitir N1-N5 resetar senhas na pagina de Atores

## Problema

A interface da pagina "Atores dos Programas" ja exibe o botao de redefinir senha para usuarios N1 a N5. Porem, a funcao backend (`manage-users`) rejeita qualquer requisicao que nao seja de um administrador (N1), retornando erro 403 para gestores e operacionais.

## Solucao

Atualizar a funcao backend para permitir que usuarios N2-N5 executem **apenas** a acao `reset-password`, com verificacao de que o usuario-alvo esta dentro do escopo de gestao do solicitante.

## Detalhes Tecnicos

### 1. Atualizar `supabase/functions/manage-users/index.ts`

- Mover a verificacao de permissao de "apenas admin" (global) para uma verificacao por acao
- Para a acao `reset-password`:
  - Permitir N1 (admin): pode resetar qualquer usuario
  - Permitir N2 (gestor) e N3 (coordenador): pode resetar usuarios N4-N8 que compartilhem programas
  - Permitir N4/N5 (operacional): pode resetar usuarios N6-N8 que compartilhem entidades
- Demais acoes (create, update, delete, create-batch): permanecem restritas a admin
- Adicionar funcoes auxiliares para verificar se o solicitante compartilha programas ou entidades com o usuario-alvo
- Marcar `must_change_password = true` no perfil do usuario apos o reset, garantindo que ele troque a senha no proximo login

### 2. Fluxo de Verificacao

```text
Requisicao de reset-password
  |
  v
Verificar role do solicitante (N1-N5?)
  |-- N1: permitido para qualquer usuario
  |-- N2/N3: verificar se compartilha programa com o alvo
  |-- N4/N5: verificar se compartilha entidade com o alvo
  |-- N6+: negado
  |
  v
Verificar nivel do alvo (deve ser >= nivel do solicitante)
  |
  v
Executar reset
  |
  v
Marcar must_change_password = true
```

### 3. Sem alteracoes no frontend

A pagina `AtoresProgramaPage.tsx` ja possui toda a logica de UI necessaria: o botao de reset, o dialog de nova senha, e a chamada a funcao `manage-users` com a acao `reset-password`. Apenas o backend precisa ser ajustado.

