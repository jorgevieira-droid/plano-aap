# Corrigir gerenciamento de 'Visitas Técnicas - Microciclos' na Programação

## Diagnóstico

Na página **/programacao**, ao gerenciar uma ação do tipo `observacao_aula_redes` (rótulo "Visitas Técnicas - Microciclos") e responder "Sim, aconteceu", o fluxo cai no bloco genérico `INSTRUMENT_TYPE_SET` em `ProgramacaoPage.tsx` (linha ~2042) e abre o `InstrumentForm` padrão (modal "Instrumento Pedagógico" com os 9 critérios da rúbrica antiga) — esse é o "formulário errado" visto no replay.

A correção anterior tratou apenas `RegistrosPage.tsx`. A Programação tem seu próprio roteador (`handleManageSubmit`) que precisa do mesmo desvio bespoke para `observacao_aula_redes`, espelhando o que já existe em Registros (estado `isRedesManaging`, dialog `VisitaTecnicaMicrociclosForm`, gravação em `relatorios_visita_tecnica_microciclos`).

## Mudanças propostas (apenas `src/pages/admin/ProgramacaoPage.tsx`)

1. **Estado e import**
   - Importar `VisitaTecnicaMicrociclosForm`.
   - Adicionar `isRedesManaging` + `redesRegistroId` (e `redesInitial` se houver pré-carregamento).

2. **Roteamento em `handleManageSubmit`**
   - **Antes** do bloco genérico `INSTRUMENT_TYPE_SET.has(normalizedTipo)` (linha ~2042), inserir desvio:
     ```
     if (acaoRealizada && selectedProgramacao.tipo === 'observacao_aula_redes') {
       // garantir/obter registro_acao, fechar manage dialog, abrir VisitaTecnicaMicrociclosForm
       setIsManageDialogOpen(false);
       setIsRedesManaging(true);
       return;
     }
     ```
   - Não precisa do passo extra "aconteceu? / checklist?" porque o manage dialog da Programação já cobre a pergunta "Sim, aconteceu".

3. **Dialog dedicado** no JSX (próximo aos outros forms bespoke, ex.: monitoramento gestão) renderizando `VisitaTecnicaMicrociclosForm` com `programacao` selecionada, `registroId`, `onSuccess` (fecha, refetch) e `onCancel`.

4. **Edição de realizada** — `handleOpenEditRealizada` já força `acaoRealizada=true` e chama `handleManageSubmit`, então o novo desvio cobre automaticamente o caminho "Editar" de uma ação `realizada`.

## Itens fora de escopo (não tocar)

- `RegistrosPage.tsx` — já corrigido na rodada anterior.
- DB / `instrument_fields` / `relatorios_visita_tecnica_microciclos` — sem alteração.
- Demais tipos legados (`observacao_aula`, `acompanhamento_aula`, `monitoramento_acoes_formativas`) — sem alteração.

## Ganhos / Perdas / Riscos

- **Ganhos:** o formulário correto (22 perguntas, partes 1/2/3) passa a abrir também na Programação; consistência com Registros.
- **Perdas:** mais uma exceção bespoke fora de Registros — contraria parcialmente a regra "bespoke só em Registros" registrada na memória. Atualizar a memória para refletir que `observacao_aula_redes` é bespoke em ambas as páginas.
- **Riscos:** baixos. Mudança isolada num branch novo do roteador; demais tipos continuam pelo caminho atual. Verificar que `programacao_id` é gravado corretamente no `registros_acao` antes de abrir o form (já existe lookup na linha ~2052).

## Validação

- Programação → ação "Visitas Técnicas - Microciclos" prevista → "Sim, aconteceu" → deve abrir o `VisitaTecnicaMicrociclosForm` (não o "Instrumento Pedagógico" genérico).
- Editar uma ação `realizada` desse tipo → reabre o mesmo form com respostas pré-carregadas.
