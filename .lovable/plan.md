

# Adicionar "Registro de Consultoria Pedagógica" ao Configurar Formulários

## Resumo

Tornar o formulário de Consultoria Pedagógica configurável na página "Configurar Formulários", permitindo que o N1 habilite/desabilite campos por perfil e controle os programas habilitados.

## Alterações

### 1. Migração SQL — seed de campos em `instrument_fields`

Inserir os campos do formulário de Consultoria na tabela `instrument_fields` com `form_type = 'registro_consultoria_pedagogica'`, agrupados por dimensão:

- **Participantes**: `participantes`, `participantes_outros`
- **Agenda**: `agenda_planejada`, `agenda_alterada`, `agenda_alterada_razoes`
- **Ações Formativas – Professores**: `aulas_obs_lp`, `aulas_obs_mat`, `aulas_obs_oe_lp`, `aulas_obs_oe_mat`, `aulas_tutoria_obs`, `aulas_obs_turma_padrao` (VOAR), `aulas_obs_turma_adaptada` (VOAR), `professores_observados`, `devolutivas_professor`, `atpcs_ministrados`
- **Ações Formativas – Coordenação**: `aulas_obs_parceria_coord`, `devolutivas_model_coord`, `acomp_devolutivas_coord`, `atpcs_acomp_coord`, `devolutivas_coord_atpc`
- **Questões Finais**: `analise_dados`, `pauta_formativa`, `boas_praticas`, `pontos_preocupacao`, `encaminhamentos`, `outros_pontos`

### 2. `src/hooks/useInstrumentFields.ts`

Adicionar entrada ao array `INSTRUMENT_FORM_TYPES`:
```
{ value: 'registro_consultoria_pedagogica', label: 'Registro da Consultoria Pedagógica' }
```

### 3. `src/components/formularios/ConsultoriaPedagogicaForm.tsx`

Integrar o hook `useFormFieldConfig` para respeitar campos habilitados/obrigatórios por perfil do usuário logado. Campos desabilitados são ocultados; campos obrigatórios são validados antes do submit.

| Arquivo | Alteração |
|---|---|
| Migração SQL | Seed 22+ campos em `instrument_fields` |
| `src/hooks/useInstrumentFields.ts` | Adicionar ao `INSTRUMENT_FORM_TYPES` |
| `src/components/formularios/ConsultoriaPedagogicaForm.tsx` | Respeitar `form_field_config` por perfil |

