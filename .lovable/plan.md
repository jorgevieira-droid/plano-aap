# Novas perguntas Sim/Não nos registros do Programa Escolas

## O que muda
1. **Prática Essencial 1 e 2** — duas perguntas novas, "Desenvolveu a Prática Essencial 1?" e "Desenvolveu a Prática Essencial 2?", com resposta Sim ou Não. Elas entram no registro destas ações:
   - Aula compartilhada com prof. (no sistema existe uma só ação de Aula Compartilhada, então "Aula Compartilhada" e "Aula Compartilhada com Prof." são tratadas como a mesma)
   - Apoio Presencial com a Coordenação
   - Planejamento conjunto com prof.
   - Formação Coletiva
2. **Apoio Presencial** — duas perguntas novas, "Material Horizonte?" e "Material Coruja?", também com resposta Sim ou Não.

## Regras
- As quatro perguntas são obrigatórias nos registros novos. Ao salvar sem resposta, aparece um aviso.
- Elas ficam antes de "Anotações", e a numeração das perguntas seguintes é ajustada.
- Os registros antigos não mudam e aparecem com essas perguntas em branco.
- As respostas aparecem na visualização e na impressão de cada registro.
- Os relatórios e a Reunião Mensal não mudam por enquanto.

## Detalhes técnicos
- Chaves novas em `instrument_responses.responses`: `desenvolveu_pratica_1`, `desenvolveu_pratica_2`, `material_horizonte`, `material_coruja`. Não há migração de banco.
- Usar `SimNaoField` em `AulaCompartilhadaContent`, `PlanejamentoConjuntoContent`, `FormacaoCoordenadorContent` e `FormacaoColetivaContent` (em `OlharParceiroContents`) e em `RegistroApoioPresencialContent`.
- Atualizar as validações: `validateAulaCompartilhada`, `validatePlanejamentoConjunto`, as validações de Formação Coletiva e Apoio com a Coordenação, e a lista `obrigatorios` do Apoio Presencial.
- Incluir as chaves na impressão: `AcaoPrintForm` e `RegistroApoioPresencialPrintSection`.
- Atualizar os arquivos de memória de cada ação.
