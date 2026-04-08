

# Editar "Local" e "Responsável" nos Registros de REDES

## Alterações em `src/pages/admin/RegistrosPage.tsx`

### 1. Novos estados de edição

Adicionar dois novos estados:
```typescript
const [editLocal, setEditLocal] = useState('');
const [editAapId, setEditAapId] = useState('');
```

### 2. Ampliar query de programações

Na query `programacoes_for_registros` (linha ~366), incluir o campo `local`:
```
.select('id, motivo_cancelamento, titulo, tipo_ator_presenca, local')
```

### 3. `handleOpenEdit` — carregar valores

Adicionar ao `handleOpenEdit`:
```typescript
setEditAapId(registro.aap_id);
const prog = programacoes.find(p => p.id === registro.programacao_id);
setEditLocal(prog?.local || '');
```

### 4. Modal de edição — novos campos na UI

**Responsável**: Adicionar um `<Select>` com a lista de `profiles` ordenada A-Z, após a row de Tipo/Escola. Visível para todos os tipos de ação (admin/gestor pode alterar o responsável).

**Local**: Adicionar um `<Input>` condicional para tipos REDES (`formacao`, `encontro_eteg_redes`, `encontro_professor_redes`), após a row de Turma.

### 5. `handleSaveEdit` — salvar alterações

- Incluir `aap_id: editAapId` no objeto `newValues` enviado ao update de `registros_acao`.
- Se o registro tem `programacao_id` e o tipo é formação/REDES, atualizar o `local` na tabela `programacoes`:
  ```typescript
  if (selectedRegistro.programacao_id && isRedesType) {
    await supabase.from('programacoes')
      .update({ local: editLocal || null })
      .eq('id', selectedRegistro.programacao_id);
  }
  ```
- Sincronizar `aap_id` na `programacoes` vinculada se alterado.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/RegistrosPage.tsx` | Campos "Local" e "Responsável" editáveis no modal de edição |

