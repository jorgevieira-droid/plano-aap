## Diagnóstico

O erro `new row violates row-level security policy for table "instrument_responses"` ocorre quando um usuário **N2 (Gestor)** ou **N3 (Coordenador de Programa)** tenta salvar qualquer instrumento pedagógico (Apoio Presencial, Monitoramento Regionais, Consultoria, Observação de Aula etc.) — seja diretamente, seja simulando esses perfis a partir de um admin.

### Por que está acontecendo

Ao inspecionar as políticas RLS atuais da tabela `instrument_responses`, existem políticas para:

- N1 admin → ALL (manage)
- N2/N3 → **somente SELECT** (`N2N3 Managers view instrument_responses`)
- N4/N5 → INSERT / UPDATE / DELETE / SELECT (próprio + compartilhado)
- N6/N7 → INSERT / UPDATE / SELECT
- N8 → INSERT / SELECT

Ou seja, **N2 e N3 não têm policy de INSERT nem UPDATE**. Como as políticas RLS são permissivas e operam por OR, qualquer tentativa de gravar como Gestor ou Coordenador é negada — e o Postgres devolve exatamente a mensagem do toast da imagem.

Isso é incoerente com a memória do projeto:
- N2/N3 podem gerenciar/realizar ações dos seus programas (`coordinator-action-management`, `ownership-based-management`).
- A tabela `presencas` (gêmea conceitual) já tem INSERT/UPDATE/DELETE para N2/N3.

### O que fazer

Adicionar as policies que faltam em `instrument_responses`, no mesmo padrão de `presencas`, restritas a registros de ação cujo `programa` pertença ao Gestor/Coordenador.

### Migração

```sql
-- INSERT
CREATE POLICY "N2N3 Managers insert instrument_responses"
ON public.instrument_responses
FOR INSERT TO public
WITH CHECK (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);

-- UPDATE
CREATE POLICY "N2N3 Managers update instrument_responses"
ON public.instrument_responses
FOR UPDATE TO public
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);

-- DELETE (opcional, mesmo padrão)
CREATE POLICY "N2N3 Managers delete instrument_responses"
ON public.instrument_responses
FOR DELETE TO public
USING (
  (is_gestor(auth.uid()) OR has_role(auth.uid(), 'n3_coordenador_programa'))
  AND EXISTS (
    SELECT 1 FROM registros_acao r
    JOIN user_programas up ON up.user_id = auth.uid()
    WHERE r.id = instrument_responses.registro_acao_id
      AND r.programa IS NOT NULL
      AND up.programa::text = ANY (r.programa)
  )
);
```

Sem alterações de código no frontend — somente as policies novas.

### Observação

Se o erro foi visto enquanto **simulando** N2/N3 a partir de um admin: a simulação é só client-side; a sessão real do Supabase continua sendo admin, então a policy de admin permitiria. Nesse caso, confirme se o erro também ocorre com um usuário N2/N3 real — o cenário coberto por este plano. Se ocorre **logado como admin real**, precisamos de mais um detalhe (qual ação/formulário) antes de migrar.