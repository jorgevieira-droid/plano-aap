## Objetivo

Na página `/relatorios`, o filtro **Entidade Filho** já existe dentro do bloco **Filtros**, mas hoje aparece sempre que existem entidades-filho disponíveis ao usuário. O ajuste é torná-lo condicional: só aparecer quando o usuário tiver escolhido um **Programa** específico e uma **Entidade (Escola/Regional/Rede)** específica, e quando houver entidades-filho que pertençam a essa combinação.

## Mudanças

### `src/pages/admin/RelatoriosPage.tsx`

1. **Condição de exibição (atualmente linha 1174):**
   - Trocar `entidadesFilho.length > 0` por uma condição composta:
     - `programaFilter !== 'todos'`
     - `filters.escolaId !== 'todos'`
     - existem entidades-filho cuja `escola_id` seja igual a `filters.escolaId` (e cuja escola pai pertença ao `programaFilter`)
   - Se qualquer condição falhar, o `<Select>` de Entidade Filho não é renderizado e o valor é resetado para `'todos'`.

2. **Reset automático do valor:**
   - Adicionar um `useEffect` que zere `entidadeFilhoFilter` para `'todos'` sempre que `programaFilter` ou `filters.escolaId` mudarem, evitando que um filtro antigo continue aplicado após trocar Programa/Entidade.

3. **Lista de opções (linhas 1184-1188):**
   - Continuar filtrando por `escola_id === filters.escolaId`.
   - Adicionalmente, garantir que a escola pai pertença ao `programaFilter` (cruzando com a lista `escolas` já carregada e o campo `programa`), para não listar entidades-filho de outras redes/programas.

### Fora de escopo

- Não alterar o `FilterBar` (Segmento, Componente, Escola, Ator do Programa).
- Não mexer na lógica de cálculo de relatórios — `entidadeFilhoEscolaId` já é usado corretamente nos filtros de programações/registros/avaliações.
- Não mover/redesenhar o layout do bloco Filtros; apenas a visibilidade do select Entidade Filho muda.
