

# Incluir ação "Registro da Consultoria Pedagógica" no sistema

## Resumo

Adicionar o novo tipo de ação `registro_consultoria_pedagogica` com formulário dedicado (campos C no cadastro, campos R no gerenciamento), uma página de relatório exclusiva com filtros e envio por e-mail, e integração com todos os módulos existentes (Programação, Registros, Matriz de Ações, Configuração de Formulários).

## Escopo

### 1. Banco de Dados

**Migração SQL:**
- Atualizar CHECK constraints em `programacoes` e `registros_acao` para incluir `'registro_consultoria_pedagogica'`
- Criar tabela `consultoria_pedagogica_respostas`:

```text
id                          uuid PK
registro_acao_id            uuid NOT NULL (ref registros_acao)
aap_id                      uuid NOT NULL
escola_id                   uuid NOT NULL
etapa_ensino                text[] (EFAI, EFAF, EM)
escola_voar                 boolean DEFAULT false
participantes               text[]
participantes_outros        text
agenda_planejada            boolean
agenda_alterada             boolean
agenda_alterada_razoes      text
-- Ações formativas junto aos professores
aulas_obs_lp                integer DEFAULT 0
aulas_obs_mat               integer DEFAULT 0
aulas_obs_oe_lp             integer DEFAULT 0
aulas_obs_oe_mat            integer DEFAULT 0
aulas_tutoria_obs           integer DEFAULT 0
aulas_obs_turma_padrao      integer DEFAULT 0  (VOAR)
aulas_obs_turma_adaptada    integer DEFAULT 0  (VOAR)
professores_observados      integer DEFAULT 0
devolutivas_professor       integer DEFAULT 0
atpcs_ministrados           integer DEFAULT 0
-- Ações formativas junto à coordenação
aulas_obs_parceria_coord    integer DEFAULT 0
devolutivas_model_coord     integer DEFAULT 0
acomp_devolutivas_coord     integer DEFAULT 0
atpcs_acomp_coord           integer DEFAULT 0
devolutivas_coord_atpc      integer DEFAULT 0
-- Questões finais
analise_dados               boolean
pauta_formativa             boolean
boas_praticas               text
pontos_preocupacao          text
encaminhamentos             text
outros_pontos               text
created_at                  timestamptz DEFAULT now()
```

- RLS: Seguir padrão de `instrument_responses` (N1 ALL, N2N3 SELECT por programa, N4N5 CRUD por aap_id)
- Inserir registro na `form_config_settings` com `form_key = 'registro_consultoria_pedagogica'` e `programas = {escolas, regionais, redes_municipais}`

### 2. Configuração de Permissões (`src/config/acaoPermissions.ts`)

- Adicionar `'registro_consultoria_pedagogica'` ao type `AcaoTipo` e ao array `ACAO_TIPOS`
- Adicionar em `ACAO_TYPE_INFO` com label "Registro da Consultoria Pedagógica" e ícone `ClipboardList`
- Adicionar em `ACAO_PERMISSION_MATRIX`: N1=CRUD_ALL, N2=CRUD_PRG, N3=CRUD_PRG, N4.1=CRUD_ENT, N4.2=CRUD_ENT, N5=CRUD_ENT, N6-N8=NONE
- Adicionar em `ACAO_FORM_CONFIG`:
  - `eligibleResponsavelRoles`: N2-N5
  - `useResponsavelSelector`: true
  - `requiresEntidade`: true
  - `showSegmento`: false (etapa fica no formulário)
  - `showComponente`: false
  - `showAnoSerie`: false
  - `isCreatable`: true
  - `responsavelLabel`: 'Consultor'

### 3. Formulário do Gerenciamento (`src/components/formularios/ConsultoriaPedagogicaForm.tsx`)

Novo componente React com os campos (R) do documento:
- Participantes da visita (seleção múltipla com "Outros" + caixa de texto)
- Agenda planejada? (Sim/Não)
- Agenda alterada? (Sim/Não) + razões (condicional)
- Ações formativas junto aos professores (10 campos numéricos, 2 condicionais VOAR)
- Ações formativas junto à coordenação (5 campos numéricos)
- Análise de dados? (Sim/Não)
- Pauta formativa? (Sim/Não)
- Boas práticas (textarea, opcional)
- Pontos de preocupação (textarea, opcional)
- Encaminhamentos (textarea, opcional)
- Outros pontos (textarea)

