## Contexto
Dois formulários precisam de um novo dropdown opcional, com persistência em novo campo do banco:

1. **Encontro Formativo Professor – REDES** (`EncontroProfessorRedesForm.tsx` → tabela `relatorios_professor_redes`).
2. **Visitas Técnicas – Microciclos** (`VisitaTecnicaMicrociclosForm.tsx` → tabela `relatorios_visita_tecnica_microciclos`).

Obs.: o REDES já possui o campo obrigatório `componente_curricular` (LP/Mat). O novo campo será nomeado `componente_formacao_redes` para deixar claro que é independente do existente.

## Mudanças no banco (uma migration)

```sql
ALTER TABLE public.relatorios_professor_redes
  ADD COLUMN componente_formacao_redes text;

ALTER TABLE public.relatorios_visita_tecnica_microciclos
  ADD COLUMN numero_visita text;
```

Ambos opcionais (nullable), sem CHECK constraint.

## Mudanças no frontend

### 1. `EncontroProfessorRedesForm.tsx`
- Adicionar `componente_formacao_redes: z.string().optional()` ao schema.
- Adicionar `<FormField name="componente_formacao_redes">` (Select shadcn) no card "Identificação", logo após `componente_curricular`, label "Componente", com itens:
  - Não se aplica
  - Polivalente
  - Língua Portuguesa
  - Matemática
- Enviar `componente_formacao_redes: values.componente_formacao_redes || null` no payload.

### 2. `VisitaTecnicaMicrociclosForm.tsx`
- Adicionar `numero_visita: z.string().optional()` ao schema.
- Adicionar `<FormField name="numero_visita">` (Select) no card de Identificação, label "Nº da Visita", com itens:
  - Não se aplica
  - Visita 1 … Visita 10
- Enviar `numero_visita: values.numero_visita || null` no upsert.

## Arquivos afetados
- `supabase/migrations/<timestamp>_add_componente_formacao_redes_e_numero_visita.sql`
- `src/components/formularios/EncontroProfessorRedesForm.tsx`
- `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`

## Ganhos / Perdas / Riscos
- **Ganhos:** Captura informação adicional pedida; nome explícito evita confusão com `componente_curricular`.
- **Perdas:** Nenhuma significativa.
- **Riscos:** Baixo — colunas nullable, sem alteração de RLS.