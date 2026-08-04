# Relatório Descritivo (AI) — acesso N1–N3 com filtros de programa e hierarquia

## Situação atual (verificada)

- No menu (`Sidebar.tsx`) o item já está liberado para os níveis `admin` e `manager` — e N1 (admin), N2 (gestor) e N3 (coordenador do programa) caem nesses níveis. A página (`RelatoriosNarrativosPage.tsx`) também libera por `isManager`.
- Portanto o bloqueio percebido não vem da permissão em si, e sim das consultas que alimentam a página:
  - O item do menu só aparece se houver instrumentos ativos no programa do usuário. Todos os três programas têm instrumentos configurados, então isso não deveria esconder o item — mas depende de `effectiveProgramas` estar populado (todos os 12 gestores e 18 coordenadores possuem programas vinculados).
  - A lista de instrumentos faz 13 consultas de sondagem em tabelas dedicadas usando junção obrigatória com `registros_acao`. Quatro dessas tabelas (observação de aula GPA, observação de aula REDES, visita técnica alfabetização REDES e afins) não têm relação declarada com `registros_acao`, então essas consultas falham silenciosamente. Combinado com as regras de acesso mais restritas de N2/N3, o resultado é a tela abrir sem instrumentos disponíveis ("vazia"), o que na prática parece "sem acesso".
  - Os filtros de Ator e Entidade hoje trazem tudo do programa, sem recorte hierárquico.

## O que será feito

1. **Garantir a visibilidade do menu para N1–N3**
   - Manter os níveis já permitidos e remover a dependência que pode esconder o item quando a sondagem de instrumentos falha (o item passa a exigir apenas que o usuário tenha ao menos um programa).

2. **Tornar o carregamento de instrumentos resiliente (mesmo padrão já usado em "Extração de Bases")**
   - Envolver cada consulta de sondagem em tratamento de erro individual, para que uma tabela sem relação declarada não derrube a lista inteira.
   - Para as tabelas sem relação com `registros_acao`, buscar os identificadores de registro e filtrar o programa no cliente, em blocos.
   - Se nenhuma sondagem retornar, cair no conjunto de instrumentos habilitados para o programa (configuração de formulários), evitando tela vazia.

3. **Aplicar filtros de programa e hierarquia**
   - Seletor de Programa: N1 vê os três; N2/N3 veem apenas os seus (seleção automática quando houver só um).
   - Filtro de Entidade: para N2/N3, restringir às entidades dos programas do usuário e, quando houver vínculos diretos de entidade, priorizar esses vínculos.
   - Filtro de Ator: listar apenas atores que aparecem em registros dentro do escopo já filtrado (programa + entidades visíveis), ordenado A–Z.
   - A geração do relatório sempre envia o programa e as entidades do escopo, nunca um escopo mais amplo que o do usuário.

4. **Feedback quando não houver dados**
   - Mensagem explícita ("nenhum instrumento com registros no seu escopo") em vez de listas vazias sem explicação.

## Detalhes técnicos

- Arquivos: `src/components/layout/Sidebar.tsx`, `src/pages/admin/RelatoriosNarrativosPage.tsx`.
- Sem alteração de banco: as regras de acesso já existentes continuam sendo a fonte de verdade; o recorte no cliente apenas espelha o escopo do usuário.
- Ordenações mantidas com `localeCompare('pt-BR', { sensitivity: 'base' })`.
- Validação: simular N2 e N3 (gestor e coordenador) e confirmar menu visível, programas corretos, lista de instrumentos populada e geração do relatório funcionando.
