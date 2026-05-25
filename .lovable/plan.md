## Causa raiz

No arquivo `src/pages/admin/RegistrosPage.tsx`, a query que carrega a lista de professores (linha 398) **não inclui o campo `turma_formacao`**:

```ts
supabase.from('professores')
  .select('id, nome, escola_id, segmento, componente, cargo, ano_serie')
  .eq('ativo', true)
```

Porém, na função `getAvailableProfessors` (linha 577), para encontros REDES — incluindo `encontro_microciclos_recomposicao` — o filtro compara:

```ts
if (isEncontro && turmaFormacao && (p as any).turma_formacao !== turmaFormacao) return false;
```

Como o campo nunca foi selecionado, `p.turma_formacao` é sempre `undefined`. Assim, para qualquer programação com `turma_formacao` definido (ex.: "Turma A", "Turma B"), **todos os professores são filtrados fora** → diálogo aparece com `0/0` e "Nenhum professor encontrado para este segmento".

Na página **Programação** o problema não existe porque ela faz uma query dedicada (linhas 1784-1794) que seleciona `turma_formacao` e filtra via `.in()` direto no banco.

## Onde o bug aparece

Atinge os 3 tipos de ação REDES com turma de formação:
- `encontro_microciclos_recomposicao` (Microciclos de Recomposição) — caso reportado
- `encontro_professor_redes`
- `encontro_eteg_redes`

Sempre que gerenciados pela aba **Registros** e a programação tiver `turma_formacao` preenchido.

Outras telas (`AdminDashboard`, `HistoricoPresencaPage`, `RelatoriosPage`) não são afetadas — ou pegam a turma do lado de `programacoes`, ou não filtram por ela.

## Correção

Alterar uma única linha em `src/pages/admin/RegistrosPage.tsx` (linha 398) para incluir `turma_formacao` no `select`:

```ts
.select('id, nome, escola_id, segmento, componente, cargo, ano_serie, turma_formacao')
```

Nenhuma outra mudança é necessária: o tipo `Professor` local (linha ~120) já declara `turma_formacao: string | null` e a lógica de filtro já está pronta para usar.

## Validação

- Abrir um registro de `encontro_microciclos_recomposicao` da Rede Municipal de Santos (Turma A ou B) pela aba **Registros** → "Gerenciar Presenças" deve listar os 9 professores da Turma B (ou 8 da Turma A), em vez de 0/0.
- Verificar que os tipos `encontro_professor_redes` e `encontro_eteg_redes` continuam funcionando como antes (passam a respeitar a turma também via esse caminho, caso já estivesse com problema).
