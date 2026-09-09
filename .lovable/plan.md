# Campo Componente unificado em Aula Compartilhada e Planejamento Conjunto

Fazer com que as ações **Aula compartilhada com prof.** (`registro_aula_compartilhada`) e **Planejamento conjunto com prof.** (`registro_planejamento_conjunto`) usem no campo **Componente** as mesmas opções do **Apoio Presencial**:

`LP · OE LP · Tutor LP · MAT · OE MAT · TUTOR MAT · Regente EFAI · Colaborativo EFAI · Tutor EFAI`

(ou seja, a lista oficial do Apoio Presencial sem as opções "MAT VOAR" e "LP VOAR", mantendo os rótulos no padrão já usado nessas telas: "Tutor LP", "Regente EFAI", "Colaborativo EFAI").

## Estado atual (verificado no código)

- `src/pages/admin/ProgramacaoPage.tsx`:
  - **Planejamento Conjunto** usa a lista local `PLANEJ_COMPONENTE_OPTIONS` (Língua Portuguesa, Matemática, Polivalente, OE LP, OE MAT, Tutor LP, Tutor MAT) com mapa `PLANEJ_COMPONENTE_ENUM` para o enum `componente` e texto salvo em `apoio_componente`.
  - **Aula Compartilhada** usa o seletor genérico de `componente` (enum: língua portuguesa / matemática / polivalente etc.) — ramo de `showComponente && tipo !== "registro_planejamento_conjunto"`.
- A lista oficial do Apoio Presencial é `APOIO_COMPONENTE_OPTIONS_NEW` em `src/components/formularios/apoioPresencialShared.ts` (inclui MAT VOAR / LP VOAR, que não entram aqui).

## Alterações previstas

Arquivo principal: `src/pages/admin/ProgramacaoPage.tsx`

1. **Nova lista compartilhada** com as 9 opções acima (ex.: `APOIO_COMPONENTE_OPTIONS_ESCOLAS` em `apoioPresencialShared.ts`, ou constante local derivada de `APOIO_COMPONENTE_OPTIONS_NEW` filtrando VOAR e ajustando rótulos de exibição), reutilizada pelos dois formulários.
2. **Planejamento Conjunto**: trocar `PLANEJ_COMPONENTE_OPTIONS` pela nova lista; estender `PLANEJ_COMPONENTE_ENUM` para mapear as novas opções ao enum base (`LP`/`OE LP`/`Tutor LP` → `lingua_portuguesa`; `MAT`/`OE MAT`/`TUTOR MAT` → `matematica`; EFAI → `polivalente`), mantendo o texto salvo em `apoio_componente`.
3. **Aula Compartilhada**: incluir o tipo na condição do seletor dedicado (mesmo padrão do Planejamento: select de texto com `formApoioComponente` + mapa para o enum) e excluí-lo do seletor genérico; passar a salvar `apoio_componente` também para esse tipo (hoje o `spread` da linha ~1823 salva só professor/turma).
4. **Edição de registros existentes**: ao abrir uma ação antiga, valores legados de `apoio_componente`/`componente` continuam sendo exibidos (manter compatibilidade: se o valor antigo não estiver na nova lista, mostrar como está ou mapear para o equivalente).

## Relatórios

5. Verificar e ajustar as distribuições por Componente nos painéis:
   - `RelatoriosPlanejamentoConjuntoPanelPage.tsx` — passar a ler/agrupar por `apoio_componente` com os novos rótulos.
   - `RelatoriosAulaCompartilhadaPanelPage.tsx` — idem (hoje provavelmente usa o enum `componente`).
   - `RelatoriosGestaoEscolasPage.tsx` (Indicadores - Caê usa Apoio Presencial — sem mudança, só confirmar).

## Fora de escopo

- Sem migration no banco (a coluna `apoio_componente` já existe; o enum `componente` continua recebendo valor mapeado).
- Não alterar o campo Componente do Apoio Presencial nem de outras ações.
- Dados históricos não são regravados; apenas a exibição é normalizada.

## Validação

- `npx tsgo --noEmit -p tsconfig.app.json`.
- Verificar no preview o cadastro das duas ações com as 9 opções e a distribuição por componente nos dois relatórios.
