# Renomear a coluna "Valor" para "Quantidade"

## O que muda

Na página **Reunião Mensal N1 (PRG Escolas)**, dentro da seção **"6. Professores apoiados por componente"**, o cabeçalho da segunda coluna da tabela passa de:

```text
Indicador            | Valor | Descrição
```

para:

```text
Indicador            | Quantidade | Descrição
```

O conteúdo das linhas (Recorrência, EFAI — Anos Iniciais, EFAF — Anos Finais, EM — Ensino Médio) e a coluna "Descrição" permanecem exatamente como estão.

## Onde

- Arquivo: `src/pages/admin/ReuniaoMensalEscolasPage.tsx`
- Linha 348: array de cabeçalhos `['Indicador', 'Valor', 'Descrição']` vira `['Indicador', 'Quantidade', 'Descrição']`.

Nenhuma outra ocorrência de "Valor" na página é tocada — o botão "Valores manuais" e a mensagem "Valores salvos" dizem respeito ao lançamento manual de devolutivas e continuam iguais.

## Detalhes técnicos

- A tabela usa o componente `Tbl`, que centraliza automaticamente as colunas numéricas; como os valores da coluna são números, "Quantidade" continua centralizada, igual ao comportamento atual de "Valor".
- A mesma função de renderização gera a tela e o PDF, então o cabeçalho renomeado aparece nos dois sem trabalho extra.
- A página não tem exportação Excel, então não há arquivo de exportação a ajustar.
- Sem mudança no banco de dados e sem mudança em outras páginas.

## Verificação

Abrir a Reunião Mensal N1 (PRG Escolas) no preview e conferir que a seção 6 traz "Quantidade" no lugar de "Valor", com os números ainda centralizados; em seguida exportar o PDF e confirmar o mesmo cabeçalho na página da seção 6.
