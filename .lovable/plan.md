# Documentação Técnica de Sustentação — Plataforma Bússola

Gerar um único PDF robusto cobrindo arquitetura, banco, permissões e integrações, voltado para o time de tecnologia que assumirá a sustentação. Entregue em `/mnt/documents/`.

## Abordagem

A documentação será gerada por script Python (ReportLab + Platypus), consolidando informação extraída diretamente do código-fonte e do banco de dados (via `supabase--read_query`) — não a partir de "screenshots" da UI. Isso garante que o conteúdo reflita o estado real do sistema.

## Estrutura do PDF

```text
Capa + sumário
1. Visão geral do produto
   - Propósito da Bússola, parceria com Parceiros da Educação
   - Glossário (Entidade, Programa, Ator do Programa, N1-N8, etc.)
   - Mapa de programas (Escolas, Regionais, Redes Municipais)

2. Arquitetura e stack
   - Frontend: React 18 + Vite + TS + Tailwind + shadcn
   - Backend: Lovable Cloud (Supabase) — Postgres + Auth + Edge Functions Deno
   - Estrutura de pastas (src/pages, src/components, supabase/functions)
   - Build, deploy (Lovable), domínios (preview, publicado, custom)
   - Variáveis de ambiente e secrets necessários

3. Modelo de dados
   - Diagrama lógico (ASCII) das entidades principais
   - Catálogo completo de tabelas (nome, colunas, tipos, defaults, descrição)
     extraído via information_schema
   - Tipos enum (app_role, programa_type, etc.)
   - Tabelas-chave detalhadas: profiles, user_roles, user_programas,
     user_entidades, escolas, entidades_filho, professores, programacoes,
     registros_acao, presencas, instrument_responses, avaliacoes_aula,
     consultoria_pedagogica_respostas, observacoes_aula_redes,
     relatorios_microciclos_recomposicao, gestor_programas, aap_*

4. Segurança e RLS
   - Modelo de papéis N1-N8 + legados AAP
   - Funções SECURITY DEFINER (has_role, is_admin, is_gestor, is_manager,
     is_operational, is_local_user, is_observer, user_has_*, shares_*,
     gestor_can_view_*) com explicação de cada uma
   - Padrões de políticas RLS por nível (Admins manage / N2N3 view /
     N4N5 ownership-based / N6N7 entity-scoped / N8 observer)
   - Listagem das políticas RLS por tabela sensível
   - Política de senhas, must_change_password, sessões

5. Matriz de permissões N1-N8
   - Tabela hierarquia (label, tier, level, manage scope)
   - O que cada nível vê / cria / edita / apaga em cada módulo
     (programações, registros, escolas, professores, usuários, dashboards)
   - Regras especiais: ownership N3-N5, GPI gerenciando CPed,
     N4/N5 visibilidade por programa compartilhado, N8 observer

6. Módulos funcionais (resumo de cada página em src/pages/admin)
   - Dashboard, Programação, Registros, Pendências
   - Escolas, Entidades Filho, Professores, Atores do Programa, Usuários
   - Histórico de Presença, Lista de Presença, Matriz de Ações
   - Evolução do Professor, Pontos Observados
   - Relatórios, Relatório Consultoria, Relatório de Acessos
   - Form Field Config, Notion Sync, Manual do Usuário
   - Para cada: propósito, principais queries, regras de visibilidade

7. Instrumentos pedagógicos e ações
   - Catálogo de tipos de ação e instrumentos (formação, observação,
     consultoria, apoio presencial, monitoramento, encontros REDES,
     microciclos, etc.)
   - Escalas (1-4 padrão vs 0-2 REDES vs 0-3 apoio presencial)
   - Regras de cálculo de médias (exclusão de 0 exceto REDES)
   - Configuração dinâmica de campos por papel (form_field_config,
     form_config_settings)

8. Edge Functions (uma seção por função)
   Para cada função: propósito, trigger, entrada/saída, secrets usados,
   verify_jwt, dependências externas, runbook de erros comuns
   - manage-users, manage-aap-user (gestão de usuários + criação)
   - send-pending-notifications (3-day SLA emails)
   - send-monthly-report
   - notion-sync (bidirecional)
   - bigquery-export (sync diário pg_cron)
   - process-email-queue (worker pgmq)
   - send-transactional-email, preview-transactional-email
   - handle-email-unsubscribe, handle-email-suppression

9. Integrações
   - Notion (NOTION_API_KEY/DATABASE_ID, mapeamento de campos,
     escolas relevantes, sync log)
   - GCP BigQuery (GCP_SERVICE_ACCOUNT_KEY, 10 tabelas core,
     bigquery_sync_state, agendamento pg_cron)
   - Resend + subdomínio notify.acompanhamento-aaps.org
     (filas pgmq, retries, bounce/suppression)
   - Lovable AI Gateway (LOVABLE_API_KEY) — quando aplicável

10. Filas, jobs agendados e pg_cron
    - Listagem dos jobs cron ativos
    - Filas pgmq (email queue, DLQ) e funções enqueue/read/delete

11. Observabilidade
    - Logs (Postgres, Auth, Edge Functions, edge HTTP)
    - email_send_log, notion_sync_log, user_access_log
    - Como debugar via Cloud / SQL

12. Operações e runbooks
    - Como criar/desativar usuário, resetar senha
    - Como adicionar uma escola/entidade em massa
    - Como adicionar um novo programa, instrumento, tipo de ação
    - Como rodar um sync Notion/BigQuery sob demanda
    - Procedimento em caso de falha de email queue
    - Restauração de dados / soft-delete (campo `ativa`)

13. Convenções e troubleshooting
    - Tratamento de erros (data?.error em toasts)
    - undefined vs null em payloads
    - .maybeSingle() / .limit(1)
    - localeCompare pt-BR para sort
    - Layout: min-w-0 overflow-x-hidden, dialogs responsivos
    - Branding e PDF (header #1a3a5c)

14. Apêndices
    - A: Lista completa de tabelas + RLS (referência)
    - B: Lista completa de funções SQL
    - C: Lista de secrets e onde são usados
    - D: Glossário de termos do produto
    - E: Contatos e responsáveis (placeholder a preencher)
```

