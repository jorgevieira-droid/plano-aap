

## Permitir que N2 (Gestor) e N3 (Coordenador do Programa) gerenciem Entidades Filho dos seus programas

### Contexto
Hoje a página `/entidades-filho` e a tabela `entidades_filho` são restritas ao N1 (Admin). N2/N3 precisam cadastrar/editar entidades filho — mas apenas vinculadas a entidades pai (`escolas`) cujos programas eles gerenciam.

A tabela `entidades_filho` não tem coluna `programa` própria. O escopo é derivado da entidade pai (`escolas.programa[]`) cruzada com `user_programas` do usuário (mesmo padrão já usado em `escolas` e `professores` para N2/N3).

### O que será alterado

**1. Migration — atualizar RLS de `entidades_filho`** (`supabase/migrations/...sql`)
- Manter a policy "N1 Admins manage entidades_filho" (ALL).
- Adicionar 4 novas policies para N2/N3:
  - **SELECT**: `(is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa')) AND user_has_escola_via_programa(auth.uid(), escola_id)`
  - **INSERT**: mesma condição no `WITH CHECK`
  - **UPDATE**: mesma condição no `USING` e `WITH CHECK`
  - **DELETE**: mesma condição no `USING`
- Manter "Authenticated users can view entidades_filho" (SELECT geral) que já existe.

**2. Página `src/pages/admin/EntidadesFilhoPage.tsx`**
- Substituir o gate `if (!isAdmin)` por `if (!isAdmin && !isGestor && !hasRole('n3_coordenador_programa'))`.
- A query de entidades já traz tudo (RLS filtra automaticamente para N2/N3).
- O `lookupEscola` por CODESC continua igual — RLS de `escolas` já restringe N2/N3 aos seus programas, então só conseguirão resolver CODESCs dentro do escopo deles.
- A importação em lote (`handleBatchUpload`) também já funciona — o `IN (codescs)` em `escolas` retorna só os visíveis ao usuário, gerando aviso de "CODESC pai não encontrado" para entidades fora do escopo (comportamento desejado).

**3. Sidebar (`src/components/layout/Sidebar.tsx`)**
- Adicionar o item `{ icon: Building2, label: 'Entidades Filho', path: '/entidades-filho' }` em `managerMenuItems` (logo após "Escola / Regional / Rede").

**4. Memória do projeto**
- Atualizar `mem://roles-permissions/entity-management-expansion` registrando que N2/N3 também gerenciam Entidades Filho dentro do escopo dos seus programas (mesma regra usada para `escolas`).

### O que NÃO muda
- N4–N8 continuam sem acesso à página.
- Estrutura da tabela `entidades_filho` (sem nova coluna).
- Fluxos de cadastro, edição, importação em lote e desativação — apenas o gate de quem pode usar.
- RLS para Admin permanece igual.

### Resultado esperado
- N2 e N3 enxergam o item "Entidades Filho" no menu.
- Conseguem listar, criar, editar, ativar/desativar e excluir entidades filho **somente quando a entidade pai pertence a um programa que eles gerenciam**.
- Ao tentar buscar um CODESC pai fora do seu escopo, o sistema mostra "Nenhuma entidade encontrada" (já é o comportamento via RLS de `escolas`).

