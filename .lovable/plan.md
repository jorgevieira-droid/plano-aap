

# Usar logo Bússola branco na Sidebar

## Resumo

Substituir o logo colorido (`logo-bussola-vertical.png`) pelo logo branco vertical (`logo_bussola-VERT_BNC.png`) na sidebar, que tem fundo escuro.

## Alterações

### 1. Copiar asset

- `user-uploads://logo_bussola-VERT_BNC.png` → `public/logo-bussola-vertical-branco.png`

### 2. `src/components/layout/Sidebar.tsx` (linha ~193)

- Alterar `src="/logo-bussola-vertical.png"` para `src="/logo-bussola-vertical-branco.png"`

