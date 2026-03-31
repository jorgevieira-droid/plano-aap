

# Atualizar modelo e instruções de importação de Programações em Lote

## Problema

A lista `TIPOS_IMPORTAVEIS` no dialog de importação de programações está desatualizada. Faltam tipos mais recentes do sistema (ex: `lideranca_gestores_pei`, `monitoramento_gestao`, `acomp_professor_tutor`, `pec_qualidade_aula`, `visita_voar`) e a aba de referência no Excel não lista todos os tipos não-importáveis com suas justificativas.

## Solução

### Arquivo: `src/components/forms/ProgramacaoUploadDialog.tsx`

1. **Expandir `TIPOS_IMPORTAVEIS`** para incluir os novos tipos que são agendamento simples (sem instrumento obrigatório no ato):
   - `lideranca_gestores_pei`
   - `monitoramento_gestao`
   - `acomp_professor_tutor`
   - `pec_qualidade_aula`
   - `visita_voar`

2. **Atualizar a aba "Tipos e Valores Válidos"** no template Excel:
   - Adicionar os novos tipos importáveis com suas descrições
   - Completar a lista de tipos NÃO importáveis com todas as entradas que faltam:
     - `observacao_aula_redes` (requer instrumento REDES)
     - `encontro_eteg_redes` (formulário específico REDES)
     - `encontro_professor_redes` (formulário específico REDES)
     - `participa_formacoes` (registro automático)
     - `avaliacao_formacao_participante` (preenchido pelo participante)
     - `acompanhamento_formacoes` (já listado)

3. **Atualizar a nota de aviso** na UI para mencionar que tipos com formulários REDES também não são importáveis

4. **Adicionar exemplos** no template com os novos tipos (aba de dados)

## Tipos resultantes

### Importáveis (agendamento simples)
`formacao`, `agenda_gestao`, `devolutiva_pedagogica`, `obs_engajamento_solidez`, `obs_implantacao_programa`, `obs_uso_dados`, `qualidade_acomp_aula`, `qualidade_implementacao`, `qualidade_atpcs`, `sustentabilidade_programa`, `lideranca_gestores_pei`, `monitoramento_gestao`, `acomp_professor_tutor`, `pec_qualidade_aula`, `visita_voar`

### NÃO importáveis (requerem instrumento/formulário)
`observacao_aula`, `observacao_aula_redes`, `encontro_eteg_redes`, `encontro_professor_redes`, `autoavaliacao`, `lista_presenca`, `participa_formacoes`, `avaliacao_formacao_participante`, `acompanhamento_formacoes`

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/components/forms/ProgramacaoUploadDialog.tsx` | Expandir tipos importáveis, atualizar template Excel e instruções na UI |

