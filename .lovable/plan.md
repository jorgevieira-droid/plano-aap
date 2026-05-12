## Relatório de Ações - Programa de Regionais

Criar uma nova página de relatório dedicada ao Programa de Regionais, exibindo, por ação realizada, as rubricas respondidas, presença/entregas e o resumo de encaminhamentos.

### Escopo da página

Rota: `/relatorio-regionais`
Arquivo: `src/pages/admin/RelatorioRegionaisPage.tsx`
Componente de impressão/exportação: reutilizar `exportSectionsToPdf` e padrão visual de `RelatorioApoioPresencialPage`.

### Acesso

- Admin (N1) sempre.
- Gestor (N2) e Coordenador de Programa (N3) somente se tiverem o programa `regionais` em `user_programas`.
- Demais perfis: redirecionar para `/unauthorized`.
- Adicionar item no `Sidebar.tsx` ("Rel. Regionais", icon `ClipboardList`) para esses três perfis.

### Filtros (no topo)

- Período (data início / data fim) - aplica sobre `registros_acao.data`.
- Frente de trabalho / Regional (combo único alimentado pelas escolas vinculadas - `escolas.nome` filtradas por programa `regionais`).
- Ator do Programa (lista alfabética de `aap_id`/Formador responsável pelas ações filtradas).
- Tipo de rubrica preenchida (todos / lista das `form_type` encontradas, exceto `monitoramento_acoes_formativas` e `lista_presenca`).
- Status: realizada (default e fixo).

### Fonte de dados

Buscar `registros_acao` onde:
- `programa @> '{regionais}'`
- `status = 'realizada'`
- `tipo = 'monitoramento_acoes_formativas'` (única ação do programa)

Para cada registro, agregar:
1. **Cabeçalho da ação**: data, hora, título, descrição, tags, escola/regional, ator do programa, projeto/local quando houver.
2. **Resumo de encaminhamentos** (de `relatorios_monit_acoes_formativas`): fechamento, encaminhamentos, observações, avanços, dificuldades.
3. **Presenças/Entregas** (de `presencas` + join `professores`): lista de participantes com presente/ausente e total presente/total convidados; "entregas" = mesma lista marcada como presente é considerada entrega quando a ação tiver materiais previstos (exibir contagem; se a ação não usar entregas, omitir essa coluna).
4. **Rubricas respondidas** (de `instrument_responses` ligadas ao mesmo `registro_acao_id`, exceto `monitoramento_acoes_formativas` e `lista_presenca`): para cada resposta, mostrar nome do instrumento, e a tabela de questões/notas usando `instrument_fields` para os labels e `responses` (jsonb) para os valores. Renderizar dimensões agrupadas com média, mantendo padrão usado em `RelatorioConsultoriaVisualizacaoPage`.

### Layout

```text
[Filtros] [Botões: Exportar PDF | Exportar Excel | Imprimir]

[Cards-resumo no topo]
- Total de ações realizadas
- Ações com rubrica preenchida
- Total de participantes presentes
- Média geral das rubricas (1-4)

[Lista de ações (cards expansíveis)]
  Ação 1 - data - escola - ator
    > Encaminhamentos (texto)
    > Presenças (tabela compacta)
    > Rubricas (uma seção por instrumento, com tabela de critérios)
  Ação 2 ...
```

Cada card vira uma `data-pdf-section` para quebra de página no PDF (mesmo padrão de outros relatórios).

### Exportações

- **PDF**: `exportSectionsToPdf` percorrendo cada `data-pdf-section`; cabeçalho dual Bússola + Parceiros da Educação; rodapé com data e usuário gerador.
- **Excel**: 3 abas - "Ações" (resumo + encaminhamentos), "Presenças" (uma linha por participante), "Rubricas" (uma linha por critério respondido).

### Banco de dados

Não requer migração. Usa apenas tabelas existentes:
- `registros_acao`, `programacoes` (para projeto/local/tags do agendamento original)
- `relatorios_monit_acoes_formativas`
- `presencas` + `professores`
- `instrument_responses` + `instrument_fields`
- `escolas`, `profiles`

### Detalhes técnicos

- React Query para cada bloco principal (ações, rubricas, presenças) com `enabled: allowed`.
- Ordenar tudo A-Z com `localeCompare('pt-BR', { sensitivity: 'base' })` conforme padrão do projeto.
- Reaproveitar `InstrumentDimensionCharts` para o resumo agregado de rubricas, exibido logo após os filtros.
- Sem alterações em fluxos existentes (Programação, Registros, Monitoramento Dialog).
