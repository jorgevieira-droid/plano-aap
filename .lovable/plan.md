## Problema

Usuários N2 (Gestor) e N3 (Coordenador de Programa) recebem o erro:

> `new row violates row-level security policy for table "relatorios_monit_acoes_formativas"`

ao tentar gerenciar a ação "Monitoramento de Ações Formativas – Regionais".

## Causa raiz

O front-end (`acaoPermissions.ts`) já permite que N2/N3 criem e gerenciem essa ação (CRUD_PRG + listados em `eligibleResponsavelRoles`), mas as RLS da tabela `relatorios_monit_acoes_formativas` só contemplam:

- **N1 (admin):** ALL
- **N4/N5 (operacional):** ALL apenas quando `aap_id = auth.uid()`
- **N2/N3 (gestor / n3_coordenador_programa):** apenas SELECT

Não existe policy de INSERT/UPDATE/DELETE para N2/N3 — por isso a etapa de "Gerenciar" (que insere em `relatorios_monit_acoes_formativas`) é bloqueada.

A tabela `instrument_responses` (rubrica opcional do mesmo fluxo) já tem policies N2/N3 manage corretas, então só falta espelhar o mesmo padrão em `relatorios_monit_acoes_formativas`.

## Mudanças

### Migração SQL — adicionar policies N2/N3 manage

Em `relatorios_monit_acoes_formativas`, criar três policies (INSERT, UPDATE, DELETE) para `gestor` e `n3_coordenador_programa`, restritas aos registros de ação cujo `programa` o usuário possui em `user_programas` — exatamente o mesmo escopo da policy de SELECT já existente:

```sql
CREATE POLICY "N2N3 Managers insert relatorios_monit_acoes_formativas"
ON public.relatorios_monit_acoes_formativas
FOR INSERT TO public
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = relatorios_monit_acoes_formativas.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);

CREATE POLICY "N2N3 Managers update relatorios_monit_acoes_formativas"
ON public.relatorios_monit_acoes_formativas
FOR UPDATE TO public
USING (<mesma condição>);

CREATE POLICY "N2N3 Managers delete relatorios_monit_acoes_formativas"
ON public.relatorios_monit_acoes_formativas
FOR DELETE TO public
USING (<mesma condição>);
```

### Sem mudanças de código

- `acaoPermissions.ts` já habilita criar/gerenciar para N2/N3.
- `instrument_responses` (rubrica opcional) já tem RLS adequada para N2/N3.
- `MonitoramentoRegionaisManageDialog.tsx` não precisa de ajuste — funcionará assim que a RLS permitir o INSERT.

## Escopo / fora do escopo

- **Escopo:** apenas adicionar 3 policies em `relatorios_monit_acoes_formativas`.
- **Fora do escopo:** alterar políticas de outras tabelas, mudar permissions matrix, alterar UI.
