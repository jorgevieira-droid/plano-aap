---
name: Formação Coletiva (Programa Escolas)
description: Perguntas, obrigatoriedade e painel da ação registro_formacao_coletiva
type: feature
---
Chave técnica: `registro_formacao_coletiva` (rótulo visual "Formação Coletiva").

Cadastro: Título, Descrição, Tags e Hora início/fim ocultos (título automático "Formação Coletiva").

Registro (todas obrigatórias, exceto Anotações):
1. Tema
2. Quantidade de professores participantes
3. Papel de atuação da consultoria (`formato`): Liderança da mediação | Co-liderança da mediação | Co-construção de pauta com PAAC/CGP para ele mediar
4. Como o coordenador/PAAC participou da construção da pauta? (`participacao_pauta`): Não participou (0) | Apenas validou (1) | Trouxe sugestões à pauta elaborada pelo consultor (2) | Participou ativamente na ideação, construção e validação da pauta (3)
5. A formação aconteceu conforme planejada? (`conforme_planejado`): Sim | Não | Em parte — se Não/Em parte abre 5.1 Registro dos desafios (`desafios`, obrigatório)
6. Link da pauta (`link_pauta`)
7. Anotações (`anotacoes_formacao`, opcional)

Removidos: NPS da formação e Destaques e desafios (campos legados `nps` e `destaques_desafios` podem existir em registros antigos; não são exibidos).

Valores legados de `formato`/`participacao_pauta` são normalizados na leitura por `normalizePapelFormacaoColetiva` / `normalizeParticipacaoPauta`.

Painel `/relatorios-formacao-coletiva`: sem indicadores de NPS; distribuições por papel, participação na pauta e conformidade com o planejado; rankings escola/consultor; evolução mensal (volume, professores, pauta 0-3); listas de temas (com link), desafios e anotações — tudo no PDF.
