
## Visão geral

Três entregas independentes:

1. **Botão de impressão por ação no calendário/programação** — disponível para **todos os níveis** (N1–N8). Gera PDF do formulário da ação com os dados já inseridos; campos sem dados ficam em branco.
2. **Nova página "Visualização Consultoria Pedagógica"** — gráficos + PDF. Restrita a N1 (admin) e N2/N3 do programa "Escolas".
3. **Nova página "Visualização Apoio Presencial"** — gráficos + PDF + tabela top/bottom 3. Restrita a N1 (admin) e N2/N3 do programa "Escolas".

---

## 1. Botão de impressão no card de ação (Programação)

**Disponibilidade:** todos os níveis (N1, N2, N3, N4.1, N4.2, N5, N6, N7, N8 e perfis AAP). A RLS já garante que cada usuário só enxerga as ações que pode ver.

**Arquivo:** `src/pages/admin/ProgramacaoPage.tsx`

- Adicionar ícone `Printer` em cada card de ação (visualização mensal, semanal e listagem) — sem condicional de role.
- Ao clicar, abrir `AcaoPrintDialog` que:
  - Carrega `programacoes` + `registros_acao` correspondente + respostas associadas (`instrument_responses`, `avaliacoes_aula`, `consultoria_pedagogica_respostas`, `presencas`) quando existirem.
  - Renderiza um layout estático A4 com cabeçalho dual Bússola + Parceiros (`#1a3a5c`), seção de cadastro (data, horário, escola, consultor, etc.) e o corpo do formulário do tipo correto.
  - Campos preenchidos quando há dados; em branco (linha pontilhada para texto, círculo vazio para escalas, checkbox vazio) quando não há.
  - Se `status = 'realizada'`, todos os dados salvos aparecem; caso contrário apenas o cadastro + estrutura em branco.
- Geração via `html2canvas` + `jsPDF` (mesmo padrão de `EvolucaoProfessorPage`), salvando como `acao-<tipo>-<data>.pdf`.

**Mapa de tipo → componente de impressão** (em `src/components/print/forms/`):
- Consultoria Pedagógica → `ConsultoriaPrintForm`
- Registro Apoio Presencial → `ApoioPresencialPrintForm`
- Observação de Aula → `ObservacaoAulaPrintForm`
- Demais (Formação, Acompanhamento, Microciclos, Encontros REDES, Monitoramento etc.) → `GenericInstrumentPrintForm` que lê `instrument_fields` + `instrument_responses` automaticamente.

---

## 2. Nova página: Visualização Consultoria Pedagógica

**Arquivo novo:** `src/pages/admin/RelatorioConsultoriaVisualizacaoPage.tsx`
**Rota:** `/relatorio-consultoria-visualizacao`

**Restrição de acesso:** somente `admin` ou (`gestor` / `n3_coordenador_programa` cujas `user_programas` contenham `escolas`). Demais perfis → redirecionar para `/unauthorized`. O item de menu também só aparece para esses perfis.

**Filtros (respeitando hierarquia já estabelecida):**
- Data início / Data fim
- Consultor Pedagógico (filtrado por `user_programas`/`shares_programa` para N3)
- Escola (filtrada por `user_has_escola_via_programa`)

**Fonte:** `consultoria_pedagogica_respostas` + join com `registros_acao` (data, aap_id, escola_id, status='realizada').

**Cards/Indicadores numéricos** (somatórios):
- Total de Registros de Consultoria realizados (count)
- Aulas observadas: soma de `aulas_obs_lp + aulas_obs_mat + aulas_obs_oe_lp + aulas_obs_oe_mat + aulas_obs_turma_padrao + aulas_obs_turma_adaptada + aulas_tutoria_obs + aulas_obs_tutor_lp + aulas_obs_tutor_mat`
- Devolutivas realizadas: `devolutivas_professor`
- Aulas em parceria com a coordenação: `aulas_obs_parceria_coord + obs_aula_parceria_coord_extra`
- Devolutivas modelizadas à coordenação: `devolutivas_model_coord`
- Devolutivas acompanhadas: `acomp_devolutivas_coord`
- ATPCs ministrados: `atpcs_ministrados`
- ATPCs acompanhados: `atpcs_acomp_coord`
- Devolutivas de ATPC: `devolutivas_coord_atpc`

**Gráfico:** BarChart resumindo as métricas.

