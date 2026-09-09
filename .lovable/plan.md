# Relatórios - Apoio Presencial: filtrar contagem de Ano/Série

## O que muda
Na página **Relatórios - Apoio Presencial**, o bloco "Quantidade de apoio por Ano/Série" passa a contabilizar somente registros cujo valor de Ano/Série seja exatamente um destes:

1° Ano · 2° Ano · 3° Ano · 4° Ano · 5° Ano · 6° Ano · 7° Ano · 8° Ano · 9° Ano · 1ª Série · 2ª Série · 3ª Série

Qualquer valor fora dessa lista (inclusive vazio/sem informação) é desconsiderado da contagem — não aparece linha "—" nem valores legados. O total exibido no bloco reflete apenas os válidos.

Demais blocos do painel (componentes, professor, etc.) não mudam.

## Detalhes técnicos
- Arquivo: `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`, cálculo `porAnoSerie` (linhas ~256-270).
- Filtrar com `ANO_SERIE_OPTIONS_ESCOLAS.includes(anoSerie)` antes de somar; comparação normalizada (trim) para evitar divergências de digitação; valores fora da lista são ignorados.
- A mesma regra se aplica à seção equivalente na exportação em PDF do painel (usa o mesmo cálculo, então fica coberta automaticamente).
- Sem alteração de dados no banco; mudança apenas visual/cálculo.
