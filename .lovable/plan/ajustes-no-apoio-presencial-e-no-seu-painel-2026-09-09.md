# Ajustes no Apoio Presencial e no seu painel

## No formulário (ação/evento Apoio Presencial)

1. **Todas as perguntas passam a ser obrigatórias**, exceto as ligadas às rubricas (escolha da rubrica, notas das rubricas e das práticas essenciais, e as perguntas "existe outra rubrica/prática?"). Ficam obrigatórias:
   - Turma do VOAR; Alunos presentes; Diferença entre horário previsto e real; Outros observadores (ao menos uma opção); Devolutiva realizada; Data da devolutiva e Dobradinha (quando devolutiva = Sim); Motivo da não realização (quando = Não).
   - Evidências da observação de aula.
   - Temas abordados na devolutiva; Encaminhamentos combinados com o Professor; Participação e engajamento do Professor na devolutiva.
   - Você observou práticas essenciais?
   O botão Salvar avisa qual campo está faltando.

2. **Numeração dos blocos corrigida** (hoje há dois blocos "6"). Nova sequência:

   ```text
   2  Dados da Realização
   3  Coleta de Evidências
   4  Devolutiva Formativa
   5  Escolha da Rubrica de Observação
   6  Segunda Rubrica de Observação (quando houver)
   7  Práticas Essenciais
   8  Rubrica da Primeira Prática Essencial — Retomada
   9  Rubrica da Segunda Prática Essencial
   10 Rubrica da Terceira Prática Essencial
   ```
   Quando não há segunda rubrica, a numeração segue sem buraco.

3. **Remover o bloco "Avaliação do Apoio Presencial"** (nota 1 a 4 + justificativa) do formulário e da visualização/impressão do registro.

4. **Ano/Série com lista fixa** em todas as ações do Programa Escolas:
   1º Ano; 2º Ano; 3º Ano; 4º Ano; 5º Ano; 6º Ano; 7º Ano; 8º Ano; 9º Ano; 1ª Série; 2ª Série; 3ª Série.
   Valores já gravados continuam aparecendo mesmo que não estejam exatamente nessa grafia.

5. **Renomear a pergunta** "Observação planejada" para
   "Observação e devolutiva combinadas previamente com o professor?".

## No painel (Relatórios - Registro de Apoio Presencial)

- **Sai** o quadro "Autoavaliação — Consultor(a)" (dado da questão removida).
- **Saem os gráficos de evolução** das rubricas de observação e das práticas essenciais. **As tabelas/matrizes mensais continuam como estão**, assim como a contagem de práticas essenciais.
- **Entra** um quadro com as respostas abertas da Devolutiva Formativa, em tabela: Consultor(a), Nome da Escola, Data, Temas abordados, Encaminhamentos combinados, Participação e engajamento.
- **Entram** duas novas visões alimentadas pelo cadastro: quantidade de apoios por Ano/Série e quantidade de apoios por "Observação e devolutiva combinadas previamente com o professor?" (Sim/Não).
- Os mesmos ajustes valem no PDF exportado do painel.

## Detalhes técnicos

- `src/components/formularios/RegistroApoioPresencialContent.tsx`: marcar campos como obrigatórios, renumerar os títulos dos blocos (numeração calculada conforme a presença da 2ª rubrica), remover o bloco de avaliação.
- `src/components/formularios/RegistroApoioPresencialForm.tsx`: ampliar a validação no `handleSave`; incluir `_ano_serie` e `_obs_planejada` já enviados no payload (já existem).
- `src/components/formularios/apoioPresencialShared.ts`: nova constante `ANO_SERIE_OPTIONS_ESCOLAS`; manter `AVALIACAO_APOIO_OPTIONS` apenas para uso do Apoio com a Coordenação.
- `src/pages/admin/ProgramacaoPage.tsx`: usar a lista fixa de Ano/Série nas ações do Programa Escolas (campo `apoio_ano_serie` e o campo genérico `anoSerie` quando o programa é escolas); alterar o rótulo do campo `apoio_obs_planejada`.
- `src/components/print/RegistroApoioPresencialPrintSection.tsx`: remover a seção 10 e ajustar a numeração das seções.
- `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`: remover `autoavaliacao`/`AVALIACAO_APOIO_OPTIONS` e os dois `LinesCard`; manter `MatrizCard`; novo card de textos da devolutiva; agregações por `_ano_serie`/`apoio_ano_serie` e por `_obs_planejada`; refletir tudo na versão de impressão do próprio arquivo.
- Sem alteração de banco: as respostas continuam em `instrument_responses.responses`.
