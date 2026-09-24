# Corrigir páginas pretas no PDF de Apoio Presencial

## Diagnóstico confirmado

O PDF enviado possui 152 páginas. As páginas pretas começam dentro das tabelas extensas do relatório, enquanto cabeçalhos e páginas menores continuam normais.

A exportação atual transforma cada tabela completa em uma única imagem muito alta e só depois tenta dividi-la em páginas A4. Com centenas de registros, essa imagem ultrapassa o limite seguro do navegador e partes dela são gravadas como retângulos pretos.

## Alterações

- Dividir previamente as tabelas extensas do PDF em blocos menores, antes da conversão em imagem.
- Repetir o título e o cabeçalho das colunas em cada novo bloco/página.
- Aplicar a divisão às tabelas de:
  - Devolutiva formativa;
  - Apoios realizados por professor;
  - Evidências da observação de aula.
- Manter os mesmos dados, filtros, ordem, identidade visual e cabeçalho institucional.
- Não alterar os arquivos Excel nem a visualização da página.

## Validação

- Gerar novamente o relatório completo com volume elevado de registros.
- Conferir visualmente páginas do início, meio e fim das três tabelas.
- Confirmar que não existem páginas pretas, linhas cortadas ou perda de registros.
- Verificar que títulos e cabeçalhos são repetidos corretamente e que o PDF abre normalmente.

## Escopo técnico

A correção ficará concentrada na montagem do PDF de Apoio Presencial. A rotina compartilhada de exportação não será alterada, evitando impacto em outros relatórios.
