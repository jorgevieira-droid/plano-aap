Gerar planilha Excel de acessos — Jefferson Santos (outubro/2026)

O que será entregue
- Um arquivo Excel "acessos_jefferson_santos_out2026.xlsx" na área de Arquivos.
- Aba "Acessos": Dia, dia da semana e horário do primeiro acesso (horário de Brasília) para os 10 dias com acesso em outubro/2026.
- Linha de total com o número de dias com acesso.
- Aba "Lançamentos": as ações que ele criou, editou ou apagou em outubro, com data e hora, tipo da ação, data da ação e o que aconteceu (criou, alterou ou apagou).

Detalhes técnicos
- Os dados vêm de user_access_log (um registro por dia) e de registros_alteracoes / registros_acao, filtrados pelo usuário 096c06c8-... no período de 01/10 a 31/10, no fuso America/Sao_Paulo.
- O arquivo será gerado com openpyxl em /tmp, com fonte Arial e cabeçalho formatado. O total será uma fórmula COUNTA, e o arquivo será recalculado e verificado para garantir que não tem erros antes de ser copiado para /mnt/documents.
- Nenhuma alteração no app ou no banco de dados.
