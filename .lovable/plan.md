

# Ajustes no formulário de Observação de Aula REDES

## Arquivo: `src/components/formularios/ObservacaoAulaRedesForm.tsx`

### 1. Trocar rótulo "Entidade" → "Rede"
- Linhas 171 e 176: alterar `FormLabel` de "Entidade*" para "Rede*"
- Linha 178: alterar placeholder de "Selecione a entidade" para "Selecione a rede"

### 2. Substituir "Nome da Escola" (input livre) por dropdown de Entidade Filho
- Adicionar estado local para buscar `entidades_filho` do banco, filtradas pela rede (entidade) selecionada
- Remover o campo `nome_escola` como `<Input>` livre (linha 196-198)
- Inserir um `<Select>` com rótulo "Escola*", desabilitado até que uma Rede seja selecionada
- Ao selecionar a Rede, buscar `entidades_filho` com `escola_id` correspondente ao id da entidade selecionada
- Atualizar o schema: `nome_escola` continua como string (armazenará o nome da entidade filho selecionada)
- Necessário ajustar `entidades` prop para incluir `id` (já inclui) para fazer o lookup de `escola_id`
- Ao trocar de Rede, limpar seleção de Escola

### 3. Inserir dropdown "Turma" com opções A-H abaixo de "Escola"
- Adicionar novo campo ao schema: `turma` como `z.string().min(1)` (ou opcional, conforme necessidade)
- Inserir `<Select>` com rótulo "Turma*" e opções fixas: A, B, C, D, E, F, G, H
- Posicionar na grid logo após o campo Escola
- Persistir o valor de `turma` no campo `turma_ano` ou como campo separado no payload (a tabela `observacoes_aula_redes` já tem `turma_ano`)

### 4. Alterar rótulo "Observador(a)" → "Formador"
- Linha 203: trocar `FormLabel` de "Observador(a)" para "Formador"

### 5. Remover campo "Componente"
- O formulário atual **não possui** um campo "Componente" dentro dele. Verificar se há no wizard (AAPRegistrarAcaoPage) um step de seleção de componente para ações REDES. Se sim, ocultar para `observacao_aula_redes`. Se não, nenhuma alteração necessária neste ponto.

### Detalhes técnicos

- Buscar entidades filho: `useEffect` com `supabase.from('entidades_filho').select('id, nome, escola_id').eq('ativa', true)` filtrado pelo `escola_id` da rede selecionada
- A prop `entidades` já traz `{ id, nome }[]` — será necessário mapear o `id` da entidade para buscar os filhos com `escola_id = entidade.id`
- O campo `municipio` continua armazenando o nome da Rede selecionada (compatibilidade com a tabela existente)
- O campo `nome_escola` armazenará o nome da Entidade Filho selecionada

| Arquivo | Alteração |
|---|---|
| `src/components/formularios/ObservacaoAulaRedesForm.tsx` | Rótulos, dropdown Escola (entidade filho), dropdown Turma, remoção/verificação Componente |

