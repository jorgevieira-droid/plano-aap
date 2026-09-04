-- 1) Consolidar duplicatas: manter a linha mais recente por (registro_acao_id, professor_id)
DELETE FROM public.presencas p
USING public.presencas q
WHERE p.registro_acao_id = q.registro_acao_id
  AND p.professor_id = q.professor_id
  AND (p.created_at, p.id) < (q.created_at, q.id);

-- 2) Impedir reincidência
ALTER TABLE public.presencas
  ADD CONSTRAINT presencas_registro_professor_unique
  UNIQUE (registro_acao_id, professor_id);