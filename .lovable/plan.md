## Objetivo

Conjunto de melhorias focadas no programa REDES (com alguns itens transversais a todos os programas), envolvendo cadastro de atores, hierarquia de entidades, filtros, dashboard e renomeações.

---

## 1. Atores Educacionais — campo "Entidade Filho" (somente REDES)

- Em `src/pages/admin/ProfessoresPage.tsx`, no formulário de cadastro/edição do ator, adicionar um `Select` opcional **Entidade Filho** logo abaixo de Entidade (Escola).
- O campo só aparece quando a entidade selecionada pertence ao programa **redes_municipais**; nos demais, fica oculto.
- Opções carregadas de `entidades_filho` filtradas por `escola_id` da entidade pai selecionada (cascata).
- Persistir `entidade_filho_id` em nova coluna nullable em `professores`.
- Listagem/filtros e import em lote: incluir coluna opcional "Entidade Filho" (apenas exibida para entidades REDES).

## 2. Filtro Programa + Hierarquia em todas as visualizações (todos os programas)

- Aplicar filtro de Programa e respeito à hierarquia de permissões em:
  - `src/pages/admin/MatrizAcoesPage.tsx` (incluir seletor de Programa no topo, restringindo a matriz às permissões/ações do programa selecionado).
  - Demais páginas auditadas: Dashboard, Relatórios, Pendências, Pontos Observados, Programação, Histórico de Presença, Evolução Professor — confirmar que o filtro Programa já existe; adicionar onde estiver faltando.
- Reutilizar padrão já existente em `useAcoesByPrograma` e `user_programas` para escopo.

## 3. Filtro "Entidade Filho" em Programação / Meu Calendário (todos os programas)

- Em `src/pages/admin/ProgramacaoPage.tsx`, adicionar dropdown **Entidade Filho** ao bloco de filtros, dependente da Entidade selecionada.
- Filtro aplica-se à lista de eventos do calendário e à grade.
- Quando nenhuma entidade pai estiver selecionada, ocultar o filtro.

## 4. Contagem de entidades — desconsiderar entidades internas (todos os programas)

- Adicionar coluna `uso_interno boolean DEFAULT false` em `escolas`.
- Marcar manualmente as 4 entidades existentes (Time de Redes, Time de Escolas, Time de Regionais, Time FPP) como `uso_interno = true` via insert tool após a migração.
- Em todas as contagens/KPIs do AdminDashboard e relatórios que consolidam totais de entidades, excluir registros com `uso_interno = true`.
- Em `EscolasPage.tsx`, expor o toggle "Uso interno" no formulário de edição (admins e gestores).
- Listas operacionais (atribuição de usuários, seleção em ações) continuam mostrando essas entidades — o filtro vale apenas para **contagens agregadas**.

## 5. Observação de Aula REDES — confirmação dupla (REDES)

- Em `src/pages/admin/RegistrosPage.tsx`, no fluxo de "Realizar/Gerenciar" do tipo `observacao_aula_redes`:
  - Após responder "A ação aconteceu? → Sim", apresentar segunda pergunta: **"Deseja preencher o checklist de observação?"**.
  - Se **Não** → apenas marca a ação como realizada (sem abrir o formulário REDES); registro fica com status realizado e instrumento vazio.
  - Se **Sim** → abre o diálogo do formulário REDES como hoje.

## 6. Renomear "Observação de Aula – REDES" → "Visitas Técnicas - Microciclos" (REDES)

- Trocar o `label` em:
  - `src/config/acaoPermissions.ts` (`observacao_aula_redes`)
  - `src/hooks/useInstrumentFields.ts`
  - `src/data/mockData.ts`
  - `src/pages/admin/PendenciasPage.tsx`
  - Strings em `RegistrosPage.tsx`, `ProgramacaoUploadDialog.tsx`, `EvolucaoProfessorPage.tsx` que mencionam "Observação de Aula – REDES" / "Observação de Aula REDES".
- Manter o `value`/`tipo` no banco como `observacao_aula_redes` (sem migração de dados).

## 7. Dashboard — frequência em formações (REDES e Admin)

- Em `src/pages/admin/AdminDashboard.tsx`, adicionar nova seção visível para Admin e usuários com programa REDES selecionado:
  - **Bloco A — % presença por encontro formativo:** gráfico de barras agrupando por tipo de ação (Encontro ETEG, Encontro Microciclos, Encontro Professor REDES, Formação) mostrando % médio de comparecimento.
  - **Bloco B — % presença consolidado por município/turma de formação:** tabela/gráfico com média de presença agregada por `municipio` (da entidade) e por `turma_formacao`.
- Dados vêm das tabelas `presencas` + `registros_acao` (filtrando tipos formativos) cruzadas com `professores`.

---

## Detalhes técnicos

### Migração SQL necessária

```sql
ALTER TABLE public.professores
  ADD COLUMN entidade_filho_id uuid REFERENCES public.entidades_filho(id) ON DELETE SET NULL;

ALTER TABLE public.escolas
  ADD COLUMN uso_interno boolean NOT NULL DEFAULT false;

CREATE INDEX idx_escolas_uso_interno ON public.escolas(uso_interno) WHERE uso_interno = true;
```

Após a migração, executar via insert tool:
```sql
UPDATE public.escolas SET uso_interno = true
WHERE nome IN ('Time de Redes','Time de Escolas','Time de Regionais','Time FPP');
```

### Sem alterações em RLS — colunas novas herdam as policies existentes.

## Fora de escopo

- Não alterar o `value` `observacao_aula_redes` no banco (apenas labels).
- Não alterar lógica de cálculo de médias pedagógicas.
- Não dinamizar o menu lateral (mantém-se hardcoded).
