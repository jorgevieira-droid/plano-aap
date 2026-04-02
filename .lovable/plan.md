

# Correções de Visibilidade e Funcionalidade por Programa (Atualizado)

## Problema 1: N3 (Coordenador) não vê ações do seu programa
*(Já corrigido na implementação anterior)*

## Problema 2: Alteração de status no Registro não reflete na Programação
*(Já corrigido na implementação anterior)*

---

## Correções pendentes

### 1. Acesso à página de Entidades para todos os níveis
**Problema**: Os menus `operationalMenuItems` (N4-N5) e `localMenuItems` (N6-N7) não incluem o link para `/escolas`. Apenas Admin, Manager (N2-N3) e Observer (N8) possuem acesso.

**Correção** em `src/components/layout/Sidebar.tsx`:
- Adicionar `{ icon: School, label: 'Escola / Regional / Rede', path: '/escolas' }` aos arrays `operationalMenuItems` e `localMenuItems`.

**Correção** em `src/pages/admin/EscolasPage.tsx`:
- Restringir o dropdown de programa para N4-N8 com base em `profile.programas`, mostrando apenas os programas vinculados ao usuário.
- Desabilitar botões de criação/edição/exclusão para perfis sem permissão de gestão (já usa `canManage`).

### 2. Matriz de Ações filtrada por programa do usuário
**Correção** em `src/pages/admin/MatrizAcoesPage.tsx`:
- Importar `useAuth` e verificar `profile.programas`.
- Filtrar ações visíveis usando `isAcaoEnabledForPrograma` cruzado com os programas do usuário.
- Admin continua vendo tudo.

### 3. Inclusão de ações restrita ao programa do usuário
**Correção** em `src/pages/admin/ProgramacaoPage.tsx`:
- Substituir `isGestor` por `isManager` (incluir N3).
- Buscar programas de `user_programas` em vez de `gestor_programas`.
- Filtrar tipos de ação disponíveis pelo programa do usuário via `form_config_settings`.

### 4. Template de importação em lote com aba de entidades
**Correção** em `src/components/forms/ProgramacaoUploadDialog.tsx`:
- Adicionar 3ª aba "Entidades" no template Excel com colunas `CODESC`, `NOME` e `PROGRAMA`.
- Receber lista de entidades como prop.

### 5. Erro na importação pelo Gestor de Parcerias
**Correção** em `src/pages/admin/ProgramacaoPage.tsx`:
- Mesma correção do item 3: trocar `gestor_programas` por `user_programas` e `isGestor` por `isManager`.

### 6. Registro de Ações — mostrar todas as ações e abrir formulário específico
**Correção** em `src/pages/admin/RegistrosPage.tsx`:
- Incluir ações com status `prevista`/`agendada` (não apenas `realizada`).
- No `handleOpenManage`, detectar tipo de ação e abrir formulário de instrumento correspondente (ex: `observacao_aula_redes`, `encontro_eteg_redes`) em vez de apenas presença genérica.

### 7. Atores do Programa — visibilidade por nível
- Já implementado corretamente com filtro por nível e programa compartilhado. Sem alteração necessária.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/components/layout/Sidebar.tsx` | Adicionar `/escolas` aos menus operational e local |
| `src/pages/admin/EscolasPage.tsx` | Restringir dropdown de programa por perfil |
| `src/pages/admin/MatrizAcoesPage.tsx` | Filtrar ações por programa do usuário |
| `src/pages/admin/ProgramacaoPage.tsx` | `isGestor`→`isManager`, `gestor_programas`→`user_programas`, filtrar tipos por programa |
| `src/components/forms/ProgramacaoUploadDialog.tsx` | Aba de entidades no template Excel |
| `src/pages/admin/RegistrosPage.tsx` | Mostrar todas as ações; gerenciar abre formulário específico |

