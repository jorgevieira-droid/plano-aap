## Objetivo

Remover as 5 perguntas genéricas do cadastro/edição de **todas** as ações:

1. Foi possível realizar o fechamento gerando encaminhamentos?
2. Principais encaminhamentos da ação
3. Observações
4. Avanços
5. Dificuldades

Esses campos aparecem hoje no formulário de criação/edição de ação em `ProgramacaoPage` (visível, por exemplo, ao cadastrar um "Registro de Apoio Presencial") e também na edição em `RegistrosPage`. Eles devem deixar de aparecer para todos os tipos de ação.

## Mudanças

### 1) `src/pages/admin/ProgramacaoPage.tsx`
- Remover o bloco JSX das linhas ~3494–3562 (`Fechamento`, `Encaminhamentos`, `Observações`, `Avanços`, `Dificuldades`), incluindo o `{formData.tipo !== "monitoramento_acoes_formativas" && ...}` que o envolve. Nenhum tipo de ação passará a exibir esses campos.
- Manter os estados (`formFechamento`, `formEncaminhamentos`, `formObservacoes`, `formAvancos`, `formDificuldades`) e seus envios para o banco — apenas ficarão sempre vazios. Isso preserva compatibilidade com registros antigos sem alterar o schema.

### 2) `src/pages/admin/RegistrosPage.tsx`
- Remover o bloco JSX das linhas ~2752–2809 do diálogo de edição (os 5 mesmos campos).
- Manter os estados `editObservacoes`, `editAvancos`, `editDificuldades`, `editFechamento`, `editEncaminhamentos` e a persistência atual (eles continuarão recebendo o valor existente ao abrir e salvando como estão), apenas não serão mais editáveis na UI.

### Fora do escopo
- Manter a exibição read-only desses campos no modal de visualização (linhas ~1964–2001 do RegistrosPage), pois registros antigos podem já ter conteúdo gravado.
- Manter o export CSV ("Avanços", "Dificuldades" na linha ~1292) sem alteração.
- Não mexer no `MonitoramentoRegionaisManageDialog` nem no `MonitoramentoAcoesFormativasForm`, onde "Encaminhamentos / Fechamento / Avanços" pertencem ao instrumento específico desses fluxos (já obrigatórios e parte da regra de negócio).
- Não alterar o schema do banco (`registros_acao.avancos`, `dificuldades`, `observacoes` etc. permanecem).
- Print/PDF (`AcaoPrintDialog`/`AcaoPrintForm`) já não inclui esses campos genéricos — sem alteração.