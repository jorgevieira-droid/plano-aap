# Reunião Mensal N1 — "Reuniões coordenação" vindo do relatório correto

## Correção
No painel **Reunião Mensal N1 (PRG Escolas)** (`src/pages/admin/ReuniaoMensalEscolasPage.tsx`), o indicador **"Reuniões coordenação"** (Painel geral, seção 1) passa a contar **somente os registros do tipo `registro_apoio_coordenador`** — a ação **"Reunião com a coordenação"**, cujo relatório é o **"Relatório – Reunião com a coordenação"**.

- Hoje (linha ~181): soma `registro_consultoria_pedagogica` (Apoio Presencial com a Coordenação / Formação do Coordenador) **+** `registro_apoio_coordenador`.
- Depois: `of('registro_apoio_coordenador').length` apenas. Registros de Apoio Presencial com a Coordenação deixam de ser contados nesse indicador.

Sem mudanças no banco, nos filtros, no PDF ou nas demais seções do painel.
