
# Corrigir erro na troca de senha obrigatoria no primeiro acesso

## Problema

O usuario entra a senha "Adr!2026" que passa em TODAS as validacoes do lado do cliente (8 caracteres, maiuscula, minuscula, numero, caractere especial, nao comum). Porem, o Supabase retorna erro 422 (Unprocessable Entity) ao tentar atualizar. O codigo atual detecta erroneamente este erro como "senha fraca" e mostra a mensagem "A senha nao atende aos requisitos minimos de seguranca", o que confunde o usuario.

A causa provavel e que a senha informada e a mesma que a senha temporaria atual (definida pelo admin no reset), e o Supabase rejeita senhas iguais. O codigo nao detecta isso corretamente.

## Solucao

Corrigir a deteccao de erros no `ForcePasswordChangeDialog.tsx` para usar tanto `updateError.code` quanto `updateError.message`, garantindo que cada tipo de erro do Supabase seja mapeado para a mensagem correta em portugues.

## Detalhes Tecnicos

### Arquivo: `src/components/auth/ForcePasswordChangeDialog.tsx`

1. Atualizar o bloco de tratamento de erros (linhas 66-80) para verificar `updateError.code` alem de `updateError.message`:

```text
Verificacoes na seguinte ordem de prioridade:

1. code === 'same_password' OU message contendo 'same_password' ou 'should be different'
   -> "A nova senha deve ser diferente da senha atual."

2. code === 'weak_password' OU message contendo 'weak_password' ou 'at least'
   -> "A senha nao atende aos requisitos do servidor. Tente uma senha mais longa ou complexa."

3. status === 422 (fallback para qualquer outro erro 422)
   -> Exibir a mensagem real do Supabase traduzida

4. status === 403 OU message contendo 'session'
   -> "Sessao expirada. Faca login novamente."

5. Fallback generico
   -> Exibir a mensagem real do erro do Supabase
```

2. Adicionar `console.error` com o objeto completo do erro (`code`, `message`, `status`) para facilitar depuracao futura

3. Fazer cast de `updateError` para `any` para acessar a propriedade `code` que pode nao estar no tipo TypeScript atual

### Resultado Esperado

- Se o usuario tentar trocar para a mesma senha temporaria, vera: "A nova senha deve ser diferente da senha atual."
- Se o Supabase considerar a senha fraca por regras internas, vera uma mensagem mais descritiva
- Em qualquer caso, a mensagem real do Supabase sera exibida como fallback, eliminando mensagens enganosas
