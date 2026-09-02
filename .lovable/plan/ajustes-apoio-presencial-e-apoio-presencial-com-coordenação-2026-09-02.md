# Ajustes: Apoio Presencial e Apoio Presencial com Coordenação

## 1. Ação "Registro de Apoio Presencial" (cadastro)

- Campo **Ano-Série** passa a ser obrigatório: rótulo com asterisco e validação no envio ("Informe o ano/série"), junto das validações já existentes (Professor, Componente, Segmento, Observação planejada).

## 2. Página "Relatórios - Registro de Apoio Presencial"

Três novos blocos, no mesmo padrão visual da página (cards + tabelas), respeitando os filtros de período/consultor/escola já existentes e incluídos na exportação em PDF:

- **Evidências da observação de aula** — lista/tabela com Consultor, Nome da Escola (entidade), Data e o texto completo de "Registre as evidências da observação de aula". Só exibe registros que tenham o texto preenchido.
- **Autoavaliação em formato de tabela** — substitui o gráfico atual por uma tabela: Consultor | Qtd realizada | Qtd nota 1 (Nada eficaz) | Qtd 2 (Pouco eficaz) | Qtd 3 (Eficaz) | Qtd 4 (Muito eficaz), com linha de total.
- **Apoios por professor** — tabela com Professor | Escola (Entidade) | Segmento | Componente | Qtd de apoios, agrupando pelos dados do cadastro da ação, ordenada por quantidade (e alfabética como desempate).

## 3. Ação "Registro de Apoio Presencial com Coordenação"

Cadastro:
- Ocultar **Descrição** e **Tags**.
- **Hora Início** e **Hora Fim** deixam de ser obrigatórios (ocultos do formulário).
- Remover o campo **"Reunião agendada previamente"** do formulário e sua validação.

Formulário de gerenciamento (registro da ação), ao final do bloco existente:
- **"Como você avalia a sua formação em serviço sobre Apoio Presencial realizada com o(a) Coordenador(a)?"** — botões de nota 1 a 4 (1 - Nada eficaz | 2 - Pouco eficaz | 3 - Eficaz | 4 - Muito eficaz), mesmo componente visual usado no Apoio Presencial.
- **"Justifique a nota"** — texto longo.

## 4. Página "Relatório - Registro de Apoio Presencial com Coordenação"

- Renomear o box "Total de Registros Realizados" → **"Total de Apoios Realizados"**.
- Renomear o box "Devolutivas Planejadas" → **"Devolutivas Planejadas com o Coordenador"**.
- Novo bloco em tabela para a nova pergunta de avaliação: Consultor | Qtd realizada | Qtd por critério (1 a 4), com linha de total; incluído também no PDF.

## Detalhes técnicos

- `src/pages/admin/ProgramacaoPage.tsx`: validação de `formApoioAnoSerie`; condicional de Descrição/Tags incluindo `registro_consultoria_pedagogica`; remoção do bloco/validação de `formReuniaoAgendada` (coluna `reuniao_agendada` permanece no banco para histórico); horários opcionais nesse tipo.
- `src/components/formularios/OlharParceiroContents.tsx` (`FormacaoCoordenadorContent`): novas chaves `avaliacao_formacao_coordenador` (1-4) e `avaliacao_formacao_coordenador_justificativa` em `responses` (JSONB — sem migração).
- `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx` e `RelatoriosApoioCoordenacaoPanelPage.tsx`: novos memos/tabelas e ajustes de rótulos e de seções PDF.
- `src/components/print/RegistroApoioPresencialPrintSection.tsx` / visualização do formulário completo: exibir os novos campos da Coordenação.
