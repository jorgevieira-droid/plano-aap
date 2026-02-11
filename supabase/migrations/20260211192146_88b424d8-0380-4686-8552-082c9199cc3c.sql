ALTER TABLE programacoes 
  ADD COLUMN formacao_origem_id uuid REFERENCES programacoes(id);

ALTER TABLE registros_acao 
  ADD COLUMN formacao_origem_id uuid REFERENCES programacoes(id);