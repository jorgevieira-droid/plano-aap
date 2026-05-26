## Diagnóstico

Em **Registros**, a ação "Visitas Técnicas - Microciclos" usa o tipo interno `observacao_aula_redes`. O fluxo deveria ser:

1. **Pergunta 1**: "A visita aconteceu?" (Sim / Não)
2. Se **Não** → encerra (mantém pendente).
3. Se **Sim** → **Pergunta 2**: "Deseja preencher o checklist?" (Sim / Não)
4. Se **Não** → marca como realizada sem formulário.
5. Se **Sim** → abre o **formulário dedicado `VisitaTecnicaMicrociclosForm`** (com Identificação, Roteiro, Partes 1/2/3 e Observações).

### Problemas no código atual (`src/pages/admin/RegistrosPage.tsx`)

1. **Mecânica perde a dupla confirmação dependendo do status.**
   No `handleOpenManage` (linha ~657) a confirmação só dispara para `status === 'agendada' | 'reagendada'`. Para `prevista`, `realizada` ou outros, o fluxo cai direto em `setIsRedesManaging(true)`, pulando as duas perguntas. Resultado: a "mecânica" não acontece.

2. **Risco de cair no `InstrumentForm` genérico.**
   Como `observacao_aula_redes` também está em `INSTRUMENT_FORM_TYPES`, qualquer caminho que escape do bloco específico cai no check `isInstrumentType` (linha ~679) e abre o **formulário genérico de 9 critérios** (que é o "formulário qualquer" relatado). Hoje o `return` na linha 664 protege, mas qualquer regressão de status quebra isso.

3. **Coerência com Programação.**
   Na página Programação a mesma ação também precisa abrir o formulário dedicado pela mesma mecânica (confirmar realização → confirmar checklist → abrir form).

## Mudanças

### Arquivo: `src/pages/admin/RegistrosPage.tsx`

- **`handleOpenManage`** (bloco do `observacao_aula_redes`):
  - Tratar como **pendente** qualquer status diferente de `realizada` e `cancelada` (inclui `agendada`, `reagendada`, `prevista`, `nao_realizada`).
  - Pendente → `setShowConfirmRedesAconteceu(true)` (dispara mecânica).
  - `realizada` → abrir direto o `VisitaTecnicaMicrociclosForm` (já carrega o relatório existente para edição).
  - Garantir que o `return` continue acontecendo **antes** do check `isInstrumentType`, sem fall-through possível.

- **Dialog `isRedesManaging`** (linha ~2983): manter renderizando `VisitaTecnicaMicrociclosForm` (já está correto).

### Arquivo: `src/pages/admin/ProgramacaoPage.tsx`

- Aplicar a mesma mecânica ao gerenciar `observacao_aula_redes` a partir da Programação (Calendário):
  - Botão "Gerenciar" → pergunta "aconteceu?" → "preencher checklist?" → abre `VisitaTecnicaMicrociclosForm` no mesmo Dialog padrão.
  - Hoje a Programação roteia tipos via `INSTRUMENT_TYPE_SET` (formulário genérico). Para `observacao_aula_redes` adicionar um short-circuit dedicado igual ao de Registros (legacy bespoke já permitido pela política do projeto).

### Verificação

- Não há alterações de banco.
- Tipo `observacao_aula_redes` já gravando em `relatorios_visita_tecnica_microciclos` via o form dedicado (ok).

## Validação após implementação

Pedir ao usuário para testar com uma ação `observacao_aula_redes` em cada estado (`agendada`, `prevista`, `realizada`) tanto em Registros quanto em Programação e confirmar:
- Dupla confirmação aparece em pendentes.
- Formulário aberto é o de Visitas Técnicas Microciclos (Identificação, Roteiro, Partes 1/2/3, Encaminhamentos, Observações gerais) — não o genérico de 9 critérios.

## Pergunta adicional

Se ao gerenciar a ação você vê um **formulário curto com 9 critérios** (Nota 1-4 + Evidência por critério), confirma a hipótese acima. Se for **outro formulário diferente** (ex.: apenas presença, ou um form em branco), me avise para investigar antes de aplicar.
