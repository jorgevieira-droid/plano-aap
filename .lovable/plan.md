

## Adicionar dropdown "Ano/Série" no agendamento de "Observação de Aula – REDES"

### Contexto
Hoje a ação `observacao_aula_redes` no agendamento mostra apenas o campo **Turma** (A–H) e grava `ano_serie = 'todos'` por padrão. O pedido é incluir um dropdown obrigatório de **Ano/Série** com valores fixos: `1º ano … 9º ano`. Registros existentes (`programacoes` e `registros_acao` com `tipo = 'observacao_aula_redes'` e `ano_serie = 'todos'`) serão atualizados para `'1º ano'`.

### O que será alterado

**1. Formulário de agendamento (`src/pages/admin/ProgramacaoPage.tsx`)**
- Logo acima do bloco "Turma" (linha ~2644), adicionar novo bloco condicional para `observacao_aula_redes` com select **Ano/Série \***, opções fixas `["1º ano","2º ano",…,"9º ano"]`, ligado a um novo state `formAnoSerieRedes` (ou reaproveitar `formData.anoSerie`).
- Na montagem do `insertData` (linha ~1033), quando o tipo for `observacao_aula_redes`, usar esse valor em `ano_serie` em vez de `'todos'`. Idem no INSERT de `registros_acao` (linha ~1100).
- Resetar o campo no `setFormData` de fechamento (linha ~1132) e validar como obrigatório no `handleSubmit`.

**2. Edição (`src/pages/admin/RegistrosPage.tsx`)**
- Logo acima do bloco "Turma" (linha ~2310), adicionar o mesmo select para `editTipo === 'observacao_aula_redes'`, ligado a um novo state `editAnoSerieRedes` pré-populado a partir do registro carregado.
- Incluir `ano_serie` no UPDATE de `programacoes` (e `registros_acao`, se houver) para esse tipo.

**3. Migration — backfill de dados existentes**
```sql
UPDATE public.programacoes
SET ano_serie = '1º ano'
WHERE tipo = 'observacao_aula_redes' AND (ano_serie IS NULL OR ano_serie = 'todos');

UPDATE public.registros_acao
SET ano_serie = '1º ano'
WHERE tipo = 'observacao_aula_redes' AND (ano_serie IS NULL OR ano_serie = 'todos');
```

### O que NÃO muda
- O campo **Turma** (A–H) continua existindo e obrigatório, separado do Ano/Série.
- Demais campos do agendamento (Rede, Escola, etc.), permissões, RLS.
- Outros tipos de ação.

### Resultado esperado
- Ao agendar/editar "Observação de Aula – REDES", o usuário escolhe Ano/Série (1º ao 9º) — campo obrigatório — antes do campo Turma.
- Registros antigos passam a constar como `1º ano` em vez de `todos`, padronizando relatórios e filtros.

