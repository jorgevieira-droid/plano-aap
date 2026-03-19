

# Ajustes: Menu lateral, Formulários REDES na configuração, e Filtros de Pontos Observados

## 1. Reordenar menu lateral do Admin

**Arquivo:** `src/components/layout/Sidebar.tsx`

Reordenar `adminMenuItems` (linhas 28-47) para a sequência solicitada:

1. Dashboard
2. Escola / Regional / Rede
3. Atores dos Programas
4. Atores Educacionais
5. Consultor / Gestor / Formador
6. Programação
7. Pendências
8. Evolução Professor
9. Histórico Presença
10. Pontos Observados
11. Relatórios
12. Lista de Presença
13. Matriz de Ações
14. Registros
15. Usuários
16. Configurar Formulário
17. Integração Notion
18. Manual do Usuário

## 2. Garantir formulários REDES na configuração de formulários

Verificar que os 3 tipos REDES já estão em `INSTRUMENT_FORM_TYPES` (já adicionados anteriormente). Nenhuma alteração necessária — apenas confirmar que o admin vê todos os formulários na página de configuração.

## 3. Filtros interdependentes em Pontos Observados

**Arquivo:** `src/pages/admin/PontosObservadosPage.tsx`

Atualmente, o dropdown de **Formador** mostra todos os formadores independentemente do programa selecionado. Ajustar para:

- Quando um **Programa** é selecionado, filtrar a lista de **Formadores** para mostrar apenas os que têm formações naquele programa
- Quando um **Formador** é selecionado, filtrar a lista de **Formações** pelo programa E formador
- Ao trocar o programa, resetar formador e formação para "todos"

Implementação: derivar `filteredFormadores` a partir de `formacoes` filtradas pelo programa selecionado (usando o campo `programa` da programação), e ajustar o `onValueChange` do filtro de Programa para resetar ambos os filtros dependentes.

```typescript
// Formadores filtrados pelo programa selecionado
const filteredFormadores = formadores.filter(f => {
  if (programaFilter === 'todos') return true;
  return formacoes.some(fm => fm.aap_id === f.id && fm.programa?.includes(programaFilter));
});
```

## Resumo de arquivos

| Arquivo | Alteração |
|---|---|
| `src/components/layout/Sidebar.tsx` | Reordenar `adminMenuItems` |
| `src/pages/admin/PontosObservadosPage.tsx` | Filtros interdependentes (Programa→Formador→Formação) |

