# Plano — Nova ação "VISITA TÉCNICA À SECRETARIA (SME)"

## Resumo

Nova ação/evento baseada no documento anexo (Check-list Fluência Leitora / SARESP, escala 0–3 com 10 critérios em 4 dimensões), disponível para os **três programas do sistema**: `escolas`, `regionais` e `redes_municipais`. Fluxo padrão Programação → Gerenciamento → Registro, com card no Dashboard e bloco no Relatório (visíveis apenas quando houver dados).

- Identificador interno (`tipo`): **`visita_tecnica_secretaria_sme`**
- Rótulo de UI: **"Visita Técnica à Secretaria (SME)"**

## Campos

### Cadastro (no momento da programação)

Persistidos em `programacoes` e copiados/pré-preenchidos no gerenciamento.

| Campo | Tipo | Origem |
|---|---|---|
| Município (Entidade) | seleção de Entidade — aceita Escola, Regional e Rede Municipal | `entidade_id` (já existe) |
| Data | data | `data_prevista` |
| Hora Início / Hora Fim | hora | `hora_inicio` / `hora_fim` |
| Núcleo/Departamento | texto livre | **novo** `nucleo_departamento` |
| Técnico(a) responsável pela visita | Ator do Programa | `responsavel_id` |
| Observador(a) | texto livre | **novo** `observador_nome` |

Os dois campos novos entram na `programacoes` como `text NULL` — sem quebrar registros existentes.

### Gerenciamento

Nova tabela `relatorios_visita_tecnica_secretaria_sme`:

- `programacao_id` (FK, unique), `entidade_id`, `programa` (programa_type), `data_visita`, `hora_inicio`, `hora_fim`, `tecnico_responsavel_id`, `nucleo_departamento`, `observador_nome` (copiados do cadastro, editáveis)
- **10 critérios** (`nota_1` … `nota_10`, integer 0–3) + **10 evidências** (`evidencia_1` … `evidencia_10`, text):
  1. Acesso à plataforma CAED *(D1)*
  2. Download e organização dos dados *(D1)*
  3. Compreensão da estrutura da avaliação *(D1)*
  4. Identificação dos perfis de desempenho *(D2, crítico)*
  5. Relação com práticas pedagógicas *(D2, crítico)*
  6. Análise dos componentes da fluência *(D2)*
  7. Estratificação dos dados *(D3, crítico)*
  8. Quantificação dos alunos por perfil *(D3, crítico)*
  9. Planejamento de intervenções por grupo *(D4)*
  10. Monitoramento e ajuste *(D4)*
- **Encaminhamentos** (4 textos livres): `pontos_fortes`, `aspectos_fortalecer`, `estrategias_encaminhamentos`, `combinacoes_acompanhamento`
- **`media_geral`** numeric (média das 10 notas, ignorando `null`)

Legenda 0–3: 0 Não realizado · 1 Inicial · 2 Parcial · 3 Consolidado.

## Disponibilidade — todos os programas (`escolas`, `regionais`, `redes_municipais`)

- **`form_config_settings`**: 1 linha de configuração com `programas = {escolas, regionais, redes_municipais}` (ou linhas separadas, conforme padrão atual do projeto).
- **Configurar Formulário** (`/admin/form-config`): novo instrumento listado para os 3 programas; toggles por papel via `form_field_config`.
- **Matriz de Ações** (`/admin/matriz-acoes`): nova linha "Visita Técnica à Secretaria (SME)" marcada para `escolas`, `regionais` e `redes_municipais`.
- **Calendário / Programação**: ao escolher essa ação, o seletor de Entidade aceita Escolas, Regionais e Redes Municipais (filtrado pelos vínculos do usuário e pelo programa selecionado — `dynamic-entity-filtering-in-forms`).
- **Registros**: aparece em todos os filtros e dropdowns, ordenado A–Z conforme padrão `localeCompare('pt-BR')`.

## Dashboard e Relatório (modelo do print)

Novo bloco análogo a "Visitas Técnicas – Microciclos":

- Título "Visita Técnica à Secretaria (SME)"
- Sub-linha `N respostas • Média geral X.X / 3`
- **Gráfico de barras horizontais** com a média de cada um dos 10 critérios (escala 0–3)
- **Grid de tiles** com ProgressRing por critério ("X.X / 3")

Reutiliza `InstrumentComparisonChart` e `ProgressRing` já usados pelos blocos existentes.
**Regra crítica:** o bloco só renderiza quando `count(respostas) > 0` no escopo/filtro vigente — padrão de `MonitoramentoRegionaisBlock` / `VisitaAlfabetizacaoRedesBlock`. Ausente do Dashboard e do Relatório quando vazio.

## Fix do `programacoes_tipo_check`

Adicionar `'visita_tecnica_secretaria_sme'` ao `programacoes_tipo_check` na **mesma migração** que cria a tabela (DROP + ADD CONSTRAINT). Sem isso, qualquer inserção de programação dispara o erro relatado.

