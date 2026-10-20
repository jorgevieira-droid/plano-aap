# Painel - Microciclos: listagem de Atores Educacionais

## O que muda
Nova seção **"Atores Educacionais — Horas de formação e presença"**, abaixo das tabelas Por Rede / Por Escola.

Colunas (uma linha por ator educacional que estava na lista de presença de algum Encontro Formativo – Microciclos):
- Nome, Cargo, Rede, Escola, Turma
- Encontros previstos (em quantos encontros estava na lista)
- Presenças (em quantos esteve presente)
- % de presença
- **Horas de formação** (soma das horas dos encontros em que esteve presente)

Comportamento:
- Segue os filtros do topo (período, programa, Rede, Escola); o clique em uma Rede também filtra a lista.
- Campo de busca por nome e ordenação A-Z por padrão (clique no cabeçalho ordena por horas ou %).
- Atores removidos da lista de presença não entram na contagem.
- Paginação para listas longas, cabeçalho fixo.
- Botão **Excel** da página ganha uma aba "Atores".
- **PDF**: nova seção com a tabela de atores (dividida em blocos com "(continuação)"); com uma Rede selecionada, só os atores dela.

## Correção junto
No PDF enviado, a memória de cálculo mostra "maior carga do período (0h)" mesmo com 82,4h. Vou corrigir para mostrar o valor certo.

## Detalhes técnicos
- Arquivo: `src/pages/admin/PainelMicrociclosPage.tsx`.
- Reaproveita as `presencas` já buscadas dos registros de microciclos (busca em blocos de 1.000) + `professores` (nome, cargo, escola_id, entidade_filho_id, turma_formacao), excluindo removidos.
- Horas por encontro = `calcularHorasFormacao(horario_inicio, horario_fim)` da programação, somadas só quando `presente = true`.
- Sem mudança no banco nem nas permissões.

## Verificação
Abrir o painel no preview, conferir a tabela com e sem filtro de Rede, exportar Excel e PDF e checar as páginas.
