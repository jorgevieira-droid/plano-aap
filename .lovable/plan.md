# Novos campos no cadastro de Entidade

Na tela de cadastro/edição de Entidade (página Entidades), incluir três novos campos opcionais:

1. **Tipo** — seleção única: PEI ou Parcial (com opção "Não informado").
2. **Etapa/Ciclo** — seleção múltipla com caixas de marcar: EFAI, EFAF, EM.
3. **Quantidade de professores por categoria** — uma linha com campo numérico para cada categoria, na ordem do print:
   MAT, OE MAT, TUTOR MAT, LP, OE LP, TUTOR LP, MAT VOAR, LP VOAR, TUTOR EFAI, REGENTE EFAI, COLABORATIVO EFAI.
   Exibido como uma grade compacta (2 colunas) com total somado ao final.

Comportamento:
- Todos opcionais; entidades existentes ficam em branco, sem perda de dados.
- Números aceitam apenas inteiros maiores ou iguais a 0.
- Valores carregam ao editar e são salvos junto com o cadastro.
- Na listagem, coluna "Tipo" e "Etapa/Ciclo" (badges) adicionadas; quantidades ficam só no formulário.
- Importação em lote não muda.

## Detalhes técnicos
- Migração em `escolas`: `tipo text NULL` (validado por CHECK em ('PEI','Parcial')), `etapas text[] NULL`, `qtd_professores_categoria jsonb NOT NULL DEFAULT '{}'` (chave = categoria, valor = inteiro).
- `EscolasPage.tsx`: estender `Escola`/`formData`, campos no diálogo (Select, Checkbox, Inputs number), incluir no insert/update, colunas na tabela.
- Lista de categorias em constante compartilhada para reuso futuro em relatórios.
- RLS existente de `escolas` já cobre as novas colunas.
