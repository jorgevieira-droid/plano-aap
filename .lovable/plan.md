

# Adicionar ação "Registro de Apoio Presencial"

## Resumo

Criar a nova ação "Registro de Apoio Presencial" com formulário dedicado baseado no documento. O formulário possui campos de cadastro (C) gerenciados pelo agendamento e campos de registro (R) com 3 focos de observação condicionais, cada um com questões de rubrica (escala 0-3) e campos de evidência.

## Estrutura do formulário (extraída do documento)

**Campos de Cadastro (C)** — tratados pelo sistema de agendamento:
- Programa, Data, Consultor (responsável), Escola, Escola faz parte do Projeto VOAR? (Sim/Não)

**Campos de Registro (R)** — pré-rubrica:
- Componente da aula (LP, Mat, OE MAT, OE LP, Tutoria MAT, Tutoria LP)
- Etapa de ensino (1º-9º Ano, 1ª-3ª Série)
- Turma observada VOAR (Padrão/Adaptada) — condicional se escola é VOAR
- Professor (seleção de professores da escola)
- Participantes da observação (multi: Consultor, Coordenador, Diretor, Vice-Diretor, Outros)
- Observação planejada com professor? (Sim/Não)
- Focos de observação (multi-select que determina quais dimensões aparecem):
  1. Planejamento e domínio de conteúdo e recursos didáticos
  2. Estratégias de aprendizagem
  3. Gestão de sala de aula
- Quando ocorrerá a devolutiva (5 opções)
- Alunos previstos / presentes (número)
- Horário previsto / real

**Questões de rubrica (escala 0-3: Nada efetivo → Muito efetivo)** por foco:

| Foco | Questões | Evidência |
|------|----------|-----------|
| Planejamento e Domínio do Conteúdo | 4 questões | 1 texto |
| Estratégias de Aprendizagem | 5 questões | 1 texto |
| Gestão de Sala de Aula | 7 questões (inclui engajamento, adaptação, questionamentos, tempo, participação, clima, respeito/conflito) | 1 texto |

**Campos obrigatórios finais** (independente do foco):
- Aspectos da prática docente para devolutiva
- Perguntas norteadoras para reflexão
- Sugestões a oferecer
- Combinados/encaminhamentos

## Alterações

### 1. `src/config/acaoPermissions.ts`
- Adicionar `'registro_apoio_presencial'` ao tipo `AcaoTipo` e ao array `ACAO_TIPOS`
- Adicionar entrada em `ACAO_TYPE_INFO` com label "Registro de Apoio Presencial" e ícone `ClipboardList`
- Adicionar permissões seguindo padrão Consultoria Pedagógica: N1 CRUD_ALL, N2-N3 CRUD_PRG, N4.1/N4.2/N5 CRUD_ENT, N6-N8 sem acesso
- Adicionar `ACAO_FORM_CONFIG` com `showSegmento: false`, `showComponente: false`, `requiresEntidade: true`, `useResponsavelSelector: true`, `responsavelLabel: 'Consultor'`

### 2. `src/hooks/useInstrumentFields.ts`
- Adicionar `{ value: 'registro_apoio_presencial', label: 'Registro de Apoio Presencial' }` ao array `INSTRUMENT_FORM_TYPES`

### 3. Migração SQL — inserir `instrument_fields`
Inserir ~22 registros na tabela `instrument_fields` com `form_type = 'registro_apoio_presencial'`:
- 4 campos rating (0-3) na dimensão "Planejamento e Domínio do Conteúdo e Recursos Pedagógicos" com `scale_labels` incluindo descrições das rubricas
- 1 campo textarea "Evidências - Planejamento" na mesma dimensão
- 5 campos rating (0-3) na dimensão "Estratégias de Aprendizagem"
- 1 campo textarea "Evidências - Estratégias"
- 7 campos rating (0-3) na dimensão "Gestão de Sala de Aula"
- 1 campo textarea "Evidências - Gestão"
- 4 campos textarea na dimensão "Obrigatórias" (aspectos prática docente, perguntas norteadoras, sugestões, combinados)

Também inserir `form_config_settings` para todos os programas.

### 4. Criar `src/components/formularios/RegistroApoioPresencialForm.tsx`
Formulário dedicado que:
- Renderiza campos pré-rubrica (componente, etapa, turma VOAR, professor, participantes, planejamento, focos, devolutiva, alunos, horário)
- Com base nos focos selecionados, filtra e renderiza as dimensões correspondentes usando `InstrumentForm` com `selectedKeys`
- Sempre mostra os 4 campos obrigatórios finais
- Salva respostas na tabela `instrument_responses` (reusa infraestrutura existente)
- Campo "escola_voar" condiciona exibição de "turma VOAR"

### 5. `src/pages/admin/MatrizAcoesPage.tsx`
- Adicionar `'registro_apoio_presencial'` ao `DEDICATED_FORM_TYPES`
- Renderizar `RegistroApoioPresencialForm` no dialog de visualização e na geração de PDF em branco

### Detalhes técnicos
- Escala 0-3 com labels: 0="Nada efetivo", 1="Pouco efetivo", 2="Efetivo", 3="Muito efetivo"
- Cada questão de rubrica terá as 4 descrições detalhadas (do documento) armazenadas em `scale_labels[].description`
- Os focos funcionam como filtros de dimensão: selecionar "Estratégias de aprendizagem" mostra apenas os campos dessa dimensão
- O componente reutiliza `InstrumentForm` internamente para renderizar as questões de rubrica, passando `selectedKeys` filtrados pelos focos escolhidos

