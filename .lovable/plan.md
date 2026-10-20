# Contar Prática Essencial - Retomada só com evidência preenchida

## Relatórios de Gestão - Programa Escolas
- Nas tabelas **Professores Apoiados** e **Apoios por Consultor(a)**, a coluna **Observação de Prática Essencial - Retomada** passa a contar só os Apoios Presenciais marcados "observou práticas essenciais = Sim" **e** com a evidência da Prática Essencial 1 preenchida (espaços em branco contam como vazio).
- A mesma regra vale para as exportações em Excel dessas tabelas.

## Relatórios - Apoio Presencial
- Tabela **Evidências da Prática Essencial 1 — Retomada** e seu Excel: mostram só registros com evidência preenchida.
- Gráfico **Com / Sem observação de práticas essenciais**: o "Com" passa a contar só os registros com evidência; os demais vão para "Sem", e a soma continua igual ao total de apoios.

## O que não muda
- Formulário, registros salvos e demais indicadores.
- Registros antigos sem evidência deixam de entrar na contagem (antes contavam).

## Detalhes técnicos
- `RelatoriosGestaoEscolasPage.tsx` (~l.445): `praticaOf` exige também `String(resp.pratica_1_evidencia||'').trim() !== ''`.
- `RelatoriosApoioPresencialPanelPage.tsx`: mesma condição em `porObservouPraticas` (~l.307) e no filtro de `evidenciasPratica1` (~l.436). Criar um helper compartilhado local para a regra.
- Teste unitário pequeno para o helper (Sim + evidência = conta; Sim sem evidência = não conta; Não = não conta).
