## Diagnóstico

1. **"Relato Objetivo" não aparece no gerenciamento**: o formulário usado em produção é o `InstrumentForm` (genérico), que renderiza os campos a partir da tabela `instrument_fields` filtrando por `form_type='encontro_microciclos_recomposicao'`. Hoje essa tabela tem 18 campos (item_1..item_10, plataforma_*, pontos_fortes, aspectos_fortalecer, encaminhamentos_acordados, proximo_encontro_*), mas **faltam** `relato_objetivo`, `encaminhamentos_prazo`, `encaminhamentos_responsavel` e `ponto_focal_rede`. Por isso esses campos:
   - não aparecem no formulário de gerenciamento,
   - chegam nulos ao PDF (que é alimentado por `instrument_responses`), aparecendo como "—".
   
   Obs.: existe um componente `EncontroMicrociclosForm.tsx` que tem todos esses campos, mas ele **não está sendo usado em lugar nenhum** — o fluxo real é o `InstrumentForm` genérico.

2. **"Prazo" e "Responsável" sendo cortados no PDF**: no `EncontroMicrociclosRecomposicaoPrintSection`, os dois `Field` ficam dentro do mesmo `data-pdf-section="microciclos-encaminhamentos"`, que reúne título + pontos fortes + aspectos + encaminhamentos acordados + prazo + responsável. Quando o bloco inteiro excede a página, o `pdfExport` aciona o slicing genérico e corta exatamente na linha de Prazo/Responsável (último item do bloco).

## Plano

### 1. Adicionar os 4 campos faltantes em `instrument_fields` (migration)

Inserir novas linhas para `form_type = 'encontro_microciclos_recomposicao'`, respeitando ordem lógica:

- `ponto_focal_rede` (text) — junto ao cabeçalho/topo. Como os outros campos de cabeçalho (município, data, formador, horário, local) já são tratados pelo registro_acao no fluxo InstrumentForm, decidir caso a caso: se já são capturados via metadata da ação, registrar **apenas** `ponto_focal_rede` no `instrument_fields` para complementar.
- `relato_objetivo` (textarea, label "Percepções e evidências observadas no encontro") — inserir após `item_10` e antes de `plataforma_acesso`, ajustando `sort_order` dos demais.
- `encaminhamentos_prazo` (text) — após `encaminhamentos_acordados`.
- `encaminhamentos_responsavel` (text) — após `encaminhamentos_prazo`.

Reordenar `sort_order` dos campos posteriores para acomodar as inserções.

### 2. Ajustar print: marcar Prazo/Responsável como blocos próprios

Em `src/components/print/EncontroMicrociclosRecomposicaoPrintSection.tsx`, dividir o bloco "Encaminhamentos" em sub-seções `data-pdf-section` independentes para evitar slicing no meio da linha:

- `microciclos-encaminhamentos-fortes` (Pontos fortes + Aspectos a fortalecer)
- `microciclos-encaminhamentos-acordados` (Encaminhamentos acordados)
- `microciclos-encaminhamentos-prazo-resp` (Prazo + Responsável, juntos numa linha — bloco compacto que sempre cabe)

Manter o `SectionTitle "Encaminhamentos"` apenas no primeiro sub-bloco para preservar identidade visual.

### 3. Sem mudanças necessárias em

- `AcaoPrintDialog.tsx` (já lê `instrument_responses` corretamente; basta os novos campos passarem a ser preenchidos).
- `EncontroMicrociclosForm.tsx` (não está em uso).
- `pdfExport.ts` (a lógica de leaf-sections já funciona; basta marcarmos corretamente).

## Arquivos afetados

- Nova migration SQL para inserir 4 linhas em `instrument_fields` e reordenar `sort_order`.
- `src/components/print/EncontroMicrociclosRecomposicaoPrintSection.tsx` (refatorar bloco Encaminhamentos em 3 sub-seções).

Nenhuma alteração de RLS ou edge function.
