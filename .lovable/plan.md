## Plano

1. **Corrigir o vínculo dos dados preenchidos ao PDF**
   - Ajustar `AcaoPrintDialog.tsx` para buscar o relatório preenchido da Visita Técnica por múltiplas chaves seguras, não apenas por `registro_acao_id`.
   - Prioridade da busca:
     1. relatório ligado ao `registro_acao_id` da programação;
     2. relatório ligado a outro registro da mesma ação/programação, quando houver duplicidade;
     3. relatório da mesma data + mesmo responsável/formador, quando o formulário foi salvo em um registro diferente.
   - Isso evita PDF em branco quando o formulário foi preenchido, mas ficou salvo em um registro não selecionado pelo botão de impressão.

2. **Normalizar nomes de campos da devolutiva**
   - Garantir que o print aceite tanto os nomes atuais do banco (`enca_*`, `encb_*`, `encc_*`) quanto os nomes camelCase usados originalmente no formulário (`encA_*`, `encB_*`, `encC_*`).
   - Isso corrige campos descritivos que podem estar salvos, mas não aparecem por diferença de nomenclatura.

3. **Melhorar mensagens quando não houver dados preenchidos**
   - Se não existir relatório preenchido para aquela ação, o PDF continuará gerando o formulário em branco, mas a tela avisará que não encontrou preenchimento específico da Visita Técnica.
   - Assim o usuário diferencia “formulário realmente não preenchido” de “falha ao carregar preenchimento”.

4. **Manter o ajuste de não cortar perguntas**
   - Preservar a exportação por blocos `data-pdf-section` já adicionada.
   - Revisar apenas se algum bloco muito grande ainda estiver sendo fatiado de forma inadequada.

## Detalhes técnicos

- Arquivos principais:
  - `src/components/print/AcaoPrintDialog.tsx`
  - `src/components/print/VisitaMicrociclosPrintSection.tsx`
- Não será necessário alterar estrutura do banco neste ajuste.
- A causa provável é que a impressão pega o primeiro `registro_acao` da programação, mas os dados preenchidos podem estar salvos em outro registro/relatório relacionado; por isso o layout aparece, mas os campos ficam vazios.