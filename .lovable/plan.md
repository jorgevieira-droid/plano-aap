## Diagnóstico

O campo `componente_formacao_redes` foi adicionado no arquivo `EncontroProfessorRedesForm.tsx` — mas esse componente é **código morto**: não é importado por nenhuma página. Por isso, nada apareceu nem no cadastro nem no gerenciamento.

O fluxo real de "Encontro Formativo Professor – REDES" vive em:
- **Cadastro/Agendamento:** `src/pages/admin/ProgramacaoPage.tsx` (grava em `programacoes`)
- **Gerenciamento/Edição:** `src/pages/admin/RegistrosPage.tsx` (grava em `registros_acao`)

A coluna foi criada na tabela errada (`relatorios_professor_redes`).

## Plano de correção

### 1. Migration
- Adicionar `componente_formacao_redes text` nullable em `public.programacoes`.
- Adicionar `componente_formacao_redes text` nullable em `public.registros_acao`.
- Remover `componente_formacao_redes` de `public.relatorios_professor_redes` (coluna foi adicionada por engano, ninguém escreve nela).

### 2. `ProgramacaoPage.tsx` (cadastro)
No bloco do formulário onde já existe o campo "Projeto" para `encontro_professor_redes` (linha ~3231), acrescentar logo abaixo um novo `<Select>` "Componente" (opcional) com as opções:
- Não se aplica / Polivalente / Língua Portuguesa / Matemática

Incluir `componente_formacao_redes` no state `formData`, nos handlers de criar/editar, e no payload de insert/update da `programacoes`. Também propagar no payload que cria o `registros_acao` correspondente quando aplicável.

### 3. `RegistrosPage.tsx` (gerenciamento)
Adicionar o mesmo `<Select>` no dialog de edição do registro, condicionado a `editTipo === 'encontro_professor_redes'`, próximo aos campos "Projeto"/"Turma de Formação" já existentes (linha ~2301-2305).

- Adicionar state `editComponenteFormacaoRedes`.
- Hidratar a partir de `prog?.componente_formacao_redes` no `handleEdit`.
- Incluir no select da query (linha 424) e nos payloads de update (linhas 1070 e 1124), salvando `null` quando o tipo for diferente de `encontro_professor_redes`.

### 4. Limpeza
- Manter `EncontroProfessorRedesForm.tsx` como estava antes do meu primeiro patch (reverter a adição do campo lá) ou removê-lo de vez já que é morto. Sugiro **reverter apenas a adição do campo** para não ampliar o escopo do PR.

## Arquivos afetados
- `supabase/migrations/<timestamp>_move_componente_formacao_redes.sql`
- `src/pages/admin/ProgramacaoPage.tsx`
- `src/pages/admin/RegistrosPage.tsx`
- `src/components/formularios/EncontroProfessorRedesForm.tsx` (reverter)

## Ganhos / Perdas / Riscos
- **Ganhos:** Campo aparece de fato no cadastro e no gerenciamento, persistido onde o resto dos metadados do encontro vivem.
- **Perdas:** Nenhuma — coluna não usada em `relatorios_professor_redes` será removida.
- **Riscos:** Baixo — colunas nullable; drop atinge coluna sem dados.

Confirma que faço dessa forma? (Posso também pular o passo 4 se você preferir deixar o form morto intocado.)
