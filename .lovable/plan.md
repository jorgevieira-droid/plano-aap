## Objetivo
Ordenar alfabeticamente (pt-BR) os itens do menu lateral em todos os perfis de usuário (admin, manager, operational, local, observer).

## Mudanças
Arquivo: `src/components/layout/Sidebar.tsx`

- Manter o item de painel principal sempre como primeiro item de cada menu (Dashboard / Meu Painel / Painel), pois é o ponto de entrada natural após login.
- Ordenar todos os demais itens de cada array (`adminMenuItems`, `managerMenuItems`, `operationalMenuItems`, `localMenuItems`, `observerMenuItems`) por `label` usando `localeCompare('pt-BR', { sensitivity: 'base' })`.
- Manter "Sair" no rodapé (já está separado do array, não é afetado).
- Não alterar lógica de permissões nem o filtro especial de N5 Formador (`/pontos-observados`).

## Detalhes técnicos
A ordenação será aplicada uma única vez na definição de cada array (estática), não em runtime, para evitar custo desnecessário a cada render. O primeiro item (Dashboard/Painel) fica fora do `.sort()`.

Exemplo:
```ts
const adminMenuItems: MenuItem[] = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
  ...[
    { icon: School, label: 'Escola / Regional / Rede', path: '/escolas' },
    // ... demais itens
  ].sort((a, b) => a.label.localeCompare(b.label, 'pt-BR', { sensitivity: 'base' })),
];
```

Mesma estrutura aplicada aos outros 4 arrays.