# Indicadores - Caê: lista de professores preenchendo todo o espaço

## Contexto
Na página `/relatorios-gestao-escolas`, no bloco "Indicadores - Caê", a tabela "Professores Apoiados" fica limitada a ~320px de altura (`max-h-[320px]`). Como as colunas à esquerda (KPI, Apoios por Componente, Apoios por Ano/Série) definem a altura do card, sobra um espaço em branco abaixo da barra "Exibindo N registros".

## Alteração
Arquivo: `src/pages/admin/RelatoriosGestaoEscolasPage.tsx` (bloco "Professores Apoiados", ~linha 557)

- Trocar o contêiner rolável de `max-h-[320px] overflow-y-auto` para `min-h-0 flex-1 overflow-y-auto`, para que a área da tabela cresça e ocupe toda a altura disponível do card, mantendo o cabeçalho "Professor / Escola" fixo (sticky) e a rolagem quando houver muitos registros.
- A barra "Exibindo N registros" permanece colada no rodapé do card (já está em `flex flex-col` com o rodapé por último).

Sem mudanças de dados, permissões, rotas ou PDF — apenas layout.

## Validação
- TypeScript passando.
- Verificação visual no preview: tabela preenchendo o espaço branco até o rodapé, com scroll interno e header sticky preservados.
