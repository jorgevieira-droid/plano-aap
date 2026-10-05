# Filtro de Instrumento no Histórico de Presença

## Objetivo
Incluir um filtro de "Instrumento" na página **Histórico de Presença** (`src/pages/admin/HistoricoPresencaPage.tsx`), permitindo ao usuário restringir os resultados a um tipo de ação/encontro.

## Escopo
A página contempla hoje 4 tipos de ação, todos com presença rastreada:

| Valor no banco | Rótulo exibido |
|---|---|
| `formacao` | Formação |
| `encontro_professor_redes` | Encontro Formativo Professor – REDES |
| `encontro_eteg_redes` | Encontro Formativo ET/EG – REDES |
| `encontro_microciclos_recomposicao` | Encontro Formativo – Microciclos de Recomposição |

O novo filtro lista esses 4 instrumentos (mais "Todos"), com rótulos A–Z (`localeCompare pt-BR`).

## Mudanças

1. **Estado persistido**: novo `selectedInstrumento` via `usePersistedState('historico-presenca:selectedInstrumento', 'all')` — segue o padrão dos demais filtros da página (persistidos entre visitas).

2. **Consulta**: em `fetchData`, quando o filtro ≠ 'all', aplicar `formQuery.eq('tipo', selectedInstrumento)`; caso contrário, mantém o `.in('tipo', [...])` atual.

3. **UI**: novo `<Select>` "Instrumento" no grid de filtros (grid passa de 5 para 6 colunas em `lg`), posicionado após "Programa". Opções: Todos + os 4 instrumentos com os rótulos da tabela acima (reutilizando os labels já existentes em `src/hooks/useInstrumentFields.ts` / `src/config/acaoPermissions.ts`).

4. **Dependência**: `selectedInstrumento` entra no array de dependências do `useCallback` do `fetchData`, garantindo o refetch ao mudar o filtro.

## Impacto
- Afeta as duas abas (Por Formação e Por Professor), o Excel exportado e os diálogos — todos derivam de `formacoes`, que passa a respeitar o filtro.
- Sem mudança no banco, RLS ou outras páginas.

## Verificação
- Compilar (`tsgo --noEmit`).
- No preview: abrir Histórico de Presença, filtrar por "Encontro Formativo – Microciclos de Recomposição" e confirmar que a lista e o Excel mostram apenas esse tipo; voltar para "Todos" e confirmar a lista completa.
