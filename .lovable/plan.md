# Liberar Relatórios de Gestão (Programa Escolas) para N4

## O que muda para o usuário
- N4.1 (CPed) e N4.2 (GPI) vinculados ao Programa Escolas passam a ver no menu "Relatórios de Gestão - Programa Escolas".
- Os botões "Visualizar Relatório" de cada cartão abrem o painel completo de cada ação (Apoio Presencial, Apoio com Coordenação, Apoio ao Coordenador, Reunião com o Professor, Planejamento Conjunto, Formação Coletiva, Aula Compartilhada, Alteração de Agenda, Encaminhamentos Internos).
- Em todas essas páginas o N4 vê somente as ações em que é o responsável ou que ele mesmo criou para outra pessoa — mesma regra já usada em Meu Painel e Registros.
- O filtro "Consultor(a)" mostra só as pessoas presentes nessas ações.
- N5 e demais níveis continuam como hoje.

## Detalhes técnicos
- `Sidebar.tsx`: item `/relatorios-gestao-escolas` ganha `extraRoles: ['n4_1_cped','n4_2_gpi']`.
- `AppLayout.tsx`: incluir `/relatorios-gestao-escolas`, as 8 rotas `/relatorios-*` e `/painel-encaminhamentos-internos` em `ALLOWED_ROUTES.operational` (o guard da página bloqueia N5).
- Nas 10 páginas, `allowed` passa a aceitar `hasRole('n4_1_cped') || hasRole('n4_2_gpi')` com `hasEscolas`.
- Escopo N4: buscar também `programacoes.created_by` (via `programacao_id`) e filtrar no cliente `aap_id === profile.id || created_by === profile.id`, aplicado antes dos KPIs, tabelas, gráficos e exportações. Um helper único em `src/lib/` evita repetir a regra.
- O banco já restringe leitura por programa/entidade; o filtro acima garante a regra "somente as suas".
- Verificação: simular N4.2 com programa Escolas no preview e confirmar menu, página agregadora e um painel individual.
