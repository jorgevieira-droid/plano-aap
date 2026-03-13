

# Adicionar referência de ANO_SERIE no modelo de importação em lote de Programações

## Alteração

Arquivo: `src/components/forms/ProgramacaoUploadDialog.tsx`

### 1. Aba "Tipos e Valores Válidos" do template Excel (~linha 322-352)

Adicionar entradas para o campo `ANO_SERIE` no array `refData`, listando todos os valores válidos agrupados por segmento:

```text
// Anos Iniciais
{ CAMPO: 'ANO_SERIE', VALOR: '1º Ano', DESCRICAO: 'Anos Iniciais' }
{ CAMPO: 'ANO_SERIE', VALOR: '2º Ano', DESCRICAO: 'Anos Iniciais' }
{ CAMPO: 'ANO_SERIE', VALOR: '3º Ano', DESCRICAO: 'Anos Iniciais' }
{ CAMPO: 'ANO_SERIE', VALOR: '4º Ano', DESCRICAO: 'Anos Iniciais' }
{ CAMPO: 'ANO_SERIE', VALOR: '5º Ano', DESCRICAO: 'Anos Iniciais' }
// Anos Finais
{ CAMPO: 'ANO_SERIE', VALOR: '6º Ano', DESCRICAO: 'Anos Finais' }
{ CAMPO: 'ANO_SERIE', VALOR: '7º Ano', DESCRICAO: 'Anos Finais' }
{ CAMPO: 'ANO_SERIE', VALOR: '8º Ano', DESCRICAO: 'Anos Finais' }
{ CAMPO: 'ANO_SERIE', VALOR: '9º Ano', DESCRICAO: 'Anos Finais' }
// Ensino Médio
{ CAMPO: 'ANO_SERIE', VALOR: '1ª Série', DESCRICAO: 'Ensino Médio' }
{ CAMPO: 'ANO_SERIE', VALOR: '2ª Série', DESCRICAO: 'Ensino Médio' }
{ CAMPO: 'ANO_SERIE', VALOR: '3ª Série', DESCRICAO: 'Ensino Médio' }
// Valor especial
{ CAMPO: 'ANO_SERIE', VALOR: 'todos', DESCRICAO: 'Todos os Anos/Séries (apenas para formacao)' }
```

Inserir após as entradas de PROGRAMA e antes do fechamento do array.

### 2. Instrução no painel de ajuda (~linha 408)

Atualizar a descrição do campo ANO_SERIE para incluir exemplos mais claros:

```
ANO_SERIE: 1º Ano, 2º Ano... 5º Ano | 6º Ano... 9º Ano | 1ª Série... 3ª Série | todos
```

| Item | Detalhe |
|---|---|
| Arquivo | `src/components/forms/ProgramacaoUploadDialog.tsx` |
| Migração DB | Nenhuma |

