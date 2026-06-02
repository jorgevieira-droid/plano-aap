## Diagnóstico

O PDF anexado saiu praticamente em branco (só o cabeçalho azul, repetido 2x). A causa está em 3 pontos:

1. **`src/lib/pdfExport.ts`** captura apenas elementos marcados com `data-pdf-section` quando algum existe no conteúdo. Hoje, no `ObservacaoAulaGpaPrintSection`, só os blocos de **critério**, **encaminhamentos** e **síntese** têm esse marcador. Como resultado, os blocos **Cadastro**, **Identificação** e o **header/cadastro do `AcaoPrintForm`** (Data, Horário, Escola, Responsável, Status, etc.) são silenciosamente descartados.
2. **`ObservacaoAulaGpaPrintSection`** não renderiza os **níveis (1–4) de cada critério** definidos em `GPA_CRITERIA[i].levels`. O usuário só vê o título e a nota marcada, sem entender o que cada nível significa.
3. **`AcaoPrintDialog.handleExport`** monta o nome do arquivo como `${slug(label)}-${data}.pdf`, sem incluir o nome da rede/entidade.

## Mudanças

### 1. `src/components/print/ObservacaoAulaGpaPrintSection.tsx`
- Adicionar `data-pdf-section="cadastro"` no bloco "Cadastro" (tabela com Município/Data/Escola/Observador/Horário).
- Adicionar `data-pdf-section="identificacao"` no bloco "Identificação" (Professor/Ano/Turma/Qtd/Segmento/Material/Alunos M-F).
- Em cada bloco de critério (já marcado como `data-pdf-section="criterio"`), exibir os **4 níveis da rubrica** logo abaixo do título, com a **nota selecionada destacada** (fundo/borda diferente). Texto pequeno (10–11px) para caber.
- Opcional: adicionar o "Foco" curto (`c.focus`) acima dos níveis para contexto.

### 2. `src/components/print/AcaoPrintForm.tsx`
- Adicionar `data-pdf-section="header-acao"` no `<div>` do header azul.
- Adicionar `data-pdf-section="cadastro-geral"` no grid de Cadastro (Data, Horário, Escola/Entidade, Responsável, Professor, Segmento, Componente, Status).
- Garantir que, quando `isObservacaoGpa`, o bloco de "Campos descritivos" / textos genéricos não duplique conteúdo já vindo do `ObservacaoAulaGpaPrintSection` (atual já está ok — `textFields` fica vazio para GPA).

### 3. `src/components/print/AcaoPrintDialog.tsx`
- No `handleExport`, montar o filename incluindo a rede/entidade:
  ```
  `${slugify(data.acaoLabel)}-${slugify(data.escolaNome)}-${data.programacao.data}.pdf`
  ```
  Ex.: `observacao-de-aula-gpa-rede-municipal-de-araraquara-2026-06-06.pdf`.

## Fora de escopo
- Mexer no `pdfExport.ts` (a abordagem por `data-pdf-section` já é a usada no projeto; basta marcar os blocos que faltam).
- Alterar layout dos PDFs de outros tipos de ação (Microciclos, Alfabetização REDES, instrumento genérico) — não foram solicitados.
- Alterar o formulário de preenchimento do GPA.

## QA
Após implementar, gerar um PDF de uma ação GPA realizada e validar:
- Página 1 mostra header + Cadastro completo + Identificação.
- Cada critério mostra título, foco, 4 níveis (com o selecionado destacado) e a evidência.
- Encaminhamentos e Síntese das Notas presentes.
- Nome do arquivo contém a rede.
