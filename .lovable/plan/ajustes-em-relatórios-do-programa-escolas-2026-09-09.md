# Ajustes em relatórios do Programa Escolas

## Objetivo
1. Retirar o card "Quantidade de apoio por segmento" da página `/relatorios-apoio-presencial`.
2. Retirar o gráfico "Evolução Mensal" e o card "Distribuição das notas (NPS)" da página `/relatorios-apoio-coordenador` (Relatório - Reunião com a coordenação).

## Alterações

### `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`

1. **Remover import não utilizado:**
   - Retirar `APOIO_SEGMENTO_OPTIONS` do import de `@/components/formularios/apoioPresencialShared`.

2. **Remover cálculo `porSegmento`:**
   - Remover o `useMemo` que monta o array `porSegmento`.

3. **Remover do PDF export:**
   - Remover a chamada `renderCounters('Quantidade de apoio por segmento', porSegmento)` do bloco de exportação PDF.

4. **Remover da interface:**
   - Remover o `<CountersCard titulo="Quantidade de apoio por segmento" linhas={porSegmento} />` da seção "Números complementares".

### `src/pages/admin/RelatoriosApoioCoordenacaoPanelPage.tsx`

1. **Remover gráfico "Evolução Mensal":**
   - Remover o card `<LinesCard titulo="Volume, alcance e NPS por mês" ... />` e todo o bloco relacionado.

2. **Remover card "Distribuição das notas (NPS)":**
   - Remover o card que exibe a distribuição de notas NPS (Nota 0 a Nota 10).

3. **Limpar código morto:**
   - Remover os `useMemo` e funções auxiliares que só eram usados pelos cards removidos, caso fiquem sem uso.

## Resultado esperado
- A página "Relatórios - Apoio Presencial" não apresenta mais o card "Quantidade de apoio por segmento".
- A página "Relatório - Reunião com a coordenação" não apresenta mais o gráfico "Evolução Mensal" nem o card "Distribuição das notas (NPS)", mantendo os demais indicadores intactos.
