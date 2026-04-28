-- Conceder SELECT em colunas seguras das tabelas-base para que as views security_invoker funcionem
GRANT SELECT (id, nome, segmento, componente, created_at, updated_at) 
  ON public.profiles TO metabase_ro;

GRANT SELECT (id, nome, escola_id, segmento, componente, ano_serie, cargo, ativo, programa, turma_formacao, created_at, updated_at, data_desativacao) 
  ON public.professores TO metabase_ro;