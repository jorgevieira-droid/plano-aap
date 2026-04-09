

# Nova Ação: Monitoramento de Ações Formativas – Regionais

## Resumo

Criar um novo tipo de ação `monitoramento_acoes_formativas` com formulário hardcoded (similar ao Monitoramento e Gestão), disponível para N1–N5 em todos os programas.

## Campos do Formulário

| Campo | Tipo | Detalhes |
|---|---|---|
| Programa | Pré-selecionado | Baseado no ator |
| Formador | Dropdown | Auto-preenchido para N4+ |
| Data / Horário | Readonly | Herdados da programação |
| Frente de Trabalho/Projeto | Select único | APF – PEC Qualidade de Aula; Jornada PEI; Professor Tutor; VOAR; Multiplica Presencial |
| Público do Encontro | Multi-select | CEC; PEC – Anos Iniciais; PEC – Língua Portuguesa; PEC – Matemática; PEC – Qualidade de Aula; PEC – Multiplica; CGP / CGPG / PAAC; Supervisor(a); Diretor(a); Vice-Diretor(a); Professores(as) |
| Unidade Regional | Entidade (dropdown) | Campo de entidade da programação |
| Local do Encontro | Select único | Online; Regional de Ensino; EFAPE; Escola(s); Outro |
| Escola(s) | Multi-select entidades_filho | Visível apenas se Local = "Escola(s)" |
| Outro (local) | Input texto | Visível apenas se Local = "Outro" |
| Fechamento com encaminhamentos? | Select único | Sim; Parcialmente; Não |
| Principais encaminhamentos | Textarea | Campo de texto longo |

## Alterações

### 1. Migração SQL

- Atualizar CHECK constraints em `programacoes` e `registros_acao` para incluir `'monitoramento_acoes_formativas'`
- Criar tabela `relatorios_monit_acoes_formativas`:

```
id, registro_acao_id (FK), publico (text[]), frente_trabalho (text),
local_encontro (text), local_escolas (text[]), local_outro (text),
fechamento (text), encaminhamentos (text), status (text), created_at
```

- RLS: autenticados podem gerenciar
- Inserir registro em `form_config_settings` com todos os programas

### 2. `src/config/acaoPermissions.ts`

- Adicionar `'monitoramento_acoes_formativas'` ao tipo `AcaoTipo` e ao array `ACAO_TIPOS`
- Adicionar entrada em `ACAO_TYPE_INFO` com label "Monitoramento de Ações Formativas – Regionais" e ícone `ClipboardList`
- Adicionar permissões em `ACAO_PERMISSION_MATRIX`: N1 = CRUD_ALL, N2 = CRUD_PRG, N3 = CRUD_PRG, N4.1 = CRUD_ENT, N4.2 = CRUD_ENT, N5 = CRUD_ENT, N6–N8 = NONE
- Adicionar `ACAO_FORM_CONFIG`: `requiresEntidade: true`, sem segmento/componente/anoSerie, `useResponsavelSelector: true` com roles N2–N5, `responsavelLabel: 'Formador'`

### 3. Componente de Formulário

- Criar `src/components/formularios/MonitoramentoAcoesFormativasForm.tsx`
- Seguir padrão do `MonitoramentoGestaoForm.tsx`
- Campos: público (checkboxes), frente de trabalho (radio), local do encontro (select com lógica condicional para escola(s) e outro), fechamento (radio), encaminhamentos (textarea)
- Para "Escola(s)": buscar `entidades_filho` da entidade selecionada e permitir seleção múltipla

### 4. `src/pages/aap/AAPRegistrarAcaoPage.tsx`

- Importar novo componente
- Adicionar constante e condição (padrão do `isMonitoramentoGestao`)
- Renderizar formulário dentro do Dialog de registro

### 5. Dashboard e Relatórios

Os dados serão automaticamente visíveis via a lógica existente de filtros por programa/entidade, pois o tipo será registrado em `registros_acao` com os campos padrão. Nenhuma alteração adicional é necessária para estes módulos — os cards de execução e gráficos "Por Tipo" já renderizam dinamicamente qualquer tipo presente nos dados.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migração SQL | Novo tipo nos constraints + nova tabela + form_config_settings |
| `src/config/acaoPermissions.ts` | Tipo, info, permissões e config de formulário |
| `src/components/formularios/MonitoramentoAcoesFormativasForm.tsx` | Novo componente |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Integração do novo formulário |

