## Objetivo

Reorganizar visualmente o menu lateral e o Manual do Usuário em **4 grupos rotulados**, sem alterar permissões, rotas ou lógica de visibilidade por programa. Mudança puramente de UI/organização.

---

## 1. Sidebar (`src/components/layout/Sidebar.tsx`)

### Estrutura

Substituir os 5 arrays existentes (`adminMenuItems`, `managerMenuItems`, `operationalMenuItems`, `localMenuItems`, `observerMenuItems`) por **um único `MASTER_GROUPS`** marcando cada item com os tiers que podem vê-lo:

```ts
interface MenuItem {
  icon, label, path, disabled?,
  requiresAcao?, requiresAnyInstrument?, requiresFormacao?,
  allowedTiers?: RoleTier[]; // se ausente = todos os tiers
  adminOnly?: boolean;        // só N1 real
}
interface MenuGroup { label: string; items: MenuItem[]; adminOnly?: boolean }
```

Filtragem encadeada em ordem: tier → admin/adminOnly → `itemVisibleForPrograms` (já existente). Grupo sem itens visíveis fica oculto. Rótulo do grupo: `text-xs uppercase tracking-wider text-sidebar-foreground/60 px-3 mt-4 mb-1`.

### Ordem fixa dentro de cada grupo

**Ferramentas de Gestão**
1. Dashboard (ou "Meu Painel" `/aap/dashboard` para tier operational, ou "Painel" `/dashboard` para local)
2. Programação (ou "Meu Calendário" `/aap/calendario` para operational)
3. Registros
4. Relatório de Instrumentos
5. Relatórios Narrativos
6. Relatórios Gerais
7. Histórico Presença
8. Pendências
9. Rel. Regionais
10. Rel. Consultoria Pedagógica
11. Visualização Apoio Presencial
12. Visualização Consultoria
13. Lista de Presença

**Admin**
1. Usuários
2. Atores dos Programas
3. Consultor / Gestor / Formador
4. Atores Educacionais
5. Escola / Regional / Rede
6. Entidades Filho
7. Histórico de Alterações
8. Relatório de Acessos

**Configuração**
1. Configurar Formulário
2. Matriz de Ações
3. Integração Notion
4. Manual do Usuário

**Desabilitados** (grupo inteiro com `adminOnly: true` — somente N1 real)
1. Evolução Professor
2. Pontos Observados

### Decisões confirmadas
- "Meu Painel"/"Meu Calendário"/"Painel" permanecem para os perfis operacionais/locais, encaixados em **Ferramentas de Gestão** nas posições 1 e 2.
- "Evolução Professor" e "Pontos Observados" passam a ser **exclusivos do N1 (admin)** — removidos para os demais tiers (mesmo com badge "Desabilitada").

### O que não muda
- Lógica de `requiresAcao`, `requiresAnyInstrument`, `requiresFormacao`, `usePendencias`, simulação de perfil/programa, badge de pendências e badge "Desabilitada", componente `<Link>` e classes `sidebar-item` / `sidebar-item-active`.

---

## 2. Manual do Usuário (`src/pages/admin/ManualUsuarioPage.tsx`)

### Estrutura

Trocar o array plano `sections` por:

```ts
interface ManualGroup { label: string; sections: ManualSection[] }
const groups: ManualGroup[] = [ ... ]
```

- **Numeração contínua 1→N** atravessando os grupos (preserva a ordem atual de leitura). O título de cada seção mantém o prefixo numérico já existente.
- Cada grupo é renderizado com um cabeçalho `h2` (texto grande, classe consistente com o título atual da página) antes dos cards.
- O export PDF (`html2canvas` + `jsPDF`) continua iterando pelos cards. Os cabeçalhos de grupo recebem `data-pdf-section` para entrarem no PDF como uma página/seção própria; nenhuma mudança de lógica de captura.

### Distribuição das seções existentes

- **Ferramentas de Gestão**: Login, Dashboard, Programação, Registrar Ação, Registros, instrumentos pedagógicos (visão geral + Observação GPA, Visita Alfabetização, Visita TaRL, Apoio Presencial, Microciclos, REDES, Monitoramentos), Relatório de Instrumentos, Relatórios Narrativos, Relatórios Gerais, Histórico de Presença, Pendências, Rel. Regionais, Rel. Consultoria Pedagógica, Visualização Apoio Presencial, Visualização Consultoria, Lista de Presença.
- **Admin**: Usuários, Atores dos Programas, Consultor/Gestor/Formador, Atores Educacionais, Escola/Regional/Rede, Entidades Filho, Histórico de Alterações, Relatório de Acessos.
- **Configuração**: Configurar Formulário, Matriz de Ações, Integração Notion, Manual do Usuário.
- **Desabilitados**: Evolução Professor, Pontos Observados.

---

## Arquivos alterados

- `src/components/layout/Sidebar.tsx` — refactor único para `MASTER_GROUPS` + render por grupo.
- `src/pages/admin/ManualUsuarioPage.tsx` — `sections` → `groups`; cabeçalho por grupo; ajuste do loop do PDF.

Sem alterações em rotas, permissões, hooks de dados, schema ou edge functions.
