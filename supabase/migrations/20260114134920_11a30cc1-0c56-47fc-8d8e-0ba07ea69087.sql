-- Adicionar campo data_desativacao na tabela professores
ALTER TABLE public.professores 
ADD COLUMN data_desativacao TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Comentário para documentação
COMMENT ON COLUMN public.professores.data_desativacao IS 'Data em que o professor foi desativado. NULL se estiver ativo.';