## Objetivo

Exibir o **título da ação** na página **Registros de Ações** (`/registros`), hoje ausente da tabela (as colunas são Data, Tipo, Escola/Regional/Rede, Consultor/Gestor/Formador, Segmento, Status, Presença/Avaliações, Ações).

## Onde o dado já existe

O título não fica em `registros_acao`; ele vem da `programacao` vinculada. A página já carrega a lista de `programacoes` incluindo o campo `titulo` (select na linha ~465) e já faz lookups por `registro.programacao_id` em vários pontos. Ou seja, nenhuma consulta nova é necessária.

## Mudanças (apenas `src/pages/admin/RegistrosPage.tsx`)

1. Criar um helper `getTituloAcao(registro)` que resolve `programacoes.find(p => p.id === registro.programacao_id)?.titulo`, com fallback para o label do tipo da ação (`ACAO_TYPE_INFO[...]?.label`) quando o registro não tiver programação vinculada ou o título estiver vazio.
2. Inserir uma nova coluna `titulo` — cabeçalho **"Título da Ação"** — logo após a coluna **Tipo** e antes de **Escola / Regional / Rede**.
   - Estilo alinhado ao restante da tabela: `text-[10px] leading-tight line-clamp-2`, largura `max-w-[200px]`.
   - Tooltip com o título completo quando truncado.
3. Incluir a coluna **Título** na exportação para Excel (na montagem das linhas por volta da linha 1518), posicionada junto com Data/Tipo.

## Observações

- Ajuste puramente de apresentação: nenhuma alteração de banco, permissões ou lógica de filtros.
- As demais colunas mantêm posição e comportamento; a tabela já é responsiva com scroll horizontal.
