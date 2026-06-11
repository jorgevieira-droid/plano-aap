
## Diagnóstico

O pipeline de impressão (`AcaoPrintDialog` → `AcaoPrintForm`) só conhece um conjunto fixo de tipos. Quando um novo `AcaoTipo` usa **tabela dedicada** (não `instrument_responses`), o dialog não busca os dados e o form não tem um bloco para renderizá-los — o PDF sai em branco.

Situação atual por tipo reportado:

| Tipo | Armazenamento | Estado da impressão |
|---|---|---|
| `visita_tecnica_alfabetizacao` | tabela própria `relatorios_visita_tecnica_alfabetizacao` | Sem fetch, sem print section → **PDF em branco** |
| `visita_tecnica_tarl` | tabela própria `relatorios_visita_tecnica_tarl` | Sem fetch, sem print section → **PDF em branco** |
| `visita_tecnica_secretaria_sme` | `instrument_responses` (24 campos seedados) + cadastro extra em `programacoes` (`nucleo_departamento`, `observador_nome`) | Genérico funciona, mas o cadastro extra do SME não aparece no PDF (e, se o usuário ainda não preencheu o instrumento, sai em branco — comportamento esperado) |

## O que será feito

### 1. Visita Técnica — Alfabetização (Escolas/Redes/Regionais)

Criar `src/components/print/VisitaTecnicaAlfabetizacaoPrintSection.tsx` com:
- Identificação (Município, Escola, Técnico, Horários, Data).
- Caracterização da turma (Ano, Turma, Nível IAB, Segmento, Qtd. estudantes, Alunos M/F, Material Didático IAB em checkboxes).
- Bloco "Legenda das Rubricas" (1–4).
- 8 critérios agrupados nas dimensões D1–D4 (a partir de `CRITERIOS_ALFABETIZACAO`): pergunta, foco, 4 níveis descritivos, rádios 1–4 marcando a nota, evidência preenchida ou linhas em branco.
- Tratamento especial de Q4 com `q4_nao_se_aplica = true` ("Não se aplica à rede" no lugar da nota).
- Observações gerais.
- Cada bloco com `data-pdf-section` para quebra de página.

### 2. Visita Técnica — T@RL

Criar `src/components/print/VisitaTecnicaTarlPrintSection.tsx` análogo, usando os critérios e o cadastro definidos em `visitaTecnicaTarlShared.ts`, lendo da tabela `relatorios_visita_tecnica_tarl`.

### 3. AcaoPrintDialog.tsx

Adicionar, no mesmo padrão de 3 camadas já usado para `visita_tecnica_alfabetizacao_redes`:

- Quando `formType === 'visita_tecnica_alfabetizacao'`: buscar em `relatorios_visita_tecnica_alfabetizacao` (por `registro_acao_id` → `programacao_id` → `escola_id`+`data`+`tipo`) e expor `visitaAlfabetizacaoEscola`.
- Quando `formType === 'visita_tecnica_tarl'`: buscar em `relatorios_visita_tecnica_tarl` e expor `visitaTarl`.
- Para `visita_tecnica_secretaria_sme`: garantir que o `programacao` carregado inclua os campos extras (`nucleo_departamento`, `observador_nome`) já presentes na tabela `programacoes` para o cadastro do PDF.
- Aviso "PDF em branco" quando `status === 'realizada'` mas o relatório não foi encontrado, replicando o aviso já existente para a variante REDES.

### 4. AcaoPrintForm.tsx

- Importar as duas novas seções; novas props `visitaAlfabetizacaoEscola` e `visitaTarl`.
- Flags `isVisitaAlfabetizacaoEscola` e `isVisitaTarl` que renderizam o componente dedicado.
- Excluir esses dois tipos do fallback genérico (`!isVisitaAlfabetizacaoEscola && !isVisitaTarl && ...`).
- Bloco de cadastro adicional para `visita_tecnica_secretaria_sme` (Núcleo/Departamento, Observador) — espelhando o que já existe para `registro_apoio_presencial`.

### 5. Checklist e memória (prevenção)

Atualizar `mem://process/new-action-type-checklist` adicionando um passo obrigatório:

> **Impressão (PDF):** se o tipo usa tabela dedicada `relatorios_<tipo>` (fora de `instrument_responses`), criar `src/components/print/<Tipo>PrintSection.tsx` e ligar no `AcaoPrintDialog` (fetch da tabela) + `AcaoPrintForm` (flag + render + exclusão do fallback genérico). Caso o tipo grave campos extras no `programacoes` (ex.: SME → `nucleo_departamento`, `observador_nome`), expô-los no bloco de cadastro do `AcaoPrintForm`. Validar abrindo "Imprimir formulário da ação" antes de fechar a tarefa.

E uma Core rule curta em `mem://index.md`:

> Novo `AcaoTipo` com tabela dedicada exige `PrintSection` + fetch em `AcaoPrintDialog` + flag em `AcaoPrintForm`. Validar PDF antes de encerrar.

## Validação

- Programação `visita_tecnica_alfabetizacao` realizada → PDF traz cadastro, legenda, 8 rubricas (com Q4 N/A respeitada) e observações.
- Programação `visita_tecnica_tarl` realizada → PDF traz cadastro e rubricas da T@RL.
- Programação `visita_tecnica_secretaria_sme` realizada → PDF traz cadastro extra (Núcleo, Observador) + instrumento genérico de 24 questões.
- Programação ainda **não** realizada de cada tipo → PDF traz estrutura em branco corretamente; aviso "PDF em branco" aparece quando aplicável.

## Detalhes técnicos

- Sem migrações de banco; apenas frontend.
- Sem mudanças nos formulários de cadastro/registro.
- Padrão de fetch idêntico ao já usado para `visita_tecnica_alfabetizacao_redes` (com `pickBest` priorizando `status='enviado'` e `updated_at`).
- Todos os blocos novos usam `data-pdf-section` para `pdfExport.ts` quebrar páginas sem cortar conteúdo.
