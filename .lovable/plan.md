## Contexto

Em `/aap/calendario` (`src/pages/admin/ProgramacaoPage.tsx`), o filtro atual da lista (`filteredProgramacoes`, linhas ~854‑902) faz:

- **N4‑N5 (`isAAP` / operacional)**: mostra todas as ações dos programas do usuário (não somente as próprias).
- **N6‑N7 (`isLocal`) e N8 (`isObserver`)**: não há filtro client‑side adicional — exibe tudo o que o RLS deixa passar (ações da escola/programa, mesmo que não sejam suas).
- **N2/N3/Admin/Gestor**: filtra por programas do gestor/coordenador, conforme já configurado.

O comportamento desejado:

- **N4 – N8** (Consultor Pedagógico, Formador, GPI, Coord. Pedagógico, Professor, Equipe Técnica): ver **somente ações onde `aap_id === user.id`** (responsável é o próprio usuário).
- **N2 – N3** (Gestor, Coordenador de Programa) e **Admin**: manter a lógica atual (filtros por programa + hierarquia / filtros da UI).

## Mudança

Arquivo: `src/pages/admin/ProgramacaoPage.tsx`, dentro do `useMemo` `filteredProgramacoes` (~linhas 878‑890), no ramo "não está simulando":

1. Substituir o filtro `isAAP` (apenas por programas) por um filtro de propriedade:
   - Se o usuário **não** for `isAdmin`, `isGestor` nem `isManager` (ou seja, é N4‑N8 — engloba `isAAP`/`isOperational`, `isLocal`, `isObserver`), aplicar:
     ```ts
     if (p.aap_id !== user?.id) return false;
     ```
2. Manter o bloco de N2/N3/Gestor/Manager filtrando pelos `gestorProgramas` (sem alteração).
3. A simulação (`isSimulating`) já trata `viewScope === "proprio"` corretamente — não mexer.

Resultado: N4‑N8 só veem suas próprias ações no calendário e na lista; N2/N3/Admin continuam com a visão ampla filtrada pelos seletores de programa/formador/consultor/GPI/entidade.

## Observações

- Não há mudança de RLS — apenas filtro client‑side, alinhado ao padrão já usado em outras telas.
- Os filtros da UI (Formador/Consultor/GPI) continuam funcionando para N2/N3; para N4‑N8 ficam efetivamente restritos ao próprio usuário.
- Permissões de editar/excluir (que já checam `event.aap_id === user.id`) permanecem inalteradas.
