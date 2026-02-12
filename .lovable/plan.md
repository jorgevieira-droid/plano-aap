

# Simulacao de Perfil para Administrador ("Ver como...")

## Resumo

Permitir que o Administrador (N1) simule a experiencia de qualquer outro nivel (N2-N8) diretamente pela interface, sem precisar fazer login com outra conta. A simulacao afeta apenas o frontend: menus, rotas permitidas e filtros visuais mudam, mas o acesso aos dados via backend permanece o do admin (acesso total).

---

## Como funciona para o usuario

1. No menu lateral (Sidebar), o Admin vera um seletor "Simular perfil" com os niveis N2 a N8
2. Ao selecionar um nivel, a interface muda imediatamente:
   - O menu lateral exibe apenas os itens daquele perfil
   - As rotas permitidas seguem as regras daquele perfil
   - Um banner fixo no topo indica "Simulando como N5 — Formador" com um botao "Encerrar simulacao"
3. Ao clicar em "Encerrar simulacao", tudo volta ao normal

**Importante:** Os dados exibidos continuam sendo os do admin (RLS permite acesso total). A simulacao e apenas visual/de navegacao, nao filtra dados como se fosse realmente aquele perfil. Isso e proposital para que o admin veja a estrutura de navegacao sem perder acesso aos dados.

---

## Complexidade

**Media-baixa.** Nao requer alteracoes no banco de dados, RLS ou edge functions. As mudancas sao exclusivamente no frontend:

- 1 arquivo principal modificado: `AuthContext.tsx` (adicionar estado de simulacao)
- 2 arquivos de UI modificados: `Sidebar.tsx` (seletor de perfil) e `AppLayout.tsx` (usar role simulado para rotas)
- 1 componente novo pequeno: banner de simulacao

---

## Detalhes Tecnicos

### 1. AuthContext.tsx

Adicionar ao contexto:
- `simulatedRole: AppRole | null` — o papel simulado (null = sem simulacao)
- `setSimulatedRole: (role: AppRole | null) => void` — funcao para ativar/desativar
- `effectiveRole: AppRole` — retorna `simulatedRole` se ativo, senao o papel real
- `effectiveRoleTier: RoleTier` — tier derivado do `effectiveRole`
- `isSimulating: boolean` — flag de conveniencia

Todas as propriedades derivadas (`roleTier`, `isManager`, `isOperational`, etc.) passarao a usar o `effectiveRole` em vez do `profile.role`. A propriedade `isAdmin` real sera mantida como `isRealAdmin` para controlar a visibilidade do seletor de simulacao.

### 2. Sidebar.tsx

- Adicionar um componente `<Select>` abaixo do perfil do usuario (visivel apenas para `isRealAdmin`)
- Opcoes: "Normal (Admin)", "N2 — Gestor", "N3 — Coordenador", ..., "N8 — Equipe Tecnica"
- Ao selecionar, chama `setSimulatedRole(role)`
- O menu lateral muda imediatamente para refletir os itens do tier simulado

### 3. AppLayout.tsx

- Usar `effectiveRoleTier` em vez de `roleTier` para determinar rotas permitidas
- Manter redirecionamento baseado no tier simulado

### 4. Banner de simulacao

- Componente fixo no topo da area de conteudo (dentro do `SidebarProvider`)
- Exibido apenas quando `isSimulating === true`
- Texto: "Voce esta simulando o perfil: {label do papel}" + botao "Encerrar"
- Estilo: fundo amarelo/warning com borda, para ser visualmente claro

### 5. Persistencia

- A simulacao NAO sera persistida (nem localStorage, nem banco)
- Ao recarregar a pagina ou fazer logout, a simulacao e encerrada automaticamente
- Isso evita riscos de seguranca e confusao

---

## O que NAO muda

- RLS e politicas de seguranca no backend: o admin continua com acesso total
- Dados exibidos nas tabelas: o admin continua vendo todos os dados
- Paginas que fazem filtragem baseada em `profile.programas` ou `profile.entidadeIds` continuarao usando os dados reais do admin
- Nenhuma migracao de banco de dados necessaria

---

## Sequencia de Implementacao

1. Atualizar `AuthContext.tsx` com estado de simulacao e propriedades derivadas
2. Atualizar `Sidebar.tsx` com seletor de perfil para admin
3. Atualizar `AppLayout.tsx` para usar tier efetivo nas rotas
4. Adicionar banner de simulacao no layout

