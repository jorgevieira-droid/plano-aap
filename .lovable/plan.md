## Problema

O formulário "Visita Técnica - Microciclos" usa campos em camelCase (`encA_pontos_fortes`, `encA_aspectos_fortalecer`, etc.), mas as colunas no banco estão em minúsculo (`enca_pontos_fortes`, `enca_aspectos_fortalecer`, ...). No `upsert`, o PostgREST não encontra `encA_aspectos_fortalecer` no schema e dispara o erro.

## Correção

Editar **`src/components/formularios/VisitaTecnicaMicrociclosForm.tsx`**:

1. Adicionar dois helpers locais:
   - `toDbKey(k)` — converte `encA_` → `enca_`, `encB_` → `encb_`, `encC_` → `encc_` (mantém o restante).
   - `fromDbKey(k)` — inverso, para reidratar o form a partir do registro existente.

2. Em `persist()`: antes do upsert, transformar `payload` reescrevendo as 9 chaves `enc[A|B|C]_*` para minúsculo (`enca_*`, `encb_*`, `encc_*`).

3. No `useEffect` que carrega `existing` (linhas 297-305): ler de `existing.enca_pontos_fortes` etc., em vez de `existing.encA_pontos_fortes` (que sempre vinha `undefined`, motivo pelo qual a edição abria em branco).

4. Em `AcaoPrintDialog.tsx` / `VisitaMicrociclosPrintSection.tsx`: o componente de impressão já aceita os dois formatos (conforme ajuste anterior), então nada muda lá.

Não há alteração de schema nem de outras telas — apenas o mapeamento de chaves dentro do form.
