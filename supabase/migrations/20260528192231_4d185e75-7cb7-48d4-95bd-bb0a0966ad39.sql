ALTER TABLE public.registros_acao DISABLE TRIGGER USER;
DELETE FROM public.registros_acao WHERE data < '2000-01-01' OR data > '2100-12-31';
ALTER TABLE public.registros_acao ENABLE TRIGGER USER;

DELETE FROM public.programacoes WHERE data < '2000-01-01' OR data > '2100-12-31';