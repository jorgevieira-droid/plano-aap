## Problema

No formulário **Registro de Consultoria Pedagógica**, os campos de texto (Boas práticas, Pontos de preocupação, Encaminhamentos, Outros pontos, Razões da alteração da agenda, Outros participantes) perdem o foco a cada letra digitada, exigindo um novo clique.

## Causa

Em `src/components/formularios/ConsultoriaPedagogicaForm.tsx`, os subcomponentes `NumberField`, `BoolField` e `TextAreaField` estão **declarados dentro** do componente principal `ConsultoriaPedagogicaForm`. A cada re-render (que acontece a cada tecla digitada, pois o `useState` muda), o React vê esses subcomponentes como tipos novos e desmonta/remonta o input — daí a perda de foco.

## Correção

Mover `NumberField`, `BoolField` e `TextAreaField` para **fora** do componente `ConsultoriaPedagogicaForm` (definir como componentes de módulo, no topo do arquivo). Eles continuarão recebendo `isFieldEnabled` e `isFieldRequired` via props, ou serão refatorados para receber apenas o que precisam (ex.: `required` e `enabled` já avaliados no caller). Abordagem escolhida: extrair como componentes puros que recebem todos os dados via props (`required?: boolean`), e fazer a checagem `isFieldEnabled` no JSX do caller (mais simples e sem closures).

### Arquivo afetado
- `src/components/formularios/ConsultoriaPedagogicaForm.tsx`

### Passos
1. Definir `NumberField`, `BoolField` e `TextAreaField` no escopo do módulo (fora do `export default function`).
2. Ajustar os call sites: substituir `fieldKey` por uma checagem inline `isFieldEnabled('xxx') && <Field ... required={isFieldRequired('xxx')} />`.
3. Verificar visualmente que cada textarea agora aceita digitação contínua sem perder foco.

Sem mudanças de UI, comportamento, schema ou edge functions.
