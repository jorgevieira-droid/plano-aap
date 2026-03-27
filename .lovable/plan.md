
Objetivo

- Garantir que “Monitoramento e Gestão” fique realmente disponível para N1 em toda a aplicação, respeitando a regra de que N1 tem acesso total a formulários e ações.

Diagnóstico

- O RBAC principal já está correto: `monitoramento_gestao` já aparece com `CRUD_ALL` para `admin` em `ACAO_PERMISSION_MATRIX`, e em `ACAO_FORM_CONFIG` ele já está como `isCreatable: true`.
- O problema real não está na permissão N1, mas na ausência de metadados desse formulário no backend:
  - não há registros em `instrument_fields` para `monitoramento_gestao`
  - não há registro em `form_config_settings` para `monitoramento_gestao`
  - não há configs por campo em `form_field_config`
- Por isso, a página “Configurar Formulários” até reconhece o tipo, mas não tem campos reais para exibir/configurar.
- Além disso, a tela usa `.single()` ao buscar `form_config_settings`; quando não existe linha para `monitoramento_gestao`, a API devolve 406, o que combina com o erro interno relatado.

Plano de implementação

1. Popular os metadados do formulário
- Criar uma migration para inserir `monitoramento_gestao` em `form_config_settings`, com programas padrão habilitados e configuração inicial válida.
- Inserir em `instrument_fields` os campos configuráveis do formulário:
  - público do encontro
  - frente de trabalho
  - observação
  - campos de PDCA
- Isso transforma o formulário em um item realmente configurável, e não apenas listado no frontend.

2. Corrigir a leitura da configuração para não gerar erro interno
- Trocar `.single()` por `.maybeSingle()` em:
  - `src/pages/admin/FormFieldConfigPage.tsx`
  - `src/hooks/useFormFieldConfig.ts`
- Se não houver configuração salva, a tela deve assumir fallback seguro em vez de estourar erro.

3. Fazer o formulário real respeitar a configuração
- Atualizar `src/components/formularios/MonitoramentoGestaoForm.tsx` para consumir `useFormFieldConfig('monitoramento_gestao')`.
- Renderizar/ocultar campos conforme a configuração por perfil.
- Manter os blocos informativos fixos (“URE”, “Data”, “Horário”) como contexto de leitura.
- Preservar o comportamento esperado para N1: na ausência de configuração explícita, os campos continuam acessíveis por padrão.

4. Alinhar visualização e configuração
- Ajustar `src/components/instruments/RedesFormPreview.tsx` para espelhar a estrutura final do formulário configurável.
- Confirmar que `MatrizAcoesPage.tsx` continua reconhecendo `monitoramento_gestao` como formulário visualizável.

5. Validar a regra de acesso total do N1
- Revisar filtros extras baseados em metadados/programa para garantir que o N1 não seja excluído desse formulário por regra secundária.
- O princípio final deve ficar consistente: N1 continua vendo e acessando todas as ações e formulários do sistema, inclusive Monitoramento e Gestão.

Arquivos impactados

- `src/pages/admin/FormFieldConfigPage.tsx`
- `src/hooks/useFormFieldConfig.ts`
- `src/components/formularios/MonitoramentoGestaoForm.tsx`
- `src/components/instruments/RedesFormPreview.tsx`
- `supabase/migrations/*`

Resultado esperado

- “Monitoramento e Gestão” aparece corretamente para N1 na Matriz de Ações com botão “Visualizar”.
- O formulário aparece em “Configurar Formulários” com campos reais para configurar.
- O acesso não falha por ausência de metadados.
- A regra “N1 tem acesso a todos os formulários e ações” passa a valer também neste fluxo, sem exceções.