## Mudanças por arquivo

### Migração (única)
- `DROP` + `ADD CONSTRAINT programacoes_tipo_check` incluindo o novo valor
- Adiciona colunas `nucleo_departamento text`, `observador_nome text` em `programacoes`
- Cria `public.relatorios_visita_tecnica_secretaria_sme` (com GRANTs, RLS e policies espelhando `relatorios_reuniao_acomp_alfabetizacao`: SELECT por `user_has_programa` + `gestor_can_view_*`; INSERT/UPDATE/DELETE por autoria + papel — `coordinator-action-management` / `ownership-based-management`)
- `INSERT` em `form_config_settings` cobrindo os 3 programas
- `INSERT` em `instrument_fields` (10 critérios)
- Trigger `update_updated_at_column`

### Frontend — novos
- `src/components/formularios/VisitaTecnicaSecretariaSmeForm.tsx` — cabeçalho pré-preenchido + 10 `RatingScale` 0–3 + 10 textareas de evidência + 4 textareas de encaminhamentos + síntese das notas
- `src/components/dashboard/VisitaTecnicaSecretariaSmeBlock.tsx` — card de Dashboard/Relatório (`if (count === 0) return null`)
- `src/components/print/VisitaTecnicaSecretariaSmePrintSection.tsx` — versão PDF/print com `data-pdf-section`

### Frontend — editados
- `src/config/acaoPermissions.ts` — registra tipo, label, programas (`escolas`, `regionais`, `redes_municipais`), permissões (N3 cria/edita; N1/N2 visualizam; herda `ownership-based-management`)
- `src/hooks/useAcoesByPrograma.ts` — mapeia o novo tipo para os 3 programas
- `src/pages/admin/MatrizAcoesPage.tsx` — adiciona à matriz
- `src/pages/admin/FormFieldConfigPage.tsx` — adiciona ao seletor de instrumento
- `src/pages/admin/ProgramacaoPage.tsx` — novos campos de cadastro (Núcleo/Departamento, Observador); seletor de entidade aceitando Escolas/Regionais/Redes Municipais
- `src/pages/admin/RegistrosPage.tsx` — roteamento para o novo formulário; pré-popula cabeçalho a partir de `programacoes`
- `src/pages/admin/AdminDashboard.tsx` — inclui `<VisitaTecnicaSecretariaSmeBlock />`
- `src/pages/admin/RelatoriosPage.tsx` (e/ou `RelatorioInstrumentosPage.tsx`) — inclui o mesmo bloco
- `src/components/print/AcaoPrintForm.tsx` + `AcaoPrintDialog.tsx` — suporte para impressão do novo tipo
- `src/integrations/supabase/types.ts` — regenerado automaticamente após a migração

Inserir o item em todas as listas/dropdowns mantendo a ordenação A–Z (`localeCompare('pt-BR', { sensitivity: 'base' })`).

## Detalhes técnicos

- **Escala 0–3:** `RatingScale` com `max=3`; eixo do gráfico exibe até 4 visualmente (consistente com o print).
- **Persistência cadastro → gerenciamento:** ao abrir o gerenciamento, hook lê `programacao_id`, faz `select` em `programacoes` e pré-preenche o cabeçalho; alterações no gerenciamento gravam tanto em `programacoes` (para refletir no calendário) quanto em `relatorios_visita_tecnica_secretaria_sme`.
- **Métrica de média:** escala 0–3 inclui `0` como nota válida (mesmo critério do modelo REDES); ignora `null`.
- **Print/PDF:** dual-branding Parceiros + Bússola; `data-pdf-section` para quebra de página.
- **Pendências/Notificações:** entra automaticamente no fluxo de 3 dias (`pendencies-system-tracking`).
- **BigQuery export:** considerar incluir a nova tabela no `gcp-bigquery-export` em iteração posterior, se desejado.

## Validação final

1. Criar programação "Visita Técnica à Secretaria (SME)" em cada um dos 3 programas (`escolas`, `regionais`, `redes_municipais`) — não deve disparar `programacoes_tipo_check`.
2. Reabrir cada ação e gerenciar: cabeçalho vem pré-preenchido (Município/Regional/Rede, Data, Hora, Técnico, Núcleo, Observador).
3. Preencher 10 notas + evidências + encaminhamentos → registro aparece em Histórico/Registros.
4. Dashboard e Relatório exibem o card com média geral e por critério; sem registros no escopo filtrado, o card desaparece.
5. `Configurar Formulário` mostra o instrumento e permite ligar/desligar critérios por papel para os 3 programas.
6. `Matriz de Ações` lista a nova linha marcada para `escolas`, `regionais` e `redes_municipais`.

## Fora de escopo

- Análise agregada por dimensão (D1–D4) — pode ser iteração futura.
- Sincronização Notion (não solicitada).
- Exportação DOCX no modelo do anexo (PDF padrão já cobre).
