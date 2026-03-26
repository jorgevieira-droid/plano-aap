

# Incluir 5 Novos Instrumentos de Ação (Regionais)

## Resumo dos 5 formulários

| # | Nome | Tipo interno | Mecânica |
|---|------|-------------|----------|
| 1 | Liderança Pedagógica – Gestores PEI | `lideranca_gestores_pei` | 4 dimensões, escala 1-4 com rubricas, campos URE + Escola (entidade_filho) |
| 2 | Monitoramento e Gestão | `monitoramento_gestao` | Público (multi-select), Frente de Trabalho (seleção única), Observação (texto) + campos condicionais PDCA (5 textos extras) — **hardcoded** |
| 3 | Professor Tutor | `acomp_professor_tutor` | 7 dimensões, escala 1-4 com rubricas, campos URE + Escola (entidade_filho) |
| 4 | PEC Qualidade de Aula | `pec_qualidade_aula` | 5 dimensões, escala 1-4 com rubricas |
| 5 | Instrumento de Visita – Projeto VOAR | `visita_voar` | Tipo (PEI/Parcial seleção única), Entrevistados (multi-select Direção/Coordenação), 5 dimensões escala 1-4 com rubricas, campos URE + Escola (entidade_filho) |

## Abordagem escolhida

- **4 formulários dinâmicos** via `instrument_fields` (Liderança PEI, Professor Tutor, PEC Qualidade de Aula, VOAR) — os campos extras (URE, Escola, Tipo, Entrevistados) serão tratados como campos especiais via `metadata` ou `field_type` customizado na tabela `instrument_fields`.
- **1 formulário hardcoded** (Monitoramento e Gestão) — devido à lógica condicional complexa dos campos PDCA.
- **Permissões**: mesmo padrão REDES (N1 CRUD_ALL, N2-N3 CRUD_PRG, N4-N5 CRUD_ENT, N6-N8 sem acesso).

## Alterações

### 1. Migration SQL — Atualizar CHECK constraints + seed instrument_fields

```sql
-- Atualizar constraint de programacoes
ALTER TABLE public.programacoes DROP CONSTRAINT programacoes_tipo_check;
ALTER TABLE public.programacoes ADD CONSTRAINT programacoes_tipo_check CHECK (
  tipo = ANY (ARRAY[... tipos existentes ...,
    'lideranca_gestores_pei', 'monitoramento_gestao', 
    'acomp_professor_tutor', 'pec_qualidade_aula', 'visita_voar'
  ])
);

-- Atualizar constraint de registros_acao  
ALTER TABLE public.registros_acao DROP CONSTRAINT registros_acao_tipo_check;
ALTER TABLE public.registros_acao ADD CONSTRAINT registros_acao_tipo_check CHECK (
  tipo = ANY (ARRAY[... tipos existentes ...,
    'lideranca_gestores_pei', 'monitoramento_gestao',
    'acomp_professor_tutor', 'pec_qualidade_aula', 'visita_voar'
  ])
);

-- Inserir instrument_fields para os 4 formulários dinâmicos
-- (Liderança PEI: 4 dimensões x rubricas, Professor Tutor: 7, PEC: 5, VOAR: 5)
INSERT INTO public.instrument_fields (...) VALUES ...;
```

### 2. `src/config/acaoPermissions.ts`
- Adicionar os 5 novos tipos ao `AcaoTipo`, `ACAO_TIPOS`, `ACAO_TYPE_INFO`
- Adicionar permissões no `ACAO_PERMISSION_MATRIX` (mesmo padrão REDES)
- Adicionar configurações no `ACAO_FORM_CONFIG`

### 3. `src/hooks/useInstrumentFields.ts`
- Adicionar os 4 novos form_types ao `INSTRUMENT_FORM_TYPES`

### 4. Novo componente hardcoded: `src/components/formularios/MonitoramentoGestaoForm.tsx`
- Campos: URE (entidade selecionada), Data, Horário
- Público do Encontro: checkboxes multi-select (Lider Regional, Dirigente, CEC, Supervisor, PEC, Gestão Escolar, Professor)
- Frente de Trabalho: radio group (Semanal Gestão, Governança, Mentoria Dirigente, PDCA, Alinhamento CEC, Imersão em Dados)
- Observação: textarea
- **Condicional PDCA**: quando "PDCA" selecionado, exibe 5 campos texto extras (Temas, Pontos de Atenção, Encaminhamentos, Material Utilizado, Aprendizados)
- Salva dados em JSONB no `registros_acao` (campo observacoes ou via tabela auxiliar)

### 5. Nova tabela para dados do Monitoramento e Gestão
```sql
CREATE TABLE public.relatorios_monitoramento_gestao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL,
  horario time,
  publico text[] NOT NULL,
  frente_trabalho text NOT NULL,
  observacao text,
  pdca_temas text,
  pdca_pontos_atencao text,
  pdca_encaminhamentos text,
  pdca_material text,
  pdca_aprendizados text,
  municipio text NOT NULL,
  status text NOT NULL DEFAULT 'rascunho',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.relatorios_monitoramento_gestao ENABLE ROW LEVEL SECURITY;
-- RLS: autenticados podem gerenciar (mesmo padrão REDES)
```

### 6. `src/pages/aap/AAPRegistrarAcaoPage.tsx`
- Adicionar `monitoramento_gestao` ao set de tipos com formulário dedicado (similar a `REDES_TYPES`)
- Adicionar `MonitoramentoGestaoForm` ao switch de renderização
- Os 4 tipos dinâmicos já são tratados pelo fluxo existente de `INSTRUMENT_TYPE_SET`

### 7. `src/pages/formularios/redesFormShared.tsx` (ou arquivo novo para dados dos Regionais)
- Não será necessário alterar — os dados dos instrumentos dinâmicos ficam na tabela `instrument_fields`

### 8. Integração com `entidade_filho`
- Para os 4 formulários que pedem URE (entidade_pai) + Escola (entidade_filho), o campo de `entidade_filho` será um select cascata opcional dentro do fluxo do instrumento dinâmico
- Isso exige ajuste no `InstrumentForm.tsx` ou na lógica do `AAPRegistrarAcaoPage` para exibir o campo de entidade_filho quando o form_type for um dos 4 novos tipos

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| Migration SQL | CHECK constraints + seed instrument_fields + tabela monitoramento_gestao |
| `src/config/acaoPermissions.ts` | 5 novos tipos, permissões, form config |
| `src/hooks/useInstrumentFields.ts` | 4 novos form_types |
| `src/components/formularios/MonitoramentoGestaoForm.tsx` | **Novo** — formulário hardcoded |
| `src/pages/aap/AAPRegistrarAcaoPage.tsx` | Integrar MonitoramentoGestaoForm + tipos |
| `src/pages/admin/ProgramacaoPage.tsx` | Se necessário, integrar tipos no wizard |

## Dúvidas para confirmação

Tenho uma dúvida antes de implementar:

**Entidade Filho nos formulários dinâmicos**: 4 dos 5 documentos pedem "URE (ENTIDADE_PAI)" e "ESCOLA (ENTIDADE_FILHO)". Atualmente o fluxo de registro já seleciona a entidade (URE) na programação. O campo de **Escola (entidade_filho)** deve ser um select cascata dentro do formulário, filtrando as entidades_filho vinculadas à entidade_pai selecionada? Isso seria a primeira integração real da tabela `entidades_filho` nos formulários.

