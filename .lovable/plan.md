# Ajuste de PDFs de Programação/Calendário

## 1. Nome do arquivo PDF

Atualmente em `src/components/print/AcaoPrintDialog.tsx` (linha 182) o arquivo é salvo como:

```
acao-${programacao.tipo}-${programacao.data}.pdf
```

Isso gera nomes como `acao-observacao_aula_redes-...pdf` mesmo quando a ação é "Visita Técnica - Microciclos".

**Mudança:** usar o rótulo amigável da ação (`data.acaoLabel`), com slug seguro (sem acentos, espaços viram `-`, minúsculo):

```
${slug(acaoLabel)}-${programacao.data}.pdf
// ex.: visita-tecnica-microciclos-2026-05-28.pdf
```

Adiciono uma pequena função `slugify` local em `AcaoPrintDialog.tsx` (sem nova dependência).

## 2. Cortes de perguntas no PDF

Hoje `src/lib/pdfExport.ts` recebe **um único nó** por seção, renderiza em um canvas gigante e o fatia em pedaços de altura fixa (`sourceSliceHeight`). Isso quebra perguntas no meio (ex.: Q8 da imagem anexa).

`VisitaMicrociclosPrintSection.tsx` já marca 4 blocos com `data-pdf-section` (Identificação, Parte 1, Parte 2, Parte 3), mas o exportador ignora esses marcadores.

**Mudanças em `src/lib/pdfExport.ts`:**

- Após renderizar o container, procurar descendentes com `[data-pdf-section]`.
- Se houver, capturar **cada um** com `html2canvas` individualmente em vez do container inteiro.
- Para cada bloco:
  - Se cabe na página atual → desenha em sequência (com pequeno gap).
  - Se não cabe → `pdf.addPage()` e desenha no topo da nova página.
  - Se o bloco sozinho é maior que uma página → mantém o fallback atual de fatiamento (apenas como último recurso).
- Se não houver `[data-pdf-section]` no container, mantém o comportamento atual (fatiamento) — preserva os demais PDFs do app.

**Mudanças em `src/components/print/VisitaMicrociclosPrintSection.tsx`:**

- Adicionar `data-pdf-section` em torno de cada **pergunta** (q1…q22) e cada **rubrica** dentro da Parte 2, e em torno dos blocos A/B/C/Observações da Parte 3. Os marcadores existentes nas Partes 1/2/3 viram títulos com `data-pdf-section` no próprio título + grupo seguinte, mas o exportador opera no nível mais granular: cada pergunta é uma unidade indivisível.
- Resultado: perguntas longas (q4, q10, q17–q22) sempre vão inteiras para a próxima página em vez de serem cortadas.

## 3. Arquivos alterados

- `src/components/print/AcaoPrintDialog.tsx` — nome do arquivo via `slugify(acaoLabel)`.
- `src/lib/pdfExport.ts` — captura por `[data-pdf-section]` quando presente; fallback ao slicing atual.
- `src/components/print/VisitaMicrociclosPrintSection.tsx` — marcar cada pergunta/rubrica/bloco como `data-pdf-section`.

## Ganhos / Perdas / Riscos

- **Ganhos:** nome do PDF reflete a ação; nenhuma pergunta é cortada na "Visita Técnica - Microciclos".
- **Perdas:** páginas podem ter mais espaço em branco no fim (esperado — é o custo de não cortar perguntas).
- **Riscos:** baixo. O fallback de slicing preserva os demais PDFs (Evolução do Professor, Relatórios) que não usam `data-pdf-section` ou usam apenas no nível de seção grande.

Confirma para eu implementar?
