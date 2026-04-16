

User wants to fix the CHECK constraint issue for ALL action types that might have the same problem, not just `registro_apoio_presencial`. Let me check which types are missing from constraints.

From context: `registro_consultoria_pedagogica` was already mentioned as potentially missing from `registros_acao_tipo_check`. Need to verify all `AcaoTipo` values vs both constraints.

Plan: query the constraints to see exactly which values are listed, compare against `ACAO_TIPOS` array, and add ALL missing ones to both `programacoes_tipo_check` and `registros_acao_tipo_check`.

# Corrigir CHECK constraints para todos os tipos de ação faltantes

## Causa raiz

As CHECK constraints `programacoes_tipo_check` e `registros_acao_tipo_check` listam explicitamente os tipos permitidos. Sempre que um novo tipo é adicionado em `src/config/acaoPermissions.ts` sem atualizar as constraints, o INSERT falha com "Erro ao Criar Programação".

Tipos suspeitos de estarem faltando em pelo menos uma das constraints:
- `registro_apoio_presencial` (faltando em ambas — confirmado)
- `registro_consultoria_pedagogica` (faltando em `registros_acao` — provável)
- Possivelmente outros adicionados recentemente

## Correção

**Migração SQL** que:

1. Consulta todos os tipos atualmente listados em cada constraint
2. Recria ambas constraints com a lista **completa e sincronizada** de todos os tipos do enum lógico do app, incluindo:
   - Todos os tipos já existentes
   - `registro_consultoria_pedagogica`
   - `registro_apoio_presencial`

```sql
ALTER TABLE public.programacoes DROP CONSTRAINT IF EXISTS programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check
  CHECK (tipo = ANY (ARRAY[
    'formacao','visita','acompanhamento_aula','acompanhamento_formacoes',
    'agenda_gestao','autoavaliacao','devolutiva_pedagogica','obs_engajamento_solidez',
    'obs_implantacao_programa','observacao_aula','obs_uso_dados','participa_formacoes',
    'qualidade_acomp_aula','qualidade_implementacao','qualidade_atpcs',
    'sustentabilidade_programa','avaliacao_formacao_participante','lista_presenca',
    'observacao_aula_redes','encontro_eteg_redes','encontro_professor_redes',
    'lideranca_gestores_pei','monitoramento_gestao','acomp_professor_tutor',
    'pec_qualidade_aula','visita_voar','monitoramento_acoes_formativas',
    'registro_consultoria_pedagogica','registro_apoio_presencial'
  ]));

-- Mesma lista aplicada a registros_acao_tipo_check
ALTER TABLE public.registros_acao DROP CONSTRAINT IF EXISTS registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check
  CHECK (tipo = ANY (ARRAY[ ...mesma lista... ]));
```

Antes de executar, vou validar via `supabase--read_query` quais tipos cada constraint contém hoje, garantindo que nenhum valor existente seja removido (apenas adicionados os faltantes).

## Resultado

Após a migração, todos os tipos de ação configurados no app poderão ser criados sem erro de violação de constraint.

