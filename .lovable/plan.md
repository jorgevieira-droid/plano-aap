
# Renomear "Escolas" para "Entidades" e Filtrar por Programa

## Objetivo
Em todos os formularios de cadastro de usuarios, renomear o campo "Escolas Vinculadas" para "Entidades Vinculadas" e filtrar a lista de entidades com base nos programas selecionados acima no formulario.

## Arquivos Afetados

### 1. `src/pages/admin/UsuariosPage.tsx`
- Renomear label "Entidades vinculadas" (ja esta correto na label, mas a descricao diz "Selecione as escolas/regionais/redes") para "Selecione as entidades do programa"
- Na funcao `renderEntidadesField`, filtrar a lista `escolas` para mostrar apenas aquelas cujo campo `programa` contenha pelo menos um dos programas selecionados em `formData.programas`
- Atualizar o fetch de escolas para incluir o campo `programa`: `.select('id, nome, programa')`
- Atualizar a interface `EscolaOption` para incluir `programa`

### 2. `src/pages/admin/AtoresProgramaPage.tsx`
- Mesma logica: filtrar `escolas` por `formData.programas` no `renderEntidadesField`
- O fetch ja traz escolas com `.select('id, nome')` -- adicionar `programa`
- Atualizar interface para incluir `programa`

### 3. `src/pages/admin/AAPsPage.tsx`
- Renomear "Escolas Vinculadas" (linha 454) para "Entidades Vinculadas"
- Renomear mensagens de fallback ("Nenhuma escola disponivel" para "Nenhuma entidade disponivel", etc.)
- Ja possui filtragem por programa do gestor (`availableEscolas`), mas adicionar filtragem tambem pelos programas selecionados no formulario (`formData.programas`)

## Detalhes Tecnicos

### Logica de filtragem (igual nos 3 arquivos)

```typescript
// Dentro de renderEntidadesField ou equivalente:
const entidadesFiltradas = escolas.filter(e => 
  formData.programas.length === 0 || 
  e.programa?.some(p => formData.programas.includes(p))
);
```

Quando nenhum programa estiver selecionado, nenhuma entidade aparece (ou todas, dependendo do UX desejado -- neste caso, mostrar vazio para incentivar a selecao do programa primeiro).

### Fetch de escolas (UsuariosPage e AtoresProgramaPage)

Alterar de:
```typescript
supabase.from('escolas').select('id, nome').eq('ativa', true)
```
Para:
```typescript
supabase.from('escolas').select('id, nome, programa').eq('ativa', true)
```

### Textos a alterar
- "Escolas Vinculadas" → "Entidades Vinculadas" (AAPsPage)
- "Selecione as escolas/regionais/redes" → "Selecione as entidades dos programas" (UsuariosPage)
- "Nenhuma escola disponivel para seu programa" → "Nenhuma entidade disponivel para seu programa" (AAPsPage)
- "Nenhuma escola cadastrada. Cadastre escolas primeiro." → "Nenhuma entidade cadastrada." (AAPsPage)

### Comportamento dinamico
Quando o usuario marca/desmarca checkboxes de Programas, a lista de Entidades abaixo atualiza automaticamente, mostrando apenas as entidades vinculadas aos programas selecionados. Entidades ja selecionadas que nao pertencem mais aos programas marcados serao automaticamente removidas do `formData.entidadeIds` / `formData.escolasIds`.
