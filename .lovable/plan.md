
## Corrigir erro ao criar "Encontro Formativo – Microciclos de Recomposição"

### Causa raiz
O erro já está identificado no console:

```text
new row for relation "programacoes" violates check constraint "programacoes_tipo_check"
code: 23514
```

Isso acontece porque o frontend já envia `tipo = 'encontro_microciclos_recomposicao'`, mas a constraint do banco `programacoes_tipo_check` ainda não inclui esse novo tipo. Pelo histórico de migrations, o mesmo problema também existe para `registros_acao_tipo_check`.

### O que implementar

1. **Criar uma migration de banco**
   Atualizar as constraints:
   - `public.programacoes.programacoes_tipo_check`
   - `public.registros_acao.registros_acao_tipo_check`

   Adicionando o valor:
   - `'encontro_microciclos_recomposicao'`

2. **Manter compatibilidade com os tipos já existentes**
   A nova migration deve recriar ambas as constraints preservando todos os tipos atuais já aceitos hoje, apenas acrescentando o novo tipo no array do `CHECK`.

3. **Melhorar a mensagem de erro no frontend**
   Em `src/pages/admin/ProgramacaoPage.tsx`, o catch hoje mostra apenas:
   - `toast.error("Erro ao criar programação")`

   Ajustar para priorizar a mensagem real do backend, seguindo o padrão já salvo na memória do projeto:
   - usar `error.message`
   - se existir, incluir `data?.error`
   - manter fallback genérico só quando não houver detalhe

   Resultado esperado:
   - em vez de erro genérico, o usuário verá algo como:
     - `Erro ao criar programação: tipo inválido para programações`

4. **Validar o fluxo completo**
   Após a migration:
   - criar uma programação do tipo `encontro_microciclos_recomposicao`
   - confirmar que o insert em `programacoes` funciona
   - confirmar que o insert seguinte em `registros_acao` também funciona
   - confirmar toast de sucesso

### Arquivos afetados
- `supabase/migrations/...sql` — nova migration para atualizar os dois `CHECK`
- `src/pages/admin/ProgramacaoPage.tsx` — melhorar tratamento do erro no `handleSubmit`

### Resultado esperado
- A ação **"Encontro Formativo – Microciclos de Recomposição"** volta a ser criada normalmente.
- O sistema deixa de falhar na etapa de insert em `programacoes`.
- Se houver qualquer novo problema no futuro, a interface passa a exibir a causa real em vez de apenas “Erro ao criar programação”.

### Detalhe técnico
As migrations existentes mostram que:
- `registro_apoio_presencial` já foi incluído nas constraints
- `encontro_microciclos_recomposicao` foi criado em tabela/configuração/form fields
- porém **não foi incluído nos `CHECK` de `programacoes.tipo` e `registros_acao.tipo`**

Ou seja, o cadastro está completo no app, mas o banco ainda rejeita esse tipo.
