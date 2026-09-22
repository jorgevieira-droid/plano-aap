# Prática essencial: "Não" como valor padrão

## Problema
No formulário **Apoio Presencial**, a pergunta "Você observou práticas essenciais?" (`observou_praticas`) inicia sem resposta. Quando o usuário não marca nada, o registro pode ser salvo sem valor ou interpretado incorretamente nas contagens do painel.

## Correção

1. **Valor padrão "Não" pré-selecionado** — em `src/components/formularios/RegistroApoioPresencialForm.tsx`:
   - Inicializar o estado com `observou_praticas: 'Não'` ao abrir um formulário **novo** (sem resposta salva).
   - Ao carregar uma resposta existente do banco, manter o valor já salvo (não sobrescrever registros antigos).

2. **Painel "Relatórios - Apoio Presencial"** — em `RelatoriosApoioPresencialPanelPage.tsx`:
   - Tratar registros sem resposta (`vazio/null`) como **"Não"** na contagem "com e sem observação de práticas essenciais", garantindo que nenhum registro fique fora da conta e nada seja contado como "Sim" por engano.

3. **Registros históricos** — nenhuma alteração em massa no banco; apenas a leitura do painel passa a tratar vazio como "Não".

## Validação
- Abrir um novo registro de Apoio Presencial e confirmar que "Não" já vem marcado.
- Conferir no painel que a soma "com observação" + "sem observação" bate com o total de apoios filtrados.
- Rodar `npx tsgo --noEmit -p tsconfig.app.json`.
