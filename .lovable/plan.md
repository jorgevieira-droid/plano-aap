## Plano

1. **Corrigir o loop de atualização dos filtros**
   - Ajustar os `useEffect` que fazem limpeza por cascata para só chamar `setState` quando realmente houver mudança no array.
   - Isso elimina o erro `Maximum update depth exceeded`, que hoje faz o filtro alternar entre a entidade selecionada e “Todas as Entidades”.

2. **Manter seleção múltipla de Entidade e Entidade Filho**
   - Preservar o `MultiSelectFilter` usando `value` único por item e busca por `label`.
   - Garantir que a limpeza automática não apague seleções válidas durante a atualização das opções disponíveis.

3. **Evitar regressão nos demais filtros**
   - Aplicar a mesma proteção aos filtros em cascata de Tipo, Formador, Consultor e GPI, pois usam o mesmo padrão e também podem entrar em loop.

4. **Validar na tela**
   - Abrir `/programacao`, selecionar duas ou mais entidades e confirmar que o botão mostra “N Entidades selecionados”.
   - Confirmar que a busca dentro do dropdown continua funcionando e que o console não exibe mais `Maximum update depth exceeded`.