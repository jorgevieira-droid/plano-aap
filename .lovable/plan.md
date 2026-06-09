## Causa raiz

O gerenciamento de Visitas Técnicas – Microciclos pode ser aberto a partir de **dois lugares**:

1. `RegistrosPage.tsx` (linha ~3181) — já corrigido na rodada anterior, recebe `entidadeFilhoId`.
2. `ProgramacaoPage.tsx` (linha ~5613) — **NÃO** estava passando `entidadeFilhoId`. A imagem do usuário mostra exatamente este caso (rota `/programacao`).

Por isso o campo "Escola*" continua aparecendo como Select vazio: a prop `entidadeFilhoId` chega `undefined` e o form cai no fallback (Select tradicional).

## Ajuste

### `src/pages/admin/ProgramacaoPage.tsx` (chamada do form em ~5613)
Passar `entidadeFilhoId={selectedProgramacao.entidade_filho_id || undefined}` ao montar `<VisitaTecnicaMicrociclosForm>`.

Nenhuma outra alteração necessária — a lógica de travar/preencher o campo já existe no form e o `selectedProgramacao` já contém `entidade_filho_id` (carregado na lista de programações).

## Fora de escopo
- Mudanças no form ou no schema.
- Outras chamadas do form.
