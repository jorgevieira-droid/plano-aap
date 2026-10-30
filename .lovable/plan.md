# Ações realizadas sem formulário: mostrar como pendentes no Relatório de Gestão

## O que muda para o usuário
- O Relatório de Gestão - Programa Escolas ganha um quadro **"Ações realizadas sem formulário"**.
- O quadro fica logo abaixo dos filtros e segue os mesmos filtros: período, consultor(a), escola e as regras de quem vê o quê. O N4, por exemplo, vê só as ações dele.
- O quadro mostra quantas ações estão nessa situação, por tipo: Apoio Presencial, Aula compartilhada, Planejamento conjunto, Formação Coletiva, Apoio com a Coordenação e Reunião com o Professor.
- Também mostra uma lista com Data, Tipo, Escola e Consultor(a), para quem for cobrar o preenchimento.
- Os totais e gráficos do relatório não mudam e continuam contando só as ações com formulário.
- No caso do Jefferson, o Planejamento conjunto de 21/10 (EVANDRO CAIAFA ESQUIVEL) aparece nessa lista.

## Detalhes técnicos
- Página: `RelatoriosGestaoEscolasPage.tsx`.
- Nova consulta paginada em `registros_acao` com status realizada, programa escolas e os tipos de formulário da página. As ações que já têm resposta em `instrument_responses` ficam de fora.
- Aplicar os mesmos filtros e o mesmo escopo N4 já usados em `filtered`.
- Lista ordenada por data, com tabela de altura limitada (`max-h-[70vh]`, cabeçalho fixo).
- Sem alteração no banco.