**Seções de texto** (com data + escola + consultor por entrada):
- Boas práticas (`boas_praticas`)
- Pontos de preocupação (`pontos_preocupacao`)
- Encaminhamentos (`encaminhamentos`)

**Botão "Baixar PDF":** mesmos moldes do "Evolução Professor" (html2canvas/jsPDF, cabeçalho institucional, `data-pdf-section` por seção).

---

## 3. Nova página: Visualização Apoio Presencial

**Arquivo novo:** `src/pages/admin/RelatorioApoioPresencialPage.tsx`
**Rota:** `/relatorio-apoio-presencial`

**Restrição de acesso:** mesma da página #2.

**Filtros:** Data/Período, Consultor Pedagógico, Escola (mesma lógica de hierarquia).

**Fonte:** `instrument_responses` onde `form_type = 'registro_apoio_presencial'` join `registros_acao` (status='realizada') + `programacoes` (para `apoio_focos`, `apoio_componente`, `apoio_etapa`, `apoio_turma_voar`, `apoio_escola_voar`, `apoio_obs_planejada`, `apoio_devolutiva`).

**Cards / Indicadores:**
- Aulas observadas (contagens):
  - Total MAT (componente=matemática, etapa≠OE)
  - Total LP (componente=portugues, etapa≠OE)
  - Total OE MAT
  - Total OE LP
  - Total geral
- Devolutivas:
  - Mesmo dia (`apoio_devolutiva = 'mesmo_dia'`)
  - Em até 7 dias (`apoio_devolutiva = 'ate_7_dias'`)
- Observações junto ao coordenador (`apoio_obs_planejada = true`)
- Aulas em turma padrão do VOAR (`apoio_escola_voar = true AND apoio_turma_voar = 'padrao'`)
- Aulas em turmas adaptadas (`apoio_turma_voar = 'adaptada'`)

**Gráfico:** BarChart com os totais.

**Tabela "Top/Bottom 3 ações"** — média geral = média das notas em `responses` JSONB:
- 3 ações com **menor** média geral
- 3 ações com **maior** média geral
- Coluna ações: botão "Visualizar" (dialog reusando `RegistroApoioPresencialForm` em `readOnly=true`) e "Imprimir" (reusa o `AcaoPrintDialog` da etapa 1).

**Botão "Baixar PDF":** mesmo padrão da página de Consultoria.

---

## 4. Sidebar / rotas

**`src/App.tsx`:** adicionar duas rotas novas.

**`src/components/layout/Sidebar.tsx`:** adicionar dois itens em `adminMenuItems` e em `managerMenuItems`. Filtrar dentro do `SidebarContent` para esconder para gestor/N3 que não tenham `escolas` em `profile.programas`.

---

## Detalhes técnicos

- **Helper compartilhado** para PDF: extrair `html2canvas + jsPDF` para `src/lib/pdfExport.ts` (`exportSectionsToPdf(sections: HTMLElement[], filename: string)`).
- **Hierarquia de filtros:** reutilizar padrão já implementado em `RelatoriosPage.tsx` (carregar `user_programas` + `user_entidades` + filtragem client-side).
- **React-query:** `queryKey` inclui todos os filtros para refetch automático.
- **Branding:** PDFs e formulários de impressão usam header `#1a3a5c` com logos Bússola + Parceiros, `data-pdf-section` para quebras.

---

## Arquivos a criar/editar

**Criar:**
- `src/lib/pdfExport.ts`
- `src/components/print/forms/GenericInstrumentPrintForm.tsx`
- `src/components/print/forms/ConsultoriaPrintForm.tsx`
- `src/components/print/forms/ApoioPresencialPrintForm.tsx`
- `src/components/print/forms/ObservacaoAulaPrintForm.tsx`
- `src/components/print/AcaoPrintDialog.tsx` (wrapper que escolhe o formulário correto e dispara PDF)
- `src/pages/admin/RelatorioConsultoriaVisualizacaoPage.tsx`
- `src/pages/admin/RelatorioApoioPresencialPage.tsx`

**Editar:**
- `src/App.tsx` (2 rotas)
- `src/components/layout/Sidebar.tsx` (2 itens condicionais)
- `src/pages/admin/ProgramacaoPage.tsx` (botão Printer no card — todos os níveis — + abertura do dialog)

Sem alterações de schema/RLS.
