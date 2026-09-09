# Ajustes em Registros e Indicadores - Caê

## 1. Registros: ocultar o botão do "olho"
Na lista de Registros, a coluna Ações deixa de exibir o botão de visualização rápida (ícone de olho). Continuam disponíveis o botão de formulário completo (cadastro + gerenciamento), edição, presenças e demais ações.

## 2. Indicadores - Caê: Ano/Série sem "1ª Série, 2ª Série, 3ª Série"
Causa confirmada: a contagem por Ano/Série pega apenas o primeiro dígito do valor e transforma tudo em "Nº Ano" — por isso "1ª Série" é somado dentro de "1º Ano" e as séries do Ensino Médio nunca aparecem.

Correção: contabilizar apenas os valores exatos da listagem oficial (1° Ano … 9° Ano, 1ª Série, 2ª Série, 3ª Série), comparando sem diferença de acentuação/maiúsculas, e exibir na ordem oficial — as três séries logo após o 9º Ano. Valores fora da lista são desconsiderados.

## 3. Indicadores - Caê: nova tabela por consultor
Nova tabela dentro do bloco "Indicadores - Caê", listando por consultor(a):

Consultor | Apoio Presencial | Planejamento Conjunto | Aula Compartilhada | Total

Ordenada A–Z, reagindo aos mesmos filtros (período, consultor, escola), com botão de download em Excel no mesmo padrão da tabela de professores.

## 4. Novo box "Escolas Atendidas" no espaço vazio
No espaço em branco ao lado do "Painel – Registro de Encaminhamentos Internos", incluir um card com uma tabela por escola:

Escola | Professores atendidos (nomes distintos) | Apoio Presencial | Planejamento Conjunto | Aula Compartilhada

Ordenada A–Z, com rolagem quando houver muitas escolas, reagindo aos filtros globais e com botão "Exportar Excel".

## Detalhes técnicos
- `src/pages/admin/RegistrosPage.tsx`: remover o botão com ícone `Eye` da coluna de ações (manter `selectedRegistro` usado por outros fluxos).
- `src/pages/admin/RelatoriosGestaoEscolasPage.tsx`:
  - substituir `normAnoSerie` por comparação normalizada contra `ANO_SERIE_OPTIONS_ESCOLAS`, com ordenação pelo índice da lista (em vez de A–Z) apenas nesta distribuição;
  - adicionar `porConsultor` e `porEscola` ao `useMemo` `cae`, reutilizando `bucketOf` e as mesmas linhas filtradas (Apoio Presencial + Planejamento Conjunto + Aula Compartilhada);
  - novas tabelas + exports com `XLSX` (mesmo padrão de `exportProfessoresExcel`);
  - o card de escolas ocupa a célula livre do grid `xl:grid-cols-2` dos blocos de relatório.
- Sem alterações de consultas, rotas, permissões ou banco.

## Validação
- `npx tsgo --noEmit -p tsconfig.app.json`
- Conferência visual no preview e download dos dois Excels.
