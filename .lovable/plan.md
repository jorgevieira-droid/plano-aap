

# Inserir logos Bússola e renomear plataforma para "Bússola"

## Resumo

Adicionar o logo Bússola ao lado do logo Parceiros da Educação em todos os pontos existentes, e renomear a plataforma de "Acompanhamento AAPs" para "Bússola".

## Alterações

### 1. Copiar logos para o projeto

- `user-uploads://logo_bussola-VERT.png` → `public/logo-bussola-vertical.png`
- `user-uploads://logo_bussola_BCN.png` → `src/assets/logo-bussola-branco.png`
- `user-uploads://logo_bussola_icon.png` → `public/favicon-bussola.png` (atualizar favicon)

### 2. Página de login (`AuthPage.tsx`)

- Adicionar `logo-bussola-vertical.png` ao lado do logo Parceiros existente
- Alterar título de "Acompanhamento de Atores e Ações Pedagógicas (AAPs)" para "Bússola"

### 3. Sidebar (`Sidebar.tsx`)

- Substituir o ícone `GraduationCap` por `<img src="/logo-bussola-vertical.png">` no topo esquerdo

### 4. PDFs e relatórios — adicionar logo Bússola branco ao lado do Parceiros

| Arquivo | Logo atual | Alteração |
|---|---|---|
| `RelatoriosPage.tsx` | `pe-logo-branco-horizontal.png` | Adicionar `logo-bussola-branco.png` ao lado |
| `PontosObservadosPage.tsx` | `pe-logo-branco-horizontal.png` | Idem |
| `EvolucaoProfessorPage.tsx` | `pe-logo-branco-horizontal.png` | Idem |
| `ListaPresencaPrint.tsx` | `/pe-logo-branco.png` | Adicionar logo Bússola branco ao lado |
| `ManualUsuarioPage.tsx` | `/pe-logo-branco.png` | Adicionar logo Bússola branco ao lado |

### 5. Renomear "Acompanhamento AAPs" → "Bússola"

| Arquivo | Local |
|---|---|
| `index.html` | `<title>` e `og:title` |
| `AuthPage.tsx` | Título principal |
| `ManualUsuarioPage.tsx` | Subtítulo e descrição |
| `RelatoriosPage.tsx` | Texto no header do PDF |
| `consultoria-report.tsx` | `SITE_NAME` |

### 6. Favicon

- Substituir `public/favicon.png` pelo ícone Bússola

