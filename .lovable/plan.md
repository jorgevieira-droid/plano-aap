

# Correções nos formulários de Encontro REDES

## Problemas

1. **Campo "Local"** não aparece nos formulários de agendamento de `encontro_eteg_redes` e `encontro_professor_redes` — a condição na UI só mostra para `formacao`.
2. **Persistência do "Local"** — o INSERT só salva `local` quando `tipo === 'formacao'`, ignorando os tipos REDES.
3. **Programa pré-preenchido** — para `encontro_professor_redes` e `encontro_eteg_redes`, o programa deveria estar fixo em `redes_municipais` (único programa habilitado para essas ações na `form_config_settings`), sem permitir alteração.

## Alterações

### `src/pages/admin/ProgramacaoPage.tsx`

**a) Exibir campo "Local" para REDES (linha ~2210)**
- Alterar a condição `formData.tipo === 'formacao'` para incluir `encontro_eteg_redes` e `encontro_professor_redes`.
- O campo "Projeto (Notion)" continua exclusivo de `formacao`.

**b) Salvar `local` no INSERT para REDES (linha ~720)**
- Alterar a condição `formData.tipo === 'formacao'` para incluir os dois tipos REDES no salvamento do campo `local`.

**c) Programa fixo para tipos REDES**
- Quando o tipo selecionado for `encontro_eteg_redes` ou `encontro_professor_redes`, forçar `programa` para `['redes_municipais']` e desabilitar o dropdown de programa.
- Isso garante que o programa venha previamente preenchido e não seja alterável.

## Arquivos impactados

| Arquivo | Alteração |
|---|---|
| `src/pages/admin/ProgramacaoPage.tsx` | Condição do campo Local, persistência do Local, e programa fixo para REDES |

