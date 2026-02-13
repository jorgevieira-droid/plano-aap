

# Corrigir carregamento infinito da pagina de Entidades

## Problema

No arquivo `EscolasPage.tsx`, o `useEffect` na linha 67-68 esta vazio -- ele deveria chamar `fetchEscolas()` para buscar os dados, mas a chamada foi removida acidentalmente. Como resultado, `isLoading` permanece `true` para sempre e a pagina exibe o spinner indefinidamente.

## Solucao

Restaurar a chamada `fetchEscolas()` dentro do `useEffect` na linha 67.

## Detalhes Tecnicos

### Arquivo: `src/pages/admin/EscolasPage.tsx`

Alterar o useEffect vazio (linhas 67-68):

```text
// Antes (quebrado):
useEffect(() => {
}, []);

// Depois (corrigido):
useEffect(() => {
  fetchEscolas();
}, []);
```

Isso e uma correcao de uma unica linha que restaura o comportamento original da pagina.

