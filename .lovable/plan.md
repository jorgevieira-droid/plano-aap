

# Incluir seleção de Turma de Formação no Encontro ET/EG – REDES

## Problema

No agendamento de ações na Programação, o campo "Turma de Formação" aparece apenas para o tipo `encontro_professor_redes`. O tipo `encontro_eteg_redes` não exibe esse campo, embora o formulário dedicado já suporte turmas.

## Solução

Duas alterações no arquivo `src/pages/admin/ProgramacaoPage.tsx`:

1. **Exibir o campo de seleção de turma** (linha ~2083): trocar a condição de `formData.tipo === 'encontro_professor_redes'` para incluir também `encontro_eteg_redes`.

2. **Salvar o valor no banco** (linha ~665): trocar a condição de persistência de `turma_formacao` para incluir `encontro_eteg_redes`.

Ambas as condições passam de:
```
formData.tipo === 'encontro_professor_redes'
```
Para:
```
formData.tipo === 'encontro_professor_redes' || formData.tipo === 'encontro_eteg_redes'
```

## Arquivo impactado

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Incluir `encontro_eteg_redes` na condição do campo Turma de Formação (UI + persistência) |

