

# Responsividade dos dialogs + Acesso ao menu Registros para N4/N5

## Resumo

Duas frentes: (1) padronizar todos os dialogs para se ajustarem a telas menores, e (2) liberar o menu e rota de "Registros" para usuarios operacionais (N4/N5), permitindo que editem/excluam acoes proprias.

## Alteracoes

### 1. Responsividade dos Dialogs

Padronizar todos os `DialogContent` que ainda nao possuem `w-[95vw]` e `max-h-[85vh] overflow-y-auto`. Os arquivos principais sao:

| Arquivo | Dialogs a ajustar |
|---|---|
| `ProgramacaoPage.tsx` | Manage Dialog (linha 3049): adicionar `max-h-[85vh] overflow-y-auto w-[95vw] sm:w-auto` |
| `RegistrosPage.tsx` | Todos os 6 dialogs ja possuem `max-h-[90vh] overflow-y-auto`, mas faltam `w-[95vw] sm:w-auto` nos que nao tem |

Tambem garantir `min-w-0` e `break-words` em labels longos dentro dos selects/dropdowns dos formularios, conforme padrao ja documentado.

### 2. Menu e Rota "Registros" para Operacional (N4/N5)

- **`src/components/layout/Sidebar.tsx`**: Adicionar `{ icon: ClipboardList, label: 'Registros', path: '/registros' }` ao array `operationalMenuItems` (apos "Historico").
- **`src/components/layout/AppLayout.tsx`**: Adicionar `'/registros'` ao array `operational` em `ALLOWED_ROUTES` (linha 22).

### 3. Botao de Excluir em RegistrosPage para N3-N5

Na linha 1255, a condicao `{(isAdmin || isManager) && (` deve ser alterada para `{canDelete(registro) && (`, pois a funcao `canDelete` ja verifica permissao por role E propriedade (`aap_id === user.id`). Isso permite que N4/N5 excluam seus proprios registros.

(Nota: `canEdit` ja e usado corretamente no botao de editar na linha 1239.)

| Arquivo | Alteracao |
|---|---|
| `src/components/layout/Sidebar.tsx` | Adicionar "Registros" ao menu operacional |
| `src/components/layout/AppLayout.tsx` | Adicionar `/registros` as rotas operacionais |
| `src/pages/admin/RegistrosPage.tsx` | Usar `canDelete(registro)` no botao de excluir |
| `src/pages/admin/ProgramacaoPage.tsx` | Padronizar responsividade do Manage Dialog |
| `src/pages/admin/RegistrosPage.tsx` | Adicionar `w-[95vw] sm:w-auto` nos dialogs que faltam |

