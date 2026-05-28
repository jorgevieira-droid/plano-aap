## Objetivo

1. **Impedir** o cadastro/edição de ação ou evento com data fora do padrão (ex.: "25/05/6" → ano 0006, gerando "737792 dias" de atraso) e avisar o usuário com mensagem clara quando isso acontecer.
2. **Excluir** os registros já existentes que estão com data inválida.

## Causa

Os campos `<input type="date">` aceitam anos absurdos (ex.: ano 6 → `0006-05-25`). Hoje só validamos se a data está vazia, então uma data com ano inválido passa, quebra os cálculos de atraso e a renderização.

## Parte 1 — Prevenção (validação nos formulários)

### Helper de validação de data
Criar uma função utilitária simples (em `src/lib/utils.ts`) que recebe a string `YYYY-MM-DD` e retorna se é válida e dentro de uma faixa de anos razoável (2000 a 2100). Retorna `false` para datas vazias, malformadas ou com ano fora da faixa.

### `src/pages/admin/ProgramacaoPage.tsx`
- No `handleSubmit` (~linha 1285): após a checagem de data vazia, validar a faixa. Se inválida, `toast.error("Data inválida. Informe uma data entre 2000 e 2100.")` e `return`.
- Adicionar `min="2000-01-01"` e `max="2100-12-31"` ao input de data (~linha 3405) e aos demais inputs `type="date"` de data de ação/reagendamento (~linhas 4717, 4804).

### `src/pages/admin/RegistrosPage.tsx`
- No `handleSaveEdit` (~linha 1115): após a checagem de data vazia, validar a faixa com o mesmo helper. Se inválida, `toast.error("Data inválida. Informe uma data entre 2000 e 2100.")` e `return`.
- Adicionar `min`/`max` ao input de data (~linha 2520).

## Parte 2 — Limpeza dos dados existentes (exclusão)

Foram localizados **2 registros** com data inválida (`0006-05-26`), ambos do tipo `registro_apoio_presencial`, criados em 26/05/2026:

| Tabela | ID | Data | Status |
|--------|----|------|--------|
| `programacoes` | `ebd69418-291e-416c-b5de-88adff482d58` | 0006-05-26 | prevista |
| `registros_acao` | `874f2fe6-0c35-4ab1-babf-04629ab87174` | 0006-05-26 | agendada |

Excluir os registros com data fora da faixa válida em ambas as tabelas:

```sql
DELETE FROM public.registros_acao WHERE data < '2000-01-01' OR data > '2100-12-31';
DELETE FROM public.programacoes   WHERE data < '2000-01-01' OR data > '2100-12-31';
```

- A exclusão em `registros_acao` será registrada automaticamente no histórico de alterações pelo trigger existente.
- Após a exclusão, a tela de Registros deixará de exibir o atraso absurdo.

## Fora de escopo
- Sem mudanças de schema do banco (a coluna `data` já é `NOT NULL`).
- Sem alterações de layout além dos atributos `min`/`max`.

## Detalhe técnico
A faixa 2000–2100 cobre todos os usos reais e bloqueia entradas como ano 6, ano 20, etc. O `<input type="date">` permite digitar anos curtos; a validação no submit é a barreira definitiva, e os atributos `min`/`max` melhoram o feedback imediato.
