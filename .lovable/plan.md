

# Dropdown de Programa dinâmico para TODOS os formulários

## Problema
A lógica atual de travar/pré-preencher o programa está hardcoded para `encontro_eteg_redes` e `encontro_professor_redes`. O correto é consultar a `form_config_settings` para **todos** os tipos de ação e aplicar a mesma regra: se o tipo tem apenas 1 programa habilitado, travar; se tem mais de 1, permitir seleção entre os habilitados.

## Alterações em `src/pages/admin/ProgramacaoPage.tsx`

### 1. Importar e usar `useAcoesByPrograma`
Obter `formConfigSettings` do hook já existente.

### 2. Criar helper `getProgramasForTipo`
```typescript
const getProgramasForTipo = (tipo: string): ProgramaType[] => {
  const config = formConfigSettings.find(f => f.form_key === tipo);
  return config?.programas || ['escolas', 'regionais', 'redes_municipais'];
};
```

### 3. Handler de seleção de tipo (~linha 1869)
Substituir a checagem hardcoded por lógica dinâmica:
- Se `getProgramasForTipo(tipo)` retorna apenas 1 programa → auto-preencher `programa` com esse valor.
- Se retorna mais de 1 → não forçar (manter seleção do usuário).

### 4. `disabled` do Select de Programa (~linha 1930)
Substituir `formData.tipo === 'encontro_eteg_redes' || formData.tipo === 'encontro_professor_redes'` por `getProgramasForTipo(formData.tipo).length <= 1`.

### 5. Filtrar opções do Select
Para **todos** os perfis (Admin, Gestor, AAP), interseccionar os programas do usuário com os programas habilitados para o tipo selecionado (`getProgramasForTipo`), mostrando apenas as opções válidas.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Importar hook, criar helper, lógica dinâmica universal de disable, auto-preenchimento e filtragem de opções |

