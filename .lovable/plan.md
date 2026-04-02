

# Atribuir programas aos formulários sem indicação

## Problema

Na Matriz de Ações, 9 formulários aparecem sem badges de programa porque não possuem registro na tabela `form_config_settings`.

## Solução

Inserir registros na `form_config_settings` para os form_keys ausentes, atribuindo todos os três programas (`escolas`, `regionais`, `redes_municipais`) a cada um:

- `obs_uso_dados`
- `qualidade_acomp_aula`
- `qualidade_implementacao`
- `qualidade_atpcs`
- `avaliacao_formacao_participante`
- `lista_presenca`
- `lideranca_gestores_pei`
- `acomp_professor_tutor`
- `pec_qualidade_aula`

## Alteração

Uma única operação de INSERT na tabela `form_config_settings` com os 9 registros. Nenhuma alteração de código necessária — a página MatrizAcoesPage e o hook `useAcoesByPrograma` já leem dessa tabela.

## Arquivo impactado

Nenhum arquivo de código alterado. Apenas dados inseridos no banco.

