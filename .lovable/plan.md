

# Incluir formações REDES no Histórico de Presença

## Problema
A query de `programacoes` na página de Histórico de Presença filtra apenas `tipo = 'formacao'`, excluindo os tipos `encontro_professor_redes` e `encontro_eteg_redes` que também são formações com lista de presença.

## Alteração

### `src/pages/admin/HistoricoPresencaPage.tsx`

**Linha 84**: Substituir `.eq('tipo', 'formacao')` por `.in('tipo', ['formacao', 'encontro_professor_redes', 'encontro_eteg_redes'])` para incluir todas as formações que registram presença.

Nenhuma outra alteração necessária — o restante do fluxo (registros_acao → presencas → cálculos) já funciona de forma genérica via `programacao_id`.

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/HistoricoPresencaPage.tsx` | Ampliar filtro de tipo para incluir formações REDES |

