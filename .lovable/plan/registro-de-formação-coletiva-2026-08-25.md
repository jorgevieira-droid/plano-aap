# Registro de Formação Coletiva

Nova ação/formulário exclusiva do **Programa de Escolas**, com chave técnica `registro_formacao_coletiva`, mais uma nova página de relatório.

## 1. Cadastro da ação

Campos exibidos: Título, **Escola**, **Data**, **Hora início / Hora fim**, **Consultor** (seletor de responsável, mesma regra do Registro de Apoio Presencial).

Campos ocultos: **Descrição** e **Tags** (mesma lógica já usada no Registro de Apoio Presencial). Segmento, Componente e Ano/Série não aparecem.

## 2. Formulário de registro (gerenciamento)

Na ordem:

1. **Tema** — texto curto
2. **Quantidade de professores participantes** — número
3. **Formato** — seleção: Liderança / Co-liderança
4. **Como o coordenador/PAAC participou da construção da pauta?** — seleção com pontuação: Não participou (0) / Participou apenas na validação (1) / Trouxe sugestões (2) / Participou da idealização e construção ativamente (3)
5. **Link da pauta** — texto curto (URL)
6. **NPS da formação** — seleção de nota de 1 a 10
7. **Destaques e desafios da formação** — texto longo

As respostas ficam no JSONB de `instrument_responses` (`form_type = 'registro_formacao_coletiva'`), como nos outros instrumentos do Olhar Parceiro. Impressão em PDF da ação segue o padrão atual.

## 3. Nova página "Relatório - Registro de Formação Coletiva"

Mesmo padrão visual de "Relatórios - Apoio Presencial": cabeçalho com chips de período e total, filtros persistentes (período, escola, consultor), listas em ordem alfabética (pt-BR), exportação em PDF com marca Parceiros + Bússola.

Visibilidade: N1 e N2/N3 do Programa de Escolas.

Layout, na ordem:

1. **Indicadores (cards numéricos)**
   - Total de formações realizadas
   - Total de professores participantes (soma)
   - Média de participantes por formação
   - NPS médio da formação
   - % de formações em co-liderança
   - Média de participação do coordenador/PAAC na pauta (0–3)

2. **Distribuições (barras percentuais)**
   - Formato (liderança / co-liderança)
   - Participação do coordenador/PAAC na pauta (4 níveis)
   - Faixas de NPS (Detratores 1–6 / Neutros 7–8 / Promotores 9–10), com o NPS clássico (%promotores − %detratores)

3. **Tabelas de ranking** (quantidade + barra proporcional)
   - Formações por Escola (com total de professores e NPS médio)
   - Formações por Consultor(a) (com total de professores e NPS médio)

4. **Evolução mensal (gráficos de linha)**
   - NPS médio por mês
   - Professores participantes por mês
   - Volume de formações por mês
   - Média de participação do coordenador na pauta por mês

5. **Temas e textos qualitativos**
   - Lista de registros com Tema, escola, consultor, data, link da pauta (quando houver) e o texto de destaques e desafios.

## Detalhes técnicos

- Migração: adicionar `registro_formacao_coletiva` aos checks `programacoes_tipo_check` e `registros_acao_tipo_check` (recriando ambos com a lista completa) e inserir em `form_config_settings` com `programas = ARRAY['escolas']`.
- `src/config/acaoPermissions.ts`: novo valor no tipo `AcaoTipo`, em `ACAO_TIPOS`, `ACAO_TYPE_INFO` (label "Registro de Formação Coletiva"), permissões iguais às do `registro_apoio_presencial` e config de formulário (`useResponsavelSelector`, `requiresEntidade: true`, `responsavelLabel: 'Consultor'`, sem segmento/componente/ano).
- `src/hooks/useInstrumentFields.ts`: registrar em `INSTRUMENT_FORM_TYPES` (roteamento automático via `INSTRUMENT_TYPE_SET`).
- `src/components/formularios/OlharParceiroContents.tsx`: novo `FormacaoColetivaContent` com os 7 campos; registrar em `DEDICATED_CONTENT_TYPES` e no `InstrumentFormRouter.tsx`.
- `src/pages/admin/ProgramacaoPage.tsx`: incluir o novo tipo na condição que oculta Descrição/Tags.
- Nova página `src/pages/admin/RelatoriosFormacaoColetivaPanelPage.tsx` (espelhando `RelatoriosApoioPresencialPanelPage.tsx`), rota `/relatorios-formacao-coletiva` em `App.tsx`, item no `Sidebar.tsx` e liberação no `AppLayout.tsx`.
- `src/pages/admin/ManualUsuarioPage.tsx`: descrição da nova ação e da nova página.
