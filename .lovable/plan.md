

## Incluir "Encontro Formativo – Microciclos de Recomposição" em Configurar Formulários

### Problema
A nova ação não aparece no dropdown da página `/admin/configurar-formulario` porque está faltando na constante `INSTRUMENT_FORM_TYPES` (`src/hooks/useInstrumentFields.ts`).

A tabela `instrument_fields` já tem os 18 campos cadastrados (cabeçalho, 10 itens 0-2, Plataforma Trajetórias, encaminhamentos), e `form_config_settings` já tem o registro do form com os 3 programas — feito na migração da implementação anterior.

### Mudança (1 linha)

**`src/hooks/useInstrumentFields.ts`** — adicionar entrada na lista:
```ts
{ value: 'encontro_microciclos_recomposicao', label: 'Encontro Formativo – Microciclos de Recomposição' },
```

### Resultado automático
- Aparece no dropdown da página, ordenado A-Z.
- Mostra os 18 campos cadastrados no `instrument_fields`.
- Permite ao N1 ativar/desativar e marcar como obrigatório por perfil (N1-N8).
- Permite editar quais programas exibem o formulário (Escolas / Regionais / Redes).
- Preview usa o `RedesFormPreview` (já registrado para esse tipo na implementação anterior).

### Permissões
A página `/admin/configurar-formulario` já é restrita a N1 via rota protegida — nenhuma mudança de permissão necessária.

