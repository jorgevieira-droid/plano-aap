# Liberar edição de "Valores manuais" para N3

## Contexto
Na página **Reunião Mensal N1 (PRG Escolas)** (`/reuniao-mensal-escolas`), o botão "Valores manuais" (Seção 4 — Apoios x Devolutivas) hoje é editável por N1 e N2; o N3 (Coordenador do Programa) vê os valores, mas não edita. O usuário pediu para liberar a edição também para o N3.

## O que muda

1. **Frontend — `src/pages/admin/ReuniaoMensalEscolasPage.tsx`**
   - Linha ~98: `canEditManual = isAdmin || isGestor;` → incluir `hasRole('n3_coordenador_programa')`.
   - Nada mais muda: o diálogo de edição, o upsert e a exclusão já usam `canEditManual` como único gate no frontend.

2. **Banco — migração em `supabase/migrations/`**
   - A política de escrita atual da tabela `consultoria_valores_manuais` é "Admin/gestor write manual values" com `is_admin_or_gestor(auth.uid())` (não inclui N3).
   - Recriar a política de escrita (ALL) usando `is_manager(auth.uid())`, que já cobre admin + gestor (N2) + n3_coordenador_programa (N3). A política de leitura já usa `is_manager` e permanece igual.
   - Sem mudanças de schema, GRANTs já existentes permanecem.

## Verificação
- Simular N3 no preview: o botão aparece, o diálogo abre, salvar grava e a leitura volta correta.
- Confirmar no banco que um N3 consegue `INSERT/UPDATE/DELETE` em `consultoria_valores_manuais` (política nova aplicada).
- N2 e N1 continuam editando como hoje.
