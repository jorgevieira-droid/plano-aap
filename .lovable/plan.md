# Registro de Apoio Presencial com Coordenação

Renomeação e ajustes do formulário hoje chamado "Registro de Formação do Coordenador", mais uma nova página de relatório.

## 1. Renomeação (somente rótulos visíveis)

A chave técnica `registro_consultoria_pedagogica` é mantida — nada muda no banco, rotas ou permissões.

Novo rótulo: **"Registro de Apoio Presencial com Coordenação"**, aplicado em:
- lista de ações e seletor de instrumentos
- título do diálogo de preenchimento
- mensagens de sucesso ao salvar
- menus laterais e títulos das páginas/PDF/e-mail existentes (Rel. e Visualização)
- Manual do Usuário

## 2. Ajustes no formulário

- Remover o campo **Data da observação** (e a validação obrigatória correspondente ao salvar).
- Incluir, como primeira pergunta do bloco de realização, **"Turma do VOAR"** (Sim / Não).
- Incluir ao final:
  - **"Houve Tematização da devolutiva com o Coordenador posteriormente?"** (Sim / Não)
  - **"Quais habilidades e práticas o Coordenador pode desenvolver para potencializar o Apoio Presencial? Como você apoiará o Coordenador no desenvolvimento dessas habilidades?"** (texto longo)

Registros antigos continuam abrindo normalmente; campos novos aparecem vazios e a data antiga, quando existir, deixa de ser exibida no formulário (permanece salva no histórico).

## 3. Nova página "Relatório - Registro de Apoio Presencial com Coordenação"

Mesmo padrão visual de "Relatórios - Apoio Presencial": cabeçalho com chips de período e total, filtros persistentes (período, entidade, consultor), exportação em PDF com marca Parceiros + Bússola, listas em ordem alfabética (pt-BR).

Visibilidade: N2/N3 do Programa de Escolas (mesma regra da página de Apoio Presencial), além de N1.

Layout proposto, na ordem:

1. **Indicadores (cards numéricos)**
   - Total de registros realizados
   - Coordenador observou a aula do início ao fim (Sim)
   - Devolutivas planejadas com o coordenador (Sim)
   - Devolutivas realizadas (Sim)
   - Registros em turma do VOAR (Sim)
   - Tematização posterior da devolutiva (Sim)

2. **Distribuições (barras percentuais)**
   - Como foram os registros do coordenador (grão fino / grão largo / inferências)
   - Como o coordenador participou da devolutiva (observador de devolutiva modelizada / liderança / co-liderança)
   - Motivos de não realização da devolutiva (contagem de registros com motivo preenchido, com leitura dos textos em lista)

3. **Tabelas de ranking** (quantidade + barra proporcional)
   - Registros por Escola
   - Registros por Consultor(a)

4. **Evolução mensal (gráficos de linha)**
   - % de devolutivas realizadas por mês
   - % de tematização posterior por mês
   - Volume de registros por mês

5. **Desenvolvimento do Coordenador**
   - Lista das respostas de texto longo (habilidades/práticas e apoio previsto), agrupadas por escola e consultor, com data do registro.

## Detalhes técnicos

- `src/components/formularios/OlharParceiroContents.tsx`: `FormacaoCoordenadorContent` — remove `data_observacao`, adiciona `turma_voar`, `tematizacao_posterior`, `desenvolvimento_coordenador`.
- `src/components/formularios/ConsultoriaPedagogicaForm.tsx`: remove a validação de data e atualiza o toast.
- Rótulos: `src/config/acaoPermissions.ts`, `src/hooks/useInstrumentFields.ts`, `src/pages/admin/ProgramacaoPage.tsx`, `src/components/layout/Sidebar.tsx`, `RelatorioConsultoriaPage.tsx`, `RelatorioConsultoriaVisualizacaoPage.tsx`, `ManualUsuarioPage.tsx`, `ConsultoriaPedagogicaFormLegacy.tsx`.
- Nova página `src/pages/admin/RelatoriosApoioCoordenacaoPanelPage.tsx`, rota `/relatorios-apoio-coordenacao` em `App.tsx`, item no `Sidebar.tsx` e liberação em `AppLayout.tsx`, lendo `instrument_responses` com `form_type = 'registro_consultoria_pedagogica'` unido a `registros_acao` realizados do Programa de Escolas.
- Sem migrações de banco: as respostas ficam no JSONB de `instrument_responses`.
