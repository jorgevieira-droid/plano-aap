# Corrigir contagens por componente em "Visualização — Registro de Apoio Presencial"

## Diagnóstico

Em `ProgramacaoPage.tsx` o campo `apoio_componente` aceita os seguintes valores:
`"LP"`, `"Mat"`, `"OE MAT"`, `"OE LP"`, `"Tutoria MAT"`, `"Tutoria LP"`, `"Polivalente"`, `"Não se Aplica"`.

Em `RelatorioApoioPresencialPage.tsx` (linhas 82-99) a contagem atual usa apenas `apoio_componente.toLowerCase().includes('mat'|'port'|'lp'|'lingua')` e tenta separar OE através de `apoio_etapa`. Isso faz com que:
- `"OE MAT"` seja contado como MAT (e OE só se a etapa contiver "oe"/"orient").
- `"OE LP"` seja contado como LP.
- `"Tutoria MAT"` seja contado como MAT.
- `"Tutoria LP"` seja contado como LP.
- `"Polivalente"` nunca seja contado.

## Correção em `src/pages/admin/RelatorioApoioPresencialPage.tsx`

1. **`totals`**: substituir a heurística por igualdade direta com `apoio_componente` (case-insensitive, trim):
   - `MAT` ← `"Mat"`
   - `LP` ← `"LP"`
   - `OE MAT` ← `"OE MAT"`
   - `OE LP` ← `"OE LP"`
   - `Tutoria MAT` ← `"Tutoria MAT"` (novo)
   - `Tutoria LP` ← `"Tutoria LP"` (novo)
   - `Polivalente` ← `"Polivalente"` (novo)
   - `Total` continua somando todos os registros filtrados.
   - Demais métricas (devolutiva, obs c/ coord., VOAR padrão/adaptada) permanecem inalteradas.

2. **`chartData`**: incluir os 3 novos cards/barras (Tutoria MAT, Tutoria LP, Polivalente) na mesma ordem dos componentes.

3. **Excel (`Resumo`)**: herdado automaticamente de `chartData`.

## Fora do escopo

- Sem mudanças em schema, RLS, query ou formulário de coleta.
- Sem alteração na lógica de Top/Bottom 3 ou de médias.
