# Erro ao salvar "Monitoramento e Gestão" (Regionais) como Coordenador

## Causa

A tabela `relatorios_monitoramento_gestao` só possui policies de RLS para:
- N1 Admin (ALL)
- N2/N3 Managers — apenas **SELECT**
- N4/N5 Operational (ALL)

Não há policy de **INSERT/UPDATE/DELETE** para Gestor (N2) nem Coordenador (N3). Por isso o save falha com `new row violates row-level security policy for table "relatorios_monitoramento_gestao"` no perfil de Coordenador.

A tabela irmã `relatorios_monit_acoes_formativas` já tem o padrão correto (INSERT/UPDATE/DELETE para N2/N3 escopados aos programas do usuário via `user_programas` × `registros_acao.programa`). Vamos replicar.

## Mudança (migration única)

Adicionar em `relatorios_monitoramento_gestao` 3 policies espelhando o padrão de `relatorios_monit_acoes_formativas`:

- `N2N3 Managers insert relatorios_monitoramento_gestao` (INSERT, WITH CHECK)
- `N2N3 Managers update relatorios_monitoramento_gestao` (UPDATE, USING + WITH CHECK)
- `N2N3 Managers delete relatorios_monitoramento_gestao` (DELETE, USING)

Condição em todas:
```
(is_gestor(auth.uid()) OR has_role(auth.uid(),'n3_coordenador_programa'))
AND EXISTS (
  SELECT 1 FROM registros_acao r
  JOIN user_programas up ON up.user_id = auth.uid()
  WHERE r.id = relatorios_monitoramento_gestao.registro_acao_id
    AND r.programa IS NOT NULL
    AND up.programa::text = ANY(r.programa)
)
```

## Fora de escopo
- Nenhuma alteração de código frontend.
- Nenhuma mudança em outras tabelas/policies.
