# Ajustes: Formação Coletiva e Planejamento Conjunto

## 1. Registro de Formação Coletiva

Cadastro (`ProgramacaoPage.tsx`):
- Ocultar **Hora Início** e **Hora Fim** para `registro_formacao_coletiva` (mesma lógica já usada em `registro_consultoria_pedagogica`), gravando `00:00` por padrão para não quebrar a persistência.

Formulário de registro (`OlharParceiroContents.tsx` → `FormacaoColetivaContent`):
- Incluir a opção **Co-construção de Pauta** em `FORMACAO_COLETIVA_FORMATO_OPTIONS`.
- Quando `formato = 'Co-construção de Pauta'`, a pergunta **NPS da formação** não é exibida (e o valor de NPS é limpo da resposta).
- No `Relatório - Formação Coletiva`, os cálculos de nota média e NPS passam a ignorar registros sem NPS (já é o comportamento para valores ausentes; será validado).

## 2. Registro de Planejamento Conjunto com o Professor

Cadastro (`ProgramacaoPage.tsx`):
- O campo **Componente** deste tipo passa a usar uma lista própria (texto), gravada em `programacoes.apoio_componente`, com as opções: Língua Portuguesa, Matemática, Polivalente, **OE Língua Portuguesa**, **OE Matemática**, **Tutor Língua Portuguesa**, **Tutor Matemática**.
- Para manter a compatibilidade do banco (o campo `componente` de `programacoes`/`registros_acao` é um enum fechado), o valor detalhado é mapeado para o enum base: opções de LP/OE LP/Tutor LP → `lingua_portuguesa`; MAT/OE MAT/Tutor MAT → `matematica`; Polivalente → `polivalente`. Nenhuma migração de banco é necessária.

Formulário de registro (`PlanejamentoConjuntoContent.tsx`):
- Tornar obrigatórias: **Tema da aula**, **Registre as contribuições realizadas ao planejamento do professor**, **Como essa aula será monitorada pela consultoria?** (marcação `*` + bloqueio de salvamento com aviso, no mesmo padrão dos demais instrumentos).
- Novas perguntas, nesta ordem:
  - **Quantos estudantes proficientes a turma possui?** (número) — `estudantes_proficientes`
  - **Como foi a participação do Professor?** (texto longo) — `participacao_professor`
  - **Como você avalia a eficácia do Planejamento Conjunto Realizado?** (1 - Nada Eficaz / 2 - Pouco Eficaz / 3 - Eficaz / 4 - Muito Eficaz) — `eficacia_planejamento`
  - **Justifique a resposta** (texto longo) — `eficacia_justificativa`

## 3. Página "Relatório - Planejamento Conjunto com o Professor"

`RelatoriosPlanejamentoConjuntoPanelPage.tsx` (título na página, no menu lateral e no PDF).

Retirar:
- Box **Consultores(as) envolvidos**
- Box **Média do nº da aula (MD/SP)**

Incluir:
- **Tema das aulas** — lista com Consultor, Escola, Data e o tema.
- **Como foi a participação do Professor** — lista com Consultor, Escola, Data e o texto.
- **Qtd de Planejamentos em Conjunto por Segmento** e **Qtd de Planejamentos por Série** — já existem como distribuições; passam a ficar em destaque com esses rótulos (e a distribuição por Componente usa o componente detalhado quando disponível).
- **Eficácia do Planejamento Conjunto** — tabela com: Consultor(a), Qtd realizada e a quantidade por critério (1 - Nada Eficaz | 2 - Pouco Eficaz | 3 - Eficaz | 4 - Muito Eficaz), com linha de totais.
- Nos números da turma, incluir os **estudantes proficientes** (total e média), acompanhando os demais níveis.

Todas as novas visualizações também entram no PDF, seguindo o padrão atual (marca Parceiros + Bússola, ordenação A-Z pt-BR).
