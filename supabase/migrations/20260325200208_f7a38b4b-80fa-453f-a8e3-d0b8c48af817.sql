-- Backfill: create registros_acao for orphan programacoes that have no linked registro
INSERT INTO registros_acao (aap_id, ano_serie, componente, data, escola_id, programa, programacao_id, segmento, tipo, status)
SELECT p.aap_id, p.ano_serie, p.componente, p.data, p.escola_id, p.programa, p.id, p.segmento, p.tipo, 'agendada'
FROM programacoes p
WHERE p.status = 'prevista'
  AND NOT EXISTS (SELECT 1 FROM registros_acao r WHERE r.programacao_id = p.id);