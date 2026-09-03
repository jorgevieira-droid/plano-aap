# Corrigir transparência do título da tabela "Professores Apoiados"

## Problema
No bloco "Indicadores - Caê" (`/relatorios-gestao-escolas`), o cabeçalho fixo (sticky) da tabela "Professores Apoiados" (colunas Professor | Escola) usa fundo semi-transparente. Ao rolar a lista, as linhas aparecem através do cabeçalho, deixando os títulos "PROFESSOR" e "ESCOLA" com aparência dupla/sobreposta (ex.: texto "Joice" visível em cima de "PROFESSOR").

## Causa (confirmada no código)
`src/pages/admin/RelatoriosGestaoEscolasPage.tsx`, linha 555:
`<thead className="sticky top-0 bg-muted/60">` — o `/60` torna o fundo 60% opaco.

## Correção
- Trocar `bg-muted/60` por um fundo totalmente opaco que combine com o card: `bg-card` com sombra sutil na borda inferior (ex.: `sticky top-0 z-10 bg-card shadow-[0_1px_0_0_hsl(var(--border))]`).
- Ajuste cirúrgico: apenas o `thead` dessa tabela; nenhuma outra parte da página, query ou permissão é alterada.

## Validação
- `bunx tsgo --noEmit -p tsconfig.json`
- Verificação visual via Playwright rolando a tabela para confirmar que o cabeçalho fica sólido.
