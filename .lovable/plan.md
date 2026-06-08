## Ajuste no Relatório de Acessos

Aumentar o limite de linhas buscadas da tabela `user_access_log` para incluir dados desde abril/2026.

### Mudança

Em `src/pages/admin/RelatorioAcessosPage.tsx`, na função `fetchData`, adicionar `.range(0, 49999)` à query de `user_access_log`:

```ts
supabase
  .from('user_access_log')
  .select('user_id, accessed_at')
  .order('accessed_at', { ascending: false })
  .range(0, 49999)
```

### Resultado esperado

- Todos os ~9.215 registros atuais serão carregados
- O gráfico mostrará abril, maio e junho de 2026
- Margem confortável para crescimento (até 50k registros)

Nenhuma outra alteração é necessária — a lógica de agregação por mês × programa já funciona corretamente assim que os dados completos chegam.