Props: `registroAcaoId`, `escolaId`, `aapId`, `escolaVoar` (para condicionar campos VOAR), `onSuccess`

### 4. Integração na Programação (`ProgramacaoPage.tsx`)

**Cadastro (campos C):**
- Ao selecionar tipo `registro_consultoria_pedagogica`, exibir:
  - Consultor (responsável - já via `useResponsavelSelector`)
  - Data (já existente)
  - Escola (já existente)
  - Etapa de ensino (checkbox múltiplo: EFAI, EFAF, EM) - mapear para campo `segmento` como array
  - Escola do Voar? (Sim/Não)
- Salvar `etapa_ensino` e `escola_voar` em campos extras (usar tags ou campo dedicado na programação)

**Gerenciamento:**
- Ao gerenciar ação do tipo `registro_consultoria_pedagogica`, abrir o `ConsultoriaPedagogicaForm` (similar ao padrão dos formulários REDES/Monitoramento)
- Os campos (C) aparecem pré-preenchidos como leitura
- Os campos (R) são editáveis para preenchimento

### 5. Integração no Registros (`RegistrosPage.tsx`)

- Adicionar o tipo ao fluxo de edição/visualização
- No gerenciamento a partir do Registros, abrir o mesmo `ConsultoriaPedagogicaForm`

### 6. Página de Relatório Dedicada (`src/pages/admin/RelatorioConsultoriaPage.tsx`)

Nova página `/relatorio-consultoria` com:
- **Filtros**: Programa, Ator do Programa, Entidade, Período (data início/fim)
- **Dados agregados**: Totais de consultorias realizadas, quantitativos de ações formativas (somas), percentuais de respostas Sim/Não
- **Tabela detalhada**: Cada consultoria com data, consultor, escola, etapa, status VOAR
- **Exportação PDF**: Usando padrão existente (jsPDF + html2canvas)
- **Envio por e-mail**: Botão que gera PDF e envia via `send-transactional-email` ao destinatário selecionado (e-mail transacional individual, não bulk)

### 7. Navegação e Rotas

- Adicionar rota `/relatorio-consultoria` em `App.tsx`
- Adicionar item no menu lateral (Sidebar.tsx) na seção de relatórios/análises, visível para N1-N5
- Adicionar em `ALLOWED_ROUTES` no `AppLayout.tsx`

### 8. Template de E-mail (Transacional)

- Criar template `consultoria-report` em `_shared/transactional-email-templates/`
- O template recebe os dados filtrados do relatório como HTML renderizado
- Registrar no `registry.ts`

## Detalhamento Técnico

| Arquivo | Alteração |
|---|---|
| SQL Migration | CHECK constraints + tabela `consultoria_pedagogica_respostas` + RLS + form_config_settings |
| `src/config/acaoPermissions.ts` | Novo tipo, permissões, form config |
| `src/components/formularios/ConsultoriaPedagogicaForm.tsx` | Novo formulário com campos (R) |
| `src/pages/admin/ProgramacaoPage.tsx` | Campos (C) no cadastro + abertura do form no gerenciamento |
| `src/pages/admin/RegistrosPage.tsx` | Integração do form na edição/gerenciamento |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Integração do form no fluxo operacional |
| `src/pages/admin/RelatorioConsultoriaPage.tsx` | Nova página de relatório com filtros e PDF |
| `src/components/layout/Sidebar.tsx` | Menu item para relatório |
| `src/components/layout/AppLayout.tsx` | Rota permitida |
| `src/App.tsx` | Nova rota |
| `supabase/functions/_shared/transactional-email-templates/` | Template de e-mail do relatório |

## Observações

- Os campos marcados como (VOAR) nas ações formativas junto aos professores ("turma padrão" e "turma adaptada") aparecem apenas quando "Escola do Voar?" = Sim
- A etapa de ensino (EFAI/EFAF/EM) será mapeada para os segmentos existentes (anos_iniciais/anos_finais/ensino_medio) no campo `segmento` da programação, permitindo compatibilidade com filtros existentes
- O relatório respeita os mesmos filtros de visibilidade por papel (RLS), garantindo que N4/N5 vejam apenas suas consultorias e N2/N3 vejam por programa

