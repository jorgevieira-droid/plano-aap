## Diagnóstico

A página existe e o guard interno (`isManager`) permite N1–N3. O problema está no whitelist de rotas em `src/components/layout/AppLayout.tsx` (`ALLOWED_ROUTES`): a rota `/extracao-bases-instrumentos` **não está listada** no tier `manager`, então N2/N3 são redirecionados para `/dashboard` antes mesmo da página renderizar.

N1 (admin) funciona porque o tier `admin` tem whitelist vazio (acesso total).

## Correção

**`src/components/layout/AppLayout.tsx`** — adicionar `'/extracao-bases-instrumentos'` ao array do tier `manager` em `ALLOWED_ROUTES` (junto das demais rotas de relatórios/admin permitidas a N2-N3).

Nada mais muda: o filtro por programas continua sendo aplicado dentro da própria página (`effectiveProgramas`), e o item do sidebar já está restrito a `['admin', 'manager']`.
