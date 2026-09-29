# Evidência da Prática Essencial + contagem por Consultor

## 1. Formulário "Registro de Apoio Presencial" (Escolas)
- Abaixo de cada rubrica de prática essencial exibida (1ª, 2ª e 3ª), novo campo de texto longo **"Evidência sobre a prática essencial"**.
- Obrigatório quando a rubrica aparece (ou seja, quando "Você observou práticas essenciais?" = Sim; para a 2ª/3ª, quando "outra prática" = Sim). Ao salvar sem preencher, aparece o aviso "Informe a evidência sobre a prática essencial".
- Ao marcar "Não", o campo correspondente é limpo (mesmo comportamento atual das notas).
- A evidência também aparece na visualização/impressão do registro.
- Registros antigos não são afetados (não serão exigidos retroativamente ao apenas visualizar).

## 2. Relatórios de Gestão - Programa Escolas → tabelas "Apoios por Consultor(a)" e "Professores Apoiados"
- Nova coluna **"Prática Essencial Observada"** nas duas tabelas: quantos Apoios Presenciais (do consultor / do professor) tiveram "observou práticas essenciais" = Sim (nesta etapa, somente a 1ª prática — Retomada).
- Respeita os filtros da página e entra também no Exportar Excel de cada tabela. O Total da linha não muda (é contagem de apoios, não um novo tipo de ação).

## Detalhes técnicos
- `RegistroApoioPresencialContent.tsx`: Textarea `pratica_1_evidencia` / `pratica_2_evidencia` / `pratica_3_evidencia` dentro dos blocos das rubricas; limpar nos handlers de "Não".
- `RegistroApoioPresencialForm.tsx`: validações condicionais no array `obrigatorios`.
- `RegistroApoioPresencialPrintSection.tsx`: exibir as evidências junto às notas.
- `RelatoriosGestaoEscolasPage.tsx`: adicionar `praticaObservada` ao `Counts` por consultor (`bucket === 'apoio' && resp.observou_praticas === 'Sim'`), nova coluna na tabela (~l.873–910) e no Excel (~l.547).
- Dados ficam em `instrument_responses.responses` (JSON) — sem mudança no banco.
