

# Preview de formulários hardcoded na página Configurar Formulários

## Problema

A seção "Preview" em Configurar Formulários só renderiza campos dinâmicos vindos da tabela `instrument_fields`. Formulários hardcoded (como `monitoramento_acoes_formativas`, `monitoramento_gestao`, e os formulários REDES) não possuem registros nessa tabela, então o preview mostra "Nenhum campo habilitado" — mesmo para N1.

## Alteração

### `src/pages/admin/FormFieldConfigPage.tsx`

1. Importar `RedesFormPreview` e `REDES_FORM_TYPES` de `@/components/instruments/RedesFormPreview`.
2. Na seção de Preview (linhas ~368-413), antes de renderizar a lista de `previewFields`, verificar se `selectedFormType` é um `REDES_FORM_TYPES`. Se for, renderizar `<RedesFormPreview formType={selectedFormType} />` diretamente, sem exigir seleção de perfil (já que esses formulários são hardcoded e não variam por role).
3. Se não for um REDES form type, manter o comportamento atual (seleção de perfil + lista de campos dinâmicos).

## Resultado

- N1 (e todos os níveis) verão o preview completo de `monitoramento_acoes_formativas`, `monitoramento_gestao`, e demais formulários hardcoded.
- Formulários dinâmicos continuam com o preview por perfil, como hoje.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/FormFieldConfigPage.tsx` | Importar e usar `RedesFormPreview` para formulários hardcoded |

