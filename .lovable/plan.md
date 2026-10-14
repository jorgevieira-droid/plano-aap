# Novos campos da Entidade + Página "Reunião Mensal - Consultoria" (Escolas)

## Parte 1 — Novos campos no cadastro de Entidade
Na tela de cadastro/edição de Entidade, três campos opcionais:
1. **Tipo** — seleção única: PEI ou Parcial.
2. **Etapa/Ciclo** — seleção múltipla: EFAI, EFAF, EM.
3. **Quantidade de professores por categoria** — uma linha numérica por categoria (ordem do print): MAT, OE MAT, TUTOR MAT, LP, OE LP, TUTOR LP, MAT VOAR, LP VOAR, TUTOR EFAI, REGENTE EFAI, COLABORATIVO EFAI, com total ao final.

Entidades existentes ficam em branco; inteiros ≥ 0; na listagem entram colunas Tipo e Etapa/Ciclo.

## Parte 2 — Nova página baseada no documento
Página **"Painel - Reunião Mensal (Consultoria)"** para o Programa de Escolas, com filtro de mês (padrão: mês anterior), escola e consultor(a), exportação PDF. Seções, na ordem do documento:

1. **Painel Geral** — cards: escolas atendidas, professores apoiados, apoios presenciais, devolutivas, formações coletivas, reuniões com coordenação, planejamentos conjuntos, aulas compartilhadas; atalhos para as seções.
2. **Prática essencial 1** — X escolas / X apoios / X professores; tabela Observou / Não observou / Sem informação (total e %); barras empilhadas por semana.
3. **Rubrica: efetividade da Prática 1** — barras empilhadas 0–3 separadas por **PEI x Parcial** (usa o novo campo Tipo) + média com nota explicando o cálculo.
4. **Apoios x Devolutivas** — barras por mês do ano. Meses sem dados no sistema (ex.: mar–jun) podem ser preenchidos manualmente por N1/N2 em uma pequena tela de "valores manuais".
5. **Abrangência da consultoria** — tabela por categoria: Total de professores (soma do novo campo nas entidades) x Professores únicos apoiados no mês x Cobertura; totais gerais. Agrupamento: EFAI Regente; EFAI Colaborativo/Tutor; LP/OE; MAT/OE; Tutor MAT; Tutor LP (VOAR somado ao componente).
6. **Professores apoiados por componente** — recorrência (2+ apoios e %), apoios em EFAI / EFAF / EM com o ano-série de maior concentração.
7. **Professores apoiados por escola** — barras empilhadas "1 AP" x "2+ APs", todas as escolas.
8. **Formações coletivas** — barras empilhadas por escola segundo a participação do coordenador (Trouxe sugestões / Apenas validou / Participou ativamente / Não participou), com totais.
9. **Aulas compartilhadas** — tabela Escola x Quantidade x Ano/série x Componente, com total.

Acesso: N1, N2 e N3 do Programa de Escolas (menu "Relatórios de Gestão").

## Ponto a confirmar
- Valores manuais (item 4): ok uma tela simples de lançamento por mês, ou prefere só exibir o que o sistema tem?

## Detalhes técnicos
- Migração `escolas`: `tipo text` (CHECK PEI/Parcial), `etapas text[]`, `qtd_professores_categoria jsonb default '{}'`.
- Nova tabela `consultoria_valores_manuais (programa, mes date, metrica, valor)` com GRANT/RLS para manager (só se confirmado).
- Constante compartilhada de categorias de professor e mapa categoria → grupo da cobertura.
- Página nova `RelatorioReuniaoMensalPage.tsx` reaproveitando consultas de Apoio Presencial, Formação Coletiva, Aula Compartilhada, Planejamento Conjunto e Apoio ao Coordenador; Recharts; PDF com `data-pdf-section` por seção; rota + ALLOWED_ROUTES + Sidebar.
