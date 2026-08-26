# Mostrar apenas usuários ativos nas listas de responsáveis

## Problema

As listas de seleção (Responsável, Consultor, Formador, GPI, Coordenador etc.) são montadas a partir da visão de diretório de usuários, que hoje só devolve `id` e `nome` — sem a informação de ativo/inativo. Por isso os 8 usuários já inativados continuam aparecendo nos formulários de cadastro de ações e nos filtros.

## O que será feito

1. **Backend:** incluir o indicador de "ativo" na visão de diretório de usuários, para que o app saiba quem está inativo (a visão continua sem expor e-mail/telefone).
2. **Formulários de cadastro/gerenciamento de ação (Programação, Adicionar Ação):** os seletores de Responsável / Consultor / Formador / GPI passam a listar apenas usuários ativos.
   - Exceção: se uma ação já existente estiver vinculada a um usuário hoje inativo, esse nome continua aparecendo (marcado como "inativo") enquanto a ação estiver aberta em edição, para não perder o vínculo ao salvar.
3. **Filtros e relatórios:** os filtros de Formador / Consultor / GPI e as listas de atores em painéis e relatórios também passam a listar apenas ativos, mas a resolução de nomes de registros históricos continua funcionando (nomes de inativos seguem sendo exibidos nos dados já lançados).

## Detalhes técnicos

- Migração: recriar `public.profiles_directory` com `security_invoker=on` adicionando a coluna `ativo`; manter os grants atuais.
- `src/pages/admin/ProgramacaoPage.tsx`: adicionar `ativo` ao tipo `AAPFormador` e ao `select` do diretório; filtrar `filteredAaps` e as listas dos `MultiSelectFilter` (formador, consultor, GPI) por `ativo`, mantendo o `aaps` completo para `getAapNome`.
- `src/components/forms/FilterBar.tsx`, `src/pages/admin/RegistrosPage.tsx`, `src/pages/admin/RelatoriosPage.tsx`, `src/pages/admin/AdminDashboard.tsx`, `src/pages/admin/PontosObservadosPage.tsx`, `src/components/dashboard/HorasPorAtorCard.tsx`: selecionar `ativo` e usar apenas ativos ao montar opções de seleção, sem alterar o mapa id→nome usado para exibir dados.
- `src/pages/admin/ProfessoresPage.tsx` e `src/pages/admin/RelatorioAcessosPage.tsx` (consultas diretas a `profiles`): filtrar `ativo = true` nas listas de seleção.
