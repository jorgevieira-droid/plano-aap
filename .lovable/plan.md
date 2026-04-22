

## Ajuste do "Registro de Apoio Presencial": separar Cadastro (C) vs. Gerenciamento (R)

### Diagnóstico
Hoje a ação `registro_apoio_presencial` cai no fluxo genérico de instrumento — todos os campos do documento são exibidos somente no Gerenciamento, e o `RegistroApoioPresencialForm.tsx` dedicado existe mas só aparece em pré-visualização (Matriz de Ações). Os dados de cabeçalho (componente, etapa, professor, focos, devolutiva, etc.) não estão sendo capturados, e os focos não filtram as rubricas.

Vamos passar a usar o form dedicado no Gerenciamento e adicionar a seção (C) no agendamento (ProgramacaoPage), pré-preenchendo o form (R) com os valores informados no cadastro.

### Mapeamento dos campos por etapa

| Campo | Etapa | Origem |
|---|---|---|
| Programa | (C) auto | herdado do ator |
| Data | (C) auto | data da programação |
| Consultor (responsável) | (C) auto | seletor de Formador/Consultor já existente |
| Escola/Entidade | (C) auto | dropdown de entidades já existente |
| Escola é VOAR? | (C) novo | radio Sim/Não |
| Componente da aula | (C) novo | LP / Mat / OE MAT / OE LP / Tutoria MAT / Tutoria LP |
| Etapa de ensino | (C) novo | 1º Ano … 3ª Série |
| Turma observada (VOAR) | (C) condicional | Padrão / Adaptada — só se VOAR=Sim |
| Professor | (C) novo | filtrado pela escola + ano/série |
| Quem participou | (C) novo | múltipla + "Outros" texto |
| Observação foi planejada? | (C) novo | Sim / Não |
| Foco(s) de observação | (C) novo | múltipla — define quais rubricas abrem em (R) |
| Quando ocorrerá a devolutiva | (C) novo | seleção única |
| Alunos previstos | (R) | número, no Gerenciamento |
| Alunos presentes | (R) | número, no Gerenciamento |
| Horário previsto | (R) | hora |
| Horário real | (R) | hora |
| Rubricas dos focos selecionados | (R) | abre só os focos do (C) |
| 4 perguntas obrigatórias finais | (R) | textareas obrigatórias |

### Mudanças

**1. Banco — migração**
Adicionar colunas em `programacoes` (todas opcionais, só preenchidas quando `tipo='registro_apoio_presencial'`):
- `apoio_componente`, `apoio_etapa`, `apoio_turma_voar` (text)
- `apoio_escola_voar` (boolean)
- `apoio_professor_id` (uuid)
- `apoio_participantes` (text[]), `apoio_participantes_outros` (text)
- `apoio_obs_planejada` (boolean)
- `apoio_focos` (text[])
- `apoio_devolutiva` (text)

**2. ProgramacaoPage (cadastro/edição da ação)**
- Adicionar bloco condicional `{formData.tipo === 'registro_apoio_presencial' && (...)}` no diálogo de Nova/Editar Ação com os 12 campos (C).
- Validar que pelo menos 1 foco foi selecionado.
- Persistir os valores nas novas colunas em insert/update.
- Carregar os valores ao abrir edição.

**3. Switch do AAPRegistrarAcaoPage (gerenciamento)**
- Criar constante `APOIO_PRESENCIAL_TYPE` e tratar como tipo dedicado (igual ao `CONSULTORIA_PEDAGOGICA_TYPE`).
- Excluir de `isInstrumentType`.
- Quando ação for marcada como Realizada, abrir um diálogo dedicado renderizando `RegistroApoioPresencialForm`.

**4. RegistroApoioPresencialForm (refator do form (R))**
- Receber via props os valores (C) já cadastrados (componente, etapa, professor, focos, etc.) e exibi-los como **somente leitura** no topo (resumo "Dados do Cadastro").
- Remover do form os controles de cadastro — manter apenas:
  - Alunos previstos / presentes / horários (R)
  - Rubricas filtradas pelos `focos` recebidos via prop (já é feito hoje)
  - 4 textareas obrigatórias finais
- Salvar como hoje em `instrument_responses` (mantendo `_componente`, `_etapa`, `_focos` etc. nas responses para histórico/análise).

**5. MatrizAcoesPage (preview)**
- Atualizar a preview para mostrar todas as seções (C + R), apenas para visualização, indicando claramente quais ficam no cadastro e quais no gerenciamento.

**6. Permissões/Configuração**
- Sem mudanças. `acaoPermissions.ts` (CRUD_ALL/PRG/ENT já correto), `INSTRUMENT_FORM_TYPES` já contém o tipo, e a aba "Configurar Formulário" continua funcionando para os campos de instrument_fields.

**7. Memória**
- Atualizar `mem://features/registro-apoio-presencial` adicionando a regra "Campos (C) no cadastro / (R) no gerenciamento; focos selecionados no cadastro filtram rubricas no gerenciamento".

### Resultado
- N1 a N5 (conforme matriz já existente) agendam a ação preenchendo todos os campos (C) no momento do cadastro.
- Ao gerenciar/registrar como realizada, o formulário abre com os campos (C) como resumo somente leitura no topo, e exibe os campos (R): alunos/horários, rubricas filtradas pelos focos escolhidos e as 4 textareas obrigatórias.
- A escolha dos focos no cadastro determina exatamente quais grupos de rubrica aparecem no gerenciamento.

