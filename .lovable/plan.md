
# Correção: Lista de Presença não exibe participantes

## Diagnóstico completo

Há **dois problemas combinados** em `src/pages/admin/ListaPresencaPage.tsx`:

### Problema 1 — A página não usa `tipo_ator_presenca`

A `ListaPresencaPage` é uma página **completamente separada** da `RegistrosPage`. Ela tem sua própria lógica de busca de participantes (linhas 136–187) que nunca foi atualizada para usar o campo `tipo_ator_presenca`. A query de formações também não inclui esse campo no SELECT.

### Problema 2 — Filtro de componente exclui coordenadores/diretores

Verificando o banco de dados:

- A formação tem `componente: lingua_portuguesa`
- Os coordenadores/diretores têm `componente: nao_se_aplica`

O filtro atual `.eq('componente', 'lingua_portuguesa')` elimina todos os coordenadores, diretores e vice-diretores antes mesmo de considerar o cargo.

**Regra correta**: quando `tipo_ator_presenca` for um cargo não-professor (`coordenador`, `diretor`, `vice_diretor`), o filtro por `componente` e `segmento` **não deve ser aplicado**, pois esses profissionais são cadastrados com `nao_se_aplica`.

## Solução

Três alterações cirúrgicas em `src/pages/admin/ListaPresencaPage.tsx`:

### 1. Adicionar `tipo_ator_presenca` à interface `Formacao`

```typescript
interface Formacao {
  ...
  tipo_ator_presenca: string | null;  // ← adicionar
}
```

### 2. Incluir `tipo_ator_presenca` na query de formações

```typescript
.select(`
  id,
  titulo,
  data,
  horario_inicio,
  horario_fim,
  segmento,
  componente,
  ano_serie,
  programa,
  tipo_ator_presenca,   // ← adicionar
  escola_id,
  escolas!inner(nome),
  profiles!programacoes_aap_id_fkey(nome)
`)
```

E no mapeamento:
```typescript
tipo_ator_presenca: f.tipo_ator_presenca || 'todos',
```

### 3. Atualizar a lógica de busca de participantes

Cargos não-professor (`coordenador`, `diretor`, `vice_diretor`) têm `componente: nao_se_aplica` e `segmento: nao_se_aplica`. O filtro precisa ser condicional:

```typescript
const cargosFiltrados = ['coordenador', 'diretor', 'vice_diretor', 'equipe_tecnica_sme'];
const tipoAtor = selectedFormacao.tipo_ator_presenca;
const isCargoAdministrativo = tipoAtor && tipoAtor !== 'todos' && tipoAtor !== 'professor';

// Filtro por componente: apenas se o alvo for professor
if (!isCargoAdministrativo && selectedFormacao.componente && selectedFormacao.componente !== 'todos') {
  query = query.eq('componente', selectedFormacao.componente);
}

// Filtro por segmento: apenas se o alvo for professor
if (!isCargoAdministrativo && selectedFormacao.segmento && selectedFormacao.segmento !== 'todos') {
  query = query.eq('segmento', selectedFormacao.segmento);
}

// Filtro por ano_serie: apenas se o alvo for professor
if (!isCargoAdministrativo && selectedFormacao.ano_serie && selectedFormacao.ano_serie !== 'todos') {
  query = query.eq('ano_serie', selectedFormacao.ano_serie);
}

// Filtro por cargo: quando tipo_ator_presenca for específico
if (tipoAtor && tipoAtor !== 'todos') {
  query = query.eq('cargo', tipoAtor);
}
```

## Resumo

| Item | Detalhe |
|---|---|
| Causa raiz #1 | `ListaPresencaPage` não lê `tipo_ator_presenca` — campo nunca foi adicionado aqui |
| Causa raiz #2 | Filtro de `componente` exclui coordenadores/diretores (que têm `nao_se_aplica`) |
| Solução | Adicionar campo à interface + query; tornar filtros de componente/segmento condicionais ao tipo de ator |
| Arquivo alterado | `src/pages/admin/ListaPresencaPage.tsx` somente |
| Migração de banco | Não necessária |
