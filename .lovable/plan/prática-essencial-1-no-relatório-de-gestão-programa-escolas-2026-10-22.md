# Prática Essencial 1 no Relatório de Gestão - Programa Escolas

## O que muda
Um bloco novo, **"Prática Essencial 1 — Retomada"**, entra na página logo antes de "Indicadores da Consultoria". Ele segue os filtros do topo da página (período, consultor(a) e escola) e soma os dados de todos os consultores.

**Três cartões com o total geral:**
- **Ações com Prática 1:** quantidade e % sobre o total de ações.
- **Escolas com Prática 1:** quantidade e % sobre as escolas atendidas.
- **Professores com Prática 1:** quantidade e % sobre os professores atendidos.

**Gráfico por tipo de ação:** uma barra para cada ação, dividida em Sim / Não / Sem informação. As ações são:
- Apoio Presencial (conta "observou a prática")
- Aula compartilhada com prof.
- Planejamento conjunto com prof.
- Formação Coletiva
- Apoio Presencial com a Coordenação

**Tabela por tipo de ação:** para cada ação, mostra ações, escolas e professores com a Prática 1, com quantidade e %. Nas ações sem nome de professor no registro, a coluna de professores mostra "—".

**Três abas:** Por Consultor(a), Por Escola e Por Professor, juntando todas as ações. São as mesmas abas que já existem nos painéis de cada ação.

## Regras
- A prática conta quando a resposta é "Sim".
- As ações sem resposta (registros antigos) entram no total e aparecem como "Sem informação".
- Para o N4, o bloco mostra só as ações dele, como no resto da página.

## Detalhes técnicos
- Reutilizar `computePratica1` e `Pratica1Block` com os `filtered` rows já carregados, sem buscas novas.
- Valor por tipo: `observou_praticas` para `registro_apoio_presencial`; `desenvolveu_pratica_1` para `registro_aula_compartilhada`, `registro_planejamento_conjunto`, `registro_formacao_coletiva` e `registro_consultoria_pedagogica`.
- Gráfico horizontal empilhado (recharts), com as cores da página.
- Inserir em `RelatoriosGestaoEscolasPage.tsx`, antes do card "Indicadores da Consultoria".
