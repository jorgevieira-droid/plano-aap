# Remover card "Quantidade de apoio por segmento" da página Relatórios - Apoio Presencial

## Objetivo
Retirar a visualização "Quantidade de apoio por segmento" da página `/relatorios-apoio-presencial`, tanto na interface quanto no PDF exportado.

## Alterações

### `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`

1. **Remover import não utilizado:**
   - Retirar `APOIO_SEGMENTO_OPTIONS` do import de `@/components/formularios/apoioPresencialShared`.

2. **Remover cálculo `porSegmento`:**
   - Remover o `useMemo` que monta o array `porSegmento` (linhas ~165-168).

3. **Remover do PDF export:**
   - Remover a chamada `renderCounters('Quantidade de apoio por segmento', porSegmento)` do bloco de exportação PDF.

4. **Remover da interface:**
   - Remover o `<CountersCard titulo="Quantidade de apoio por segmento" linhas={porSegmento} />` da seção "Números complementares".

## Resultado esperado
A página de relatório não apresenta mais o card "Quantidade de apoio por segmento", mantendo todos os demais indicadores intactos.
