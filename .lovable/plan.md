# Adicionar Campos Qualitativos aos Formulários REDES

## Problema
Os formulários `Encontro Formativo ET/EG – REDES` (`encontro_eteg_redes`) e `Encontro Formativo Professor – REDES` (`encontro_professor_redes`) são renderizados pelo componente genérico `InstrumentForm`, que lê os campos da tabela `instrument_fields`. Hoje, essa tabela contém apenas os 8 itens de verificação (rating) para cada um desses tipos — sem nenhum campo de texto livre.

Os componentes legados `EncontroETEGRedesForm.tsx` e `EncontroProfessorRedesForm.tsx` (que possuíam os campos qualitativos) não estão importados em nenhum lugar do código atual, então não são usados em produção.

## Solução
Inserir 4 novos registros de `field_type='textarea'` em `instrument_fields` para **cada** um dos dois `form_type`s, dentro de uma nova dimensão `Campos Qualitativos`:

| field_key | label | sort_order |
|---|---|---|
| `relato_objetivo` | Relato Objetivo | 20 |
| `pontos_fortes` | Pontos Fortes | 21 |
| `aspectos_criticos` | Aspectos Críticos | 22 |
| `encaminhamentos` | Encaminhamentos | 23 |

Total: 8 linhas inseridas (4 × 2 form_types). Campos com `is_required = false`.

## Por que isso resolve
- `InstrumentForm` já renderiza `field_type='textarea'` como `<Textarea>` (linhas 121-129 de `InstrumentForm.tsx`).
- As respostas são persistidas no JSONB `instrument_responses.responses`, sem necessidade de novas colunas.
- O agrupamento por `dimension` faz com que os novos campos apareçam num bloco próprio "Campos Qualitativos" logo após os Itens de Verificação.

## Detalhes técnicos
- Migration SQL com `INSERT INTO public.instrument_fields (...)`.
- Sem alterações de código frontend.
- Sem alterações em RLS, tipos ou outras tabelas.

## Fora do escopo
- Reativar os formulários legados `EncontroETEGRedesForm.tsx` / `EncontroProfessorRedesForm.tsx`.
- Alterar PDFs/relatórios (consumirão os novos campos automaticamente via JSON `responses`, mas qualquer renderização específica em PDF pode ser feita em pedido futuro).
