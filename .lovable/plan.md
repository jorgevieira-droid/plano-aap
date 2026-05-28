# Corrigir impressão do PDF — Visitas Técnicas - Microciclos

## Diagnóstico

O fluxo de impressão (botão "Imprimir formulário" na Programação/Calendário) usa `AcaoPrintDialog` → `AcaoPrintForm`, que monta o PDF assumindo um instrumento genérico vindo da tabela `instrument_fields` + alguns ramos especiais (`observacao_aula`, `registro_consultoria_pedagogica`, `observacao_aula_redes`, `registro_apoio_presencial`).

A ação `visita_tecnica_microciclos` **não usa esse padrão genérico**: ela tem formulário próprio (`VisitaTecnicaMicrociclosForm`) e tabela própria `relatorios_visita_tecnica_microciclos` com ~40 campos (cadastro estendido, Parte 1 — gestão; Parte 2 — observação de aula com 6 rubricas q17–q22 nota+evidência; Parte 3 — devolutiva A/B/C; observações gerais).

Como nenhum branch trata esse `form_type`, o PDF sai praticamente vazio: aparece só o bloco de "Cadastro" padrão e nada do instrumento real.

## O que será feito

Adicionar suporte completo a `visita_tecnica_microciclos` no fluxo de impressão, sem mexer no formulário em si nem em qualquer lógica de cadastro/registro.

### 1. `AcaoPrintDialog.tsx`
- Novo branch: quando `formType === 'visita_tecnica_microciclos'` e existir `registroId`, carregar a linha da tabela `relatorios_visita_tecnica_microciclos` por `registro_acao_id`.
- Passar essa linha como nova prop `visitaMicrociclos` para o `AcaoPrintForm` (em vez de tentar mapear para `responses` genéricas).
- Quando não existir registro (ação ainda não realizada), passar `null` para que o formulário em branco seja renderizado.

### 2. `AcaoPrintForm.tsx`
- Aceitar nova prop opcional `visitaMicrociclos`.
- Quando `programacao.tipo === 'visita_tecnica_microciclos'`, **não** renderizar o bloco genérico "Instrumento" (que usaria `fields` vazios) e renderizar um bloco dedicado com:
  - Cadastro complementar: Município, Escola, Pessoa que acompanhou, Professor observado, Nº da visita, Partes da visita.
  - Parte 1 — Gestão da implementação (q1–q10) com rótulos e opções já existentes no form (organização, início, 3 encontros, modelos de agrupamento + "Outro", anos escolares, nº turmas, nº estudantes, material suficiente, registros, tempo formativo).
  - Parte 2 — Observação de aula: q11–q16 + as 6 rubricas q17–q22 (pergunta, foco, escala 1–4 com a opção selecionada destacada, descrição do nível, e campo de evidência).
  - Parte 3 — Devolutiva: blocos A/B/C (pontos fortes, aspectos a fortalecer, encaminhamentos) + Observações gerais.
- Para preencher os rótulos/opções, reaproveitar as constantes (`PARTES_VISITA`, `Q1_OPCOES`, `Q4_OPCOES`, `Q5_OPCOES`, `Q9_OPCOES`, `Q10_OPCOES`, `Q14_OPCOES`, `Q15_OPCOES`, `Q16_OPCOES`, `RUBRICAS`) extraindo-as para um módulo compartilhado `src/components/formularios/visitaTecnicaMicrociclosConstants.ts` e importando tanto no formulário quanto no print (sem mudar comportamento do form).
- Modo "em branco" (sem `visitaMicrociclos`): renderizar a mesma estrutura com campos de preenchimento (linhas tracejadas, checkboxes vazios para opções múltiplas e bolinhas 1–4 vazias para rubricas), idêntico ao padrão já usado no `renderResponseValue`.

### 3. Layout / PDF
- Usar `data-pdf-section` em Cadastro, Parte 1, Parte 2 e Parte 3 para que `exportSectionsToPdf` quebre página entre seções e o conteúdo não saia cortado (segue padrão Bússola já existente).

## Arquivos

- `src/components/print/AcaoPrintDialog.tsx` — carregar `relatorios_visita_tecnica_microciclos` e passar prop nova.
- `src/components/print/AcaoPrintForm.tsx` — render dedicado para `visita_tecnica_microciclos`.
- `src/components/formularios/visitaTecnicaMicrociclosConstants.ts` — **novo**, com as constantes/rubricas reaproveitadas.
- `src/components/formularios/VisitaTecnicaMicrociclosForm.tsx` — apenas substituir constantes locais pelos imports do módulo novo (sem mudança funcional).

## Ganhos / Perdas / Riscos

- **Ganhos:** PDF passa a refletir 100% do formulário real, tanto em branco quanto preenchido; padroniza print das ações com tabelas próprias.
- **Perdas:** Nenhuma — apenas adiciona suporte.
- **Riscos:** Baixo. Mudanças isoladas no fluxo de print; extração de constantes é refator mecânico coberto por TypeScript.

Confirma que sigo com esse plano?
