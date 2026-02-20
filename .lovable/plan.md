
# Correção: Lista de Presença na RegistrosPage não respeita o Tipo de Ator da Formação

## Diagnóstico

O problema existe **exclusivamente** em `src/pages/admin/RegistrosPage.tsx`.

Em outras telas (ProgramacaoPage e AAPRegistrarAcaoPage), o campo `tipo_ator_presenca` já foi corretamente implementado na implementação anterior.

### Por que a RegistrosPage não filtra?

**1. Interface `ProgramacaoDB` incompleta** (linha 103):
```typescript
interface ProgramacaoDB {
  id: string;
  motivo_cancelamento: string | null;
  titulo: string;
  // ← tipo_ator_presenca está FALTANDO
}
```

**2. Query de programações não busca o campo** (linha 352):
```typescript
.select('id, motivo_cancelamento, titulo')
// ← falta tipo_ator_presenca
```

**3. Função `getAvailableProfessors` não usa o campo** (linhas 426–446):
```typescript
const getAvailableProfessors = (registro: RegistroAcaoDB) => {
  if (registro.tipo === 'formacao') {
    return professores.filter(p => {
      if (p.escola_id !== registro.escola_id) return false;
      if (p.componente !== registro.componente) return false;
      if (registro.segmento !== 'todos' && p.segmento !== registro.segmento) return false;
      if (registro.ano_serie !== 'todos' && p.ano_serie !== registro.ano_serie) return false;
      // ← filtro por cargo (tipo_ator_presenca) não existe aqui
      return true;
    });
  }
  ...
};
```

A função recebe um `RegistroAcaoDB` que não tem o `tipo_ator_presenca` diretamente — ele está na tabela `programacoes` vinculada via `registro.programacao_id`. Como a query não busca esse campo, ele nunca chega até a função de filtro.

## Solução

Três alterações cirúrgicas em `src/pages/admin/RegistrosPage.tsx`:

### 1. Atualizar interface `ProgramacaoDB`
```typescript
interface ProgramacaoDB {
  id: string;
  motivo_cancelamento: string | null;
  titulo: string;
  tipo_ator_presenca: string | null;  // ← adicionar
}
```

### 2. Atualizar a query para incluir o campo
```typescript
.select('id, motivo_cancelamento, titulo, tipo_ator_presenca')
```

### 3. Atualizar `getAvailableProfessors` para aplicar o filtro
Dentro do bloco `if (registro.tipo === 'formacao')`, após os filtros de segmento e ano_serie, adicionar:
```typescript
// Buscar tipo_ator_presenca da programação vinculada
const programacao = programacoes.find(prog => prog.id === registro.programacao_id);
const tipoAtor = programacao?.tipo_ator_presenca;
if (tipoAtor && tipoAtor !== 'todos') {
  if (p.cargo !== tipoAtor) return false;
}
```

## Resumo

| Item | Detalhe |
|---|---|
| Causa raiz | Query de programações não buscava `tipo_ator_presenca`; interface sem o campo; função de filtro não o utilizava |
| Solução | Adicionar campo à interface, à query e aplicar filtro por `cargo` em `getAvailableProfessors` |
| Arquivo alterado | `src/pages/admin/RegistrosPage.tsx` somente |
| Migração de banco | Não necessária |

A correção é compatível com o comportamento existente: quando `tipo_ator_presenca` é `null` ou `'todos'`, todos os cargos continuam aparecendo normalmente.
