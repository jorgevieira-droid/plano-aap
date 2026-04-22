

## Mapeamento de Componente da Aula → filtro de Professores (Apoio Presencial)

### Comportamento atual
No diálogo de cadastro de "Registro de Apoio Presencial" (`ProgramacaoPage.tsx`), o seletor de Professor é filtrado pela `escola_id` + `apoio_etapa`, mas o filtro por componente compara o valor literal de `apoio_componente` (ex.: `"OE LP"`, `"Tutoria MAT"`) com o `componente` do professor (`"lingua_portuguesa"` ou `"matematica"`), o que resulta em lista vazia para qualquer opção exceto "LP" ou "Mat" puros.

### Mudança
Criar um helper local que normaliza o `apoio_componente` para o componente curricular do professor:

```ts
// dentro de ProgramacaoPage.tsx
const apoioComponenteToProfessor = (c?: string): 'lingua_portuguesa' | 'matematica' | null => {
  if (!c) return null;
  if (['LP', 'Tutoria LP', 'OE LP'].includes(c)) return 'lingua_portuguesa';
  if (['Mat', 'Tutoria MAT', 'OE MAT'].includes(c)) return 'matematica';
  return null;
};
```

E aplicar no filtro do dropdown de Professor da seção (C) do Apoio Presencial:

```ts
const compAlvo = apoioComponenteToProfessor(formData.apoio_componente);
const professoresFiltrados = professores.filter(p =>
  p.ativo &&
  p.escola_id === formData.escola_id &&
  (!formData.apoio_etapa || p.ano_serie === formData.apoio_etapa) &&
  (!compAlvo || p.componente === compAlvo)
);
```

### Resultado
- **LP / Tutoria LP / OE LP** → lista os professores com `componente = lingua_portuguesa`.
- **Mat / Tutoria MAT / OE MAT** → lista os professores com `componente = matematica`.
- Sem componente selecionado → mostra todos os professores da escola/etapa.

### Arquivos
- `src/pages/admin/ProgramacaoPage.tsx` — adicionar helper e ajustar filtro do seletor de professor na seção (C) de `registro_apoio_presencial`.

Sem mudanças de banco, permissões ou outros arquivos.

