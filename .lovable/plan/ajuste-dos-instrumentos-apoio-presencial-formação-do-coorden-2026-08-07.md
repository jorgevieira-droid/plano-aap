# Ajuste dos instrumentos: Apoio Presencial, Formação do Coordenador e Encaminhamentos Internos

Reformulação de duas ações existentes e criação de uma nova, conforme o documento "Olhar Parceiro".

---

## 1. Registro de Apoio Presencial (nova mecânica)

### Cadastro (na Programação / Adicionar Ação)
Substitui os campos atuais (VOAR, focos, participantes, devolutiva prevista) por:
- Professor (seleção da escola)
- Escola
- Segmento: EFAI, EFAF, EM
- Componente: MAT, OE MAT, TUTOR MAT, LP, OE LP, TUTOR LP, MAT VOAR, LP VOAR, TUTOR EFAI, REGENTE EFAI, COLABORATIVO TUTOR EFAI
- Ano-Série (texto curto)
- Turma (texto curto)
- Observação planejada: Sim / Não

### Formulário de gerenciamento (realização)
Blocos, na ordem do documento:

1. **Dados da Realização** — alunos presentes, horário previsto de início, horário real de início, data da observação, outros observadores (Coordenador, PAAC, Diretor), devolutiva realizada (sim/não), data da devolutiva, dobradinha (sim/não), motivo da não realização (aparece só quando "não").
2. **Coleta de Evidências** — texto longo, com a dica e o link do Gem Transcritor de Evidências.
3. **Devolutiva Formativa** — três textos longos: evidências trabalhadas sobre o foco escolhido pelo professor, encaminhamentos combinados, subsídios compartilhados.
4. **Rubrica de Observação** — escolha única entre as 14 rubricas; ao escolher, aparece o enunciado e a descrição dos níveis, sempre visíveis (sem precisar expandir), com nota 0–3 (Nada efetivo, Pouco efetivo, Efetivo, Muito efetivo).
5. **Outra rubrica?** Sim/Não — se sim, repete a escolha única (a mesma lista) e a pontuação. Máximo de duas rubricas.
6. **Práticas Essenciais** — primeira prática fixa "Retomada" (enunciado e descritores completos do documento), nota 0–3. Depois "Você observou outra prática essencial?" Sim/Não, até a segunda e a terceira prática, ambas exibidas com o aviso "A ser desenvolvido".

### Descritores das rubricas
Somente a rubrica 1 e a prática "Retomada" têm descritores completos no documento. As rubricas 2 a 14 aparecerão com o enunciado, a escala 0–3 e o aviso **"Descrição a ser desenvolvida"** no lugar dos descritores.

### Fluxo condicional
O formulário passa a ser progressivo: a segunda rubrica e a segunda/terceira prática só aparecem após resposta "Sim" na pergunta anterior; o encerramento ocorre no "Não".

---

## 2. Registro de Formação do Coordenador

O formulário atual (contadores de aulas observadas, devolutivas, ATPCs etc.) é substituído pelo novo. Registros já preenchidos no formato antigo continuam abrindo em modo leitura com o layout antigo.

### Cadastro
- Nome do Coordenador (texto curto)
- Escola
- Etapa: EFAI, EFAF, EM
- Reunião agendada previamente: Sim / Não

### Realização
- Data da observação
- O coordenador observou a aula do início ao fim? (sim/não)
- O coordenador fez registros de observação? (sim/não)
- Como foram os registros: evidências de grão fino / evidências de grão largo / inferências
- A devolutiva foi planejada junto com o coordenador antes de ser realizada? (sim/não)
- A devolutiva foi realizada? (sim/não)
- Data da devolutiva
- Como o coordenador participou da devolutiva: observador de devolutiva modelizada / liderança / co-liderança
- Motivo da não realização da devolutiva (texto longo, só quando não realizada)

---

## 3. Registro de Encaminhamentos Internos (nova ação)

Disponível nos três programas (Escolas, Regionais, Redes Municipais), seguindo a hierarquia padrão de permissões das demais ações de registro.

### Cadastro
- Escola
- Etapa: EFAI, EFAF, EM

### Realização
- "Existe alguma informação que precisa ser circulada internamente? Descreva abaixo" — texto longo

Aparece em Programação, Adicionar Ação, Registros, impressão/PDF e nos relatórios de extração de base.

---

## Detalhes técnicos

Banco de dados:
- Novas colunas de cadastro em `programacoes` e `registros_acao` para os campos do Apoio Presencial (segmento, ano-série, turma) e do Encaminhamentos Internos (etapa), reaproveitando as colunas `apoio_*` existentes onde houver equivalência.
- Novo valor `registro_encaminhamentos_internos` adicionado a `programacoes_tipo_check` e `registros_acao_tipo_check` antes de qualquer teste de frontend (conforme o checklist de novo tipo de ação).
- Reescrita das linhas de `instrument_fields` para `registro_apoio_presencial`: 14 rubricas (`rubrica_1`..`rubrica_14`) com descritores em `metadata`, práticas essenciais (`pratica_retomada`, `pratica_2`, `pratica_3`), campos de evidências e devolutiva formativa. Campos antigos por dimensão são desativados, não apagados, preservando o histórico.
- Novas linhas de `instrument_fields` para `registro_encaminhamentos_internos` e para o novo formato de `registro_consultoria_pedagogica` (chave técnica mantida). As colunas atuais de `consultoria_pedagogica_respostas` permanecem para leitura do histórico.

Frontend:
- `src/components/formularios/RegistroApoioPresencialForm.tsx` reescrito com os blocos e o fluxo condicional; novo componente de rubrica com descritores sempre visíveis e escala 0–3.
- `src/components/formularios/ConsultoriaPedagogicaForm.tsx` ganha o novo layout e mantém um modo de leitura para respostas antigas.
- Novo `src/components/formularios/EncaminhamentosInternosForm.tsx`.
- `src/pages/admin/ProgramacaoPage.tsx`: campos de cadastro dos três instrumentos.
- `src/config/acaoPermissions.ts`, `src/hooks/useAcoesByPrograma.ts`, `src/hooks/useInstrumentFields.ts`, `RegistrosPage`, `AcaoPrintForm`/`AcaoPrintDialog`, `RelatorioApoioPresencialPage`, `ExtracaoBasesInstrumentosPage` e `ManualUsuarioPage` atualizados para a nova ação e os novos campos.
