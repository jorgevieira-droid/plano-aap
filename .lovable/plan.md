

# Adicionar coluna "Programas" na Matriz de Ações × Perfis

## Objetivo

Exibir, para cada tipo de ação/formulário na tabela da Matriz, quais programas (Escolas, Regionais, Redes Municipais) têm aquela ação habilitada, usando os dados de `form_config_settings`.

## Solução

### Arquivo: `src/pages/admin/MatrizAcoesPage.tsx`

1. Importar e usar o hook `useAcoesByPrograma` para obter `formConfigSettings`
2. Adicionar uma nova coluna "Programas" no `<thead>` (entre "Formulário" e os perfis)
3. No `<tbody>`, para cada tipo de ação, filtrar `formConfigSettings` pelo `form_key` correspondente e renderizar badges com os programas habilitados (ex: "Escolas", "Regionais", "Redes Municipais")
4. Se o tipo não tiver configuração em `form_config_settings`, exibir "—"

### Labels dos programas

```text
escolas → Escolas
regionais → Regionais
redes_municipais → Redes Municipais
```

### Resultado visual

A tabela terá a estrutura:
```text
| Ação/Evento | Programas              | Formulário | N1 | N2 | ... |
|-------------|------------------------|------------|----|----|-----|
| Obs. Aula   | Escolas, Regionais     | Visualizar | ✓  | ✓  |     |
| Formação    | Escolas                | —          | ✓  | ✓  |     |
```

Os programas serão exibidos como badges coloridos para facilitar a leitura.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/MatrizAcoesPage.tsx` | Importar hook, adicionar coluna "Programas" com badges |

