# Ajustar data e quebras de página no PDF de Apoio Presencial

## Alterações

- Incluir **Data** como primeiro campo de cada ficha em **“Devolutiva formativa — respostas registradas”**, no formato `dd/mm/aaaa`.
- Manter, em seguida, Escola, Consultor, Temas abordados, Encaminhamentos e Participação e engajamento.
- Preservar a configuração atual da tela e dos arquivos Excel; a mudança será somente no PDF.

## Paginação segura

- Reorganizar os blocos das seções de Devolutiva e Evidências para que a quebra aconteça entre campos ou registros, nunca no meio de uma linha de texto.
- Manter uma ficha inteira na mesma página quando ela couber.
- Quando uma resposta longa ultrapassar o espaço útil, dividi-la em trechos por palavras/parágrafos, repetindo a identificação do registro e indicando a continuação.
- Reservar uma margem inferior de segurança nessas seções para impedir que a última linha encoste ou seja cortada na mudança de página.
- Continuar usando blocos pequenos para evitar o retorno das páginas pretas e preservar o desempenho da exportação.

## Validação

- Gerar o PDF completo e conferir fichas no início, meio e fim das duas seções.
- Confirmar que a Data aparece em todas as devolutivas.
- Verificar especialmente páginas que começam ou terminam com textos longos, garantindo que nenhuma linha, palavra ou ficha seja cortada.
- Confirmar que títulos de continuação, cabeçalho institucional, ordem dos registros e demais partes do relatório permanecem corretos.

## Escopo técnico

A alteração ficará concentrada na montagem do PDF de **Relatórios - Apoio Presencial**. A rotina compartilhada de exportação, a visualização da página, os filtros, as contagens e os arquivos Excel não serão alterados.
