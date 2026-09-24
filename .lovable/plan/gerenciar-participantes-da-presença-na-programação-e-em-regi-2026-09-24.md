# Gerenciar participantes da presença na Programação e em Registros

Vale para: Encontro Formativo – Microciclos de Recomposição, Encontro Formativo ET/EG – REDES e Encontro Formativo Professor – REDES.

## É possível? Sim.

Hoje a lista de presença da Programação/Registros mostra **todos os participantes ativos da entidade (e da turma)**, e só permite marcar Presente/Ausente. O Histórico de Presença permite **Remover** alguém daquele encontro e **Reincluir** depois.

## O que muda

1. Na janela de presença dessas 3 ações (Programação e Registros), cada participante ganha o botão **Remover** (igual ao Histórico).
2. Os removidos vão para uma seção recolhível **"Removidos deste encontro"**, com botão **Reincluir** (volta como Ausente).
3. O contador "X de Y presentes" passa a desconsiderar os removidos.
4. Os botões só aparecem para N1, N2 e N3 (mesma regra do Histórico). Os demais perfis continuam só marcando presença.
5. Programação, Registros, Lista de Presença e Histórico passam a mostrar os mesmos números para o encontro.

## Impacto (o ponto importante)

- **Hoje a remoção feita no Histórico não "fica" na Programação**: ao reabrir o encontro e clicar em Salvar Presenças, a pessoa removida volta, porque a tela monta a lista a partir de todos os ativos da entidade. Esta mudança corrige isso.
- Nova regra: **se o encontro já tem presença salva, a lista vem das presenças salvas**; os demais participantes elegíveis ficam em "Não incluídos / Removidos", podendo ser reincluídos. Se ainda não houve salvamento, a lista inicial continua sendo todos os ativos da entidade/turma (como hoje).
- Consequência: participantes **cadastrados depois** do primeiro salvamento não entram automaticamente — aparecem na seção de reinclusão e precisam ser adicionados. 
- Nenhum dado existente é apagado; não há mudança no banco. Remover = apagar a linha de presença daquele encontro (mesma ação do Histórico).
- Demais ações (Formação, Escolas etc.) não mudam.

## Observação encontrada

No print aparecem "ÉRIKA JULIÃO SEVERINO DE SOUZA" e "Érika Julião Severino de Souza": são dois cadastros diferentes da mesma pessoa. Com esta mudança dá para remover o duplicado do encontro, mas o ideal é inativar um dos cadastros em Professores/Atores.

## Detalhes técnicos

- `ProgramacaoPage.tsx` (diálogo de presença ~l.5970) e `RegistrosPage.tsx` (~l.2588): para os 3 tipos, lista = linhas de `presencas` do `registro_acao_id` quando existirem; senão elegíveis ativos/turma. Estado local `removidos`; ao salvar: `delete` dos removidos + `upsert` (`registro_acao_id, professor_id`) dos incluídos.
- Reaproveitar o padrão visual/ícones (`UserMinus`/`UserPlus`) do `HistoricoPresencaPage.tsx`; permissão via `isAdmin/isGestor/isManager`.
- Invalidar queries de presença/histórico após salvar.

## Verificação

Abrir o 5º encontro de Caraguatatuba (17/09) pela Programação, remover um participante, salvar, reabrir e conferir que ele segue fora; conferir o mesmo total no Histórico de Presença; reincluir e conferir o retorno.