## Detalhes técnicos da geração

- **Script**: `/tmp/gen_docs.py` usando ReportLab Platypus (SimpleDocTemplate, Paragraph, Table, PageBreak, TOC).
- **Coleta de dados**: `supabase--read_query` em `information_schema.columns`, `pg_proc`, `pg_policies`, `cron.job` para listar tabelas, funções, políticas e jobs reais. `code--view` para extrair docstrings/comentários do código TS e das edge functions.
- **Estilo**: capa com branding Parceiros + Bússola (cor `#1a3a5c`), Arial, sumário com hyperlinks, cabeçalho/rodapé com paginação, blocos de código monoespaçados.
- **QA obrigatório**: após gerar, converter cada página para JPEG (`pdftoppm -jpeg -r 150`) e inspecionar visualmente — corrigir overflows, tabelas cortadas, fontes faltantes. Reentregar até passar limpo.
- **Versionamento**: arquivo final `Bussola-Documentacao-Tecnica-v1.pdf`. Iterações futuras viram `_v2`, `_v3`.

## Entrega

Um único arquivo:
- `/mnt/documents/Bussola-Documentacao-Tecnica-v1.pdf` (~60-90 páginas)

Apresentado via `<lov-artifact>` para download imediato.

## O que NÃO está incluído

- Screenshots da interface (política do projeto: documentação textual, sem captura de tela).
- Código-fonte completo embutido (apenas trechos críticos e referências a caminhos de arquivo).
- Manual do usuário final (já existe rota `/manual` com export próprio).
