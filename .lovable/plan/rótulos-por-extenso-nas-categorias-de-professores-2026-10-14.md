# Rótulos por extenso nas categorias de professores

## Objetivo

No quadro "Quantidade de professores por categoria" do cadastro de entidade, trocar as siglas por nomes por extenso — **Língua Portuguesa** em vez de LP e **Matemática** em vez de MAT — em todas as categorias. A mesma leitura vale para os rótulos de relatórios que hoje usam as siglas.

Nada é gravado de forma diferente: as chaves no banco continuam MAT, LP, OE MAT etc. Só o texto exibido muda, então os números já preenchidos (por exemplo EUDORO VILLELA com 4 de Matemática e 5 de Língua Portuguesa) permanecem exatamente onde estão.

## Rótulos exibidos

| Salvo no banco | Exibido na tela |
| --- | --- |
| MAT | Matemática |
| OE MAT | OE Matemática |
| TUTOR MAT | Tutor Matemática |
| LP | Língua Portuguesa |
| OE LP | OE Língua Portuguesa |
| TUTOR LP | Tutor Língua Portuguesa |
| MAT VOAR | Matemática VOAR |
| LP VOAR | Língua Portuguesa VOAR |
| TUTOR EFAI | Tutor EFAI |
| REGENTE EFAI | Regente EFAI |
| COLABORATIVO EFAI | Colaborativo EFAI |

## Onde o rótulo aparece

1. **Cadastro de entidade** — as 11 linhas do quadro "Quantidade de professores por categoria" (a tela do print).
2. **Reunião Mensal N1 (PRG Escolas)** — tabela "5. Abrangência da consultoria", que hoje traz "Tutor MAT" e "Tutor LP", e a nota "VOAR é somado ao componente (LP ou MAT)".
3. **Relatório de Apoio Presencial com Coordenação** — cards "Aulas Obs. LP", "Aulas Obs. OE LP", "Aulas Obs. Tutor LP" e o resumo do PDF, que hoje usam LP/Mat.

## O que não muda

- Os valores já registrados em `escolas.qtd_professores_categoria` — nenhuma migração, nenhum UPDATE.
- O campo **Componente** dos formulários de ação (Apoio Presencial, Aula compartilhada, Planejamento conjunto). As opções de lá são gravadas em cada registro, então renomeá-las criaria dois nomes para o mesmo componente nos registros antigos. Se um dia for desejado, exige um mapeamento à parte — fica de fora desta mudança.

## Detalhe técnico

- `src/config/entidadeCategorias.ts`: `PROFESSOR_CATEGORIAS` permanece inalterada (é a chave de gravação). Entra `PROFESSOR_CATEGORIA_LABELS` com os nomes da tabela acima e um helper `categoriaLabel(cat)`. Em `COBERTURA_GRUPOS`, os itens `'Tutor MAT'` e `'Tutor LP'` passam a `'Tutor Matemática'` e `'Tutor Língua Portuguesa'`, com o mesmo ajuste nos retornos de `grupoCobertura` no mesmo arquivo — os dois são usados só como chave de exibição dentro de `ReuniaoMensalEscolasPage.tsx`, que monta os mapas a partir da própria constante, então não há dado envolvido.
- `src/pages/admin/EscolasPage.tsx` (~linha 538): o `<span>` do rótulo passa a usar `categoriaLabel(cat)`; o `input` continua indexado por `formData.qtd[cat]`, preservando a chave salva.
- `src/pages/admin/ReuniaoMensalEscolasPage.tsx` (linha 345): nota vira "VOAR é somado ao componente (Língua Portuguesa ou Matemática)"; a tabela 5 sai com os nomes novos automaticamente, incluindo a exportação em PDF.
- `src/pages/admin/RelatorioConsultoriaPage.tsx` (linhas 204-205 e 400-406): títulos dos cards e as duas linhas de resumo do PDF usam os nomes por extenso, mantendo os mesmos totais.

## Verificação

- Typecheck/build.
- Abrir o cadastro da entidade EUDORO VILLELA: conferir que Matemática mostra 4 e Língua Portuguesa mostra 5; salvar e confirmar que o registro continua gravado com as chaves MAT/LP.
- Conferir a tabela "5. Abrangência da consultoria" e os cards do Relatório de Apoio Presencial com Coordenação.
