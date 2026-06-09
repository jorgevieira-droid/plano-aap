# Visita Técnica — T@RL: ajustes

## 1. Persistir a Escola (entidade filho) entre cadastro e gerenciamento

Hoje o campo `entidade_filho_id` já é salvo em `programacoes` no cadastro, mas o formulário de gerenciamento ignora esse valor e exibe o select "Selecione a escola" vazio — o usuário precisa escolher de novo, e o nome só é persistido em `relatorios_visita_tecnica_tarl.nome_escola` (texto livre).

**Mudanças em `src/components/formularios/VisitaTecnicaTarlForm.tsx`:**
- Adicionar prop opcional `entidadeFilhoId?: string`.
- No effect que carrega `entidades_filho`, quando `entidadeFilhoId` é passado e ainda não há `nome_escola` no form (ou o relatório existente não tem valor), buscar o nome do `entidades_filho` correspondente e fazer `form.setValue('nome_escola', nome)`.
- Desabilitar o `Select` de Escola quando `entidadeFilhoId` está definido (mesmo padrão usado em `VisitaTecnicaMicrociclosForm`), de modo que o gerenciamento herde a escola escolhida no cadastro e o usuário não precise re-selecionar.
- Manter hydrate atual (`existing.nome_escola`) com prioridade sobre o lookup, para não sobrescrever edições antigas.

**Mudanças em `src/pages/admin/ProgramacaoPage.tsx` (linha ~5891):**
- Passar `entidadeFilhoId={(selectedProgramacao as any).entidade_filho_id || undefined}` para `VisitaTecnicaTarlForm`.

**Mudanças em `src/pages/admin/RegistrosPage.tsx` (linha ~3463):**
- Passar `entidadeFilhoId={prog?.entidade_filho_id || (selectedRegistro as any).entidade_filho_id || undefined}`.

Sem alteração de schema: o campo `nome_escola` (texto) continua sendo a fonte salva no relatório; o `entidadeFilhoId` apenas pré-preenche e trava a seleção a partir da programação.

## 2. "Nota atribuída" como botões 1–4

No formulário, em cada um dos 14 critérios (linha ~508), trocar o `<Select>` de notas por uma linha de 4 botões compactos (1, 2, 3, 4).

- Usar `Button` (`variant="outline"` quando não selecionado, `variant="default"` quando selecionado) numa `div` flex com gap.
- Clique alterna: clicar no botão já selecionado desmarca (volta para `null`), permitindo limpar a nota.
- Manter `FormField` + `FormMessage`; manter o tooltip do label `Nota atribuída (1 a 4)` acima dos botões.
- Acessibilidade: `aria-pressed` no botão selecionado; `type="button"` para não submeter o form.
- A constante `SCALE_OPTIONS` continua útil para o `title`/tooltip de cada botão (ex.: "2 — Em desenvolvimento").

## Out of scope
- Sem mudanças em RLS, GRANTs ou migrations.
- Sem alterações nas demais ações/formulários.
- Sem alterar a impressão/PDF do T@RL (continua lendo `nome_escola`).
