# Corrigir erro do check constraint e prevenir recorrência

## Problema
Ao criar uma programação do tipo `visita_tecnica_alfabetizacao`, o Postgres rejeita o INSERT porque o CHECK constraint `programacoes_tipo_check` (e provavelmente o equivalente em `registros_acao`) ainda não inclui o novo valor. Esse mesmo erro já aconteceu em ações anteriores — é uma falha de processo na inclusão de novos tipos.

## Correção imediata

1. **Migração SQL** ajustando os CHECK constraints para incluir `visita_tecnica_alfabetizacao`:
   - `programacoes.programacoes_tipo_check`
   - `registros_acao.registros_acao_tipo_check` (se existir, mesmo padrão)
   - Estratégia: inspecionar a definição atual via `pg_get_constraintdef`, DROP + ADD CONSTRAINT mantendo todos os valores antigos + o novo.

2. **Validação pós-migração**: criar uma Programação do tipo Visita Técnica — Alfabetização na rota `/programacao` e confirmar persistência sem erro 23514.

## Prevenção (documentação + checklist)

Atualizar `mem://features/action-types/visita-tecnica-alfabetizacao` e criar uma nova memória `mem://process/new-action-type-checklist` com a sequência obrigatória ao introduzir QUALQUER novo `AcaoTipo`:

```text
Checklist obrigatório ao adicionar um novo tipo de ação
1. SQL: incluir o novo valor em TODOS os CHECK constraints de tipo:
   - programacoes_tipo_check
   - registros_acao_tipo_check
   - quaisquer outras tabelas com coluna `tipo` restrita
2. SQL: criar a tabela `relatorios_<tipo>` (se aplicável) com GRANTs + RLS + policies
3. Config: src/config/acaoPermissions.ts
   - AcaoTipo (union)
   - ACAO_TIPOS
   - ACAO_TYPE_INFO (label PT-BR)
   - ACAO_PERMISSION_MATRIX
   - ACAO_FORM_CONFIG
4. Hooks: useInstrumentFields + useInstrumentChartData
5. instrument_fields: seed das questões/dimensões
6. form_config_settings: habilitar nos programas (escolas/redes/regionais)
7. Páginas: ProgramacaoPage + RegistrosPage (Matriz de Ações + Configurar Formulário)
8. Atualizar mem://index.md
9. Teste manual: criar Programação do novo tipo em /programacao e abrir o gerenciamento em /registros
```

Adicionar referência ao checklist como **Core rule** no `mem://index.md`:
> Novo `AcaoTipo` exige atualização dos CHECK constraints `programacoes_tipo_check` e `registros_acao_tipo_check` ANTES de qualquer teste no front. Seguir `mem://process/new-action-type-checklist`.

## Detalhes técnicos
- A migração SQL precisa rodar antes de qualquer novo teste no front; o front já está pronto e quebra exatamente nesse INSERT.
- Não há alteração de UI necessária para essa correção.
