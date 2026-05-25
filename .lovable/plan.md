## Documentar decisão na memória do projeto

Criar nova entrada de memória registrando:

1. **Decisão arquitetural**: Programação e Registros mantêm fluxos de gerenciamento independentes. Não unificar proativamente.
2. **Regra de manutenção**: toda nova ação cadastrada deve usar `INSTRUMENT_TYPE_SET` (roteamento automático) — fluxos bespoke só para tipos legados existentes.
3. **Regra de comunicação**: respostas só devem propor refactor quando ele for **inevitável** (bug recorrente, bloqueio de feature, débito crítico). Sempre apresentar **ganhos, perdas e riscos** explicitamente antes de propor.

### Arquivos a criar/atualizar

- **Novo**: `mem://architecture/programacao-vs-registros-management` — regra de manutenção e decisão.
- **Novo**: `mem://preference/refactor-proposal-policy` — quando propor refactor e como comunicar.
- **Atualizar**: `mem://index.md` — adicionar referências às duas novas memórias e uma linha em **Core** sobre a política de refactor (aplica a toda resposta).

### Conteúdo das memórias

**`architecture/programacao-vs-registros-management`**:
- Duas páginas têm propósitos distintos (Programação = ciclo de vida; Registros = consulta/conteúdo/instrumentos).
- Fluxos bespoke por tipo em Registros são aceitos para tipos legados (`observacao_aula_redes`, `monitoramento_acoes_formativas`, `acompanhamento_aula`).
- Novos tipos devem cair automaticamente no roteador via `INSTRUMENT_TYPE_SET`.
- Refactor de unificação só se 3+ tickets de inconsistência acumularem, ou se "reagendar" / "agendar acompanhamento" for pedido como feature em Registros.
- Padrão para AlertDialogs intermediários encadeados: nunca limpar `selectedRegistro`/estado compartilhado no `onOpenChange` — só nos handlers terminais.

**`preference/refactor-proposal-policy`**:
- Não propor refactor proativamente.
- Só propor quando inevitável: bug recorrente, bloqueio de feature, débito crítico que multiplica trabalho futuro.
- Toda proposta deve listar explicitamente: **Ganhos**, **Perdas/Contras**, **Riscos**, e uma recomendação clara.
- Preferir correções pontuais sobre reescritas amplas.

