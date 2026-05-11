## Mudança

No `src/pages/admin/AdminDashboard.tsx`, ocultar o card **"Ações Previstas x Realizadas - Por Ator do Programa"** quando o filtro de programa for **Programa de Redes Municipais**.

### Detalhe técnico

- Linha ~967: alterar a condição de renderização do card de:
  ```tsx
  {moduleVisibility.showAtorFilter && acoesPorAAP.length > 0 && ( ... )}
  ```
  para:
  ```tsx
  {moduleVisibility.showAtorFilter && acoesPorAAP.length > 0 && programaFilter !== 'redes_municipais' && ( ... )}
  ```

### O que NÃO muda

- Demais cards (incluindo "Ações Previstas x Realizadas por Tipo") permanecem inalterados.
- Comportamento do card para os demais programas (Escolas, Regionais, Todos) permanece igual.
- Sem alterações em hooks, schema ou regras de negócio.
