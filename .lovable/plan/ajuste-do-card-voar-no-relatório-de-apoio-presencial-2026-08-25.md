# Ajuste do card VOAR no Relatório de Apoio Presencial

## Objetivo
Fazer com que o card **"APOIOS EM TURMAS ADAPTADAS VOAR"** na página **Relatórios - Apoio Presencial** conte registros cuja resposta à pergunta **"Turma do VOAR"** seja **"Sim"**.

## Diagnóstico confirmado
- A pergunta é renderizada no componente `RegistroApoioPresencialContent.tsx` com a chave `turma_voar` e respostas do tipo `RadioGroup` (`Sim` / `Não`).
- O banco de dados possui valores `Sim` ou `null` para essa chave; não existe texto "adaptada" salvo na resposta.
- Hoje o KPI faz `(r.resp.turma_voar || '').toString().toLowerCase().includes('adapt')`, o que sempre resulta em `0`.

## O que será alterado
1. Em `src/pages/admin/RelatoriosApoioPresencialPanelPage.tsx`:
   - No `useMemo` de KPIs (`kpis`), trocar a condição de `includes('adapt')` para `r.resp.turma_voar === 'Sim'`.
   - Na função `handleExport` / `pdfKpis`, garantir que o mesmo valor `kpis.voarAdaptada` seja utilizado, preservando o card no PDF.

2. Nenhuma mudança de schema, migrations, RLS ou novas dependências é necessária.

## Validação
- Recarregar a página **Relatórios - Apoio Presencial** e verificar que o card VOAR passa a refletir o número de respostas `Sim`.
- Exportar o PDF e confirmar que o card mantém o mesmo valor e o cabeçalho/estilo não são afetados.
