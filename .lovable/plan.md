# Ajuste do rótulo "COLABORATIVO TUTOR EFAI" para "COLABORATIVO EFAI" no Apoio Presencial

## Contexto
No campo **Componente** da ação/evento **Apoio Presencial**, a última opção da lista oficial deve mudar de **"COLABORATIVO TUTOR EFAI"** para **"COLABORATIVO EFAI"**.

## Mudança
1. Em `src/components/formularios/apoioPresencialShared.ts`, alterar `APOIO_COMPONENTE_OPTIONS_NEW`:
   - De `"COLABORATIVO TUTOR EFAI"` para `"COLABORATIVO EFAI"`.
2. Em `src/pages/admin/ProgramacaoPage.tsx`, substituir o array local `APOIO_COMPONENTE_OPTIONS` por importação de `APOIO_COMPONENTE_OPTIONS_NEW` para evitar duplicação e garantir consistência.
3. Normalizar o rótulo legado nos relatórios, para que registros antigos gravados como `"COLABORATIVO TUTOR EFAI"` passem a ser exibidos como `"COLABORATIVO EFAI"`:
   - `src/pages/admin/RelatoriosGestaoEscolasPage.tsx` (bloco "Indicadores - Caê", distribuição por componente).
   - `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx` (tabela "Total de Apoio por componente" e listagem de apoios).
   - `src/pages/admin/RelatorioApoioPresencialPage.tsx` (exportação em Excel, se houver agrupamento por componente).
4. Ordenação alfabética A–Z em português e layout dos relatórios permanecem inalterados.

## Não muda
- Nomes de colunas/tabelas no banco de dados.
- Demais ações/eventos (Planejamento Conjunto, Formação Coletiva, etc.).
- Validações ou obrigatoriedade do campo Componente.

## Validação
- Typecheck do projeto.
- Abrir formulário de **Apoio Presencial** e confirmar que a opção aparece como **"COLABORATIVO EFAI"**.
- Verificar relatórios de Apoio Presencial e "Indicadores - Caê" para garantir que registros antigos com o texto anterior aparecem agrupados sob o novo rótulo.
