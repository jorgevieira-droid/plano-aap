

# API de Exportação para BigQuery (GCP)

## Resumo

Criar uma Edge Function agendada (cron job) que exporta periodicamente todas as tabelas de formulários para o BigQuery. A abordagem será **genérica por tabela**, enviando os dados como JSON/NDJSON via BigQuery Streaming Insert API ou Load Job.

## Sobre a pergunta: "Se alterar um formulário, preciso alterar a API?"

**Depende da abordagem:**

- **Exportação genérica (recomendada):** A Edge Function lê todas as colunas de cada tabela dinamicamente. Se você adicionar um campo na tabela, ele é exportado automaticamente. **Porém**, o schema do BigQuery precisa ser atualizado para receber a nova coluna — caso contrário, ela será ignorada ou causará erro.
- **Campos hardcoded dos REDES:** Os formulários REDES (`observacoes_aula_redes`, `relatorios_eteg_redes`, `relatorios_professor_redes`) têm campos fixos na tabela. Se o formulário mudar, o schema do BQ precisa acompanhar, mas a Edge Function não muda.

**Conclusão prática:** A API em si raramente precisaria mudar. O que muda é o schema das tabelas no BigQuery.

## Arquitetura

```text
┌──────────────┐     cron (pg_cron)     ┌─────────────────────┐     REST API     ┌──────────┐
│  PostgreSQL  │ ───────────────────────►│  Edge Function      │ ────────────────►│ BigQuery │
│  (tabelas)   │   dispara diário/sem   │  bigquery-export    │   streaming      │  (GCP)   │
└──────────────┘                        └─────────────────────┘   insert          └──────────┘
```

## Plano de implementação

### 1. Configurar credenciais GCP

Você precisará de uma **Service Account Key** do GCP com permissão de escrita no BigQuery. O JSON da chave será armazenado como secret na Edge Function.

- Secret necessário: `GCP_SERVICE_ACCOUNT_KEY` (JSON completo da service account)
- Variáveis adicionais hardcoded na função: `GCP_PROJECT_ID`, `BQ_DATASET_ID`

### 2. Criar a Edge Function `bigquery-export`

**Arquivo:** `supabase/functions/bigquery-export/index.ts`

Lógica:
1. Autenticar com o GCP usando a Service Account Key (gerar JWT → trocar por access token)
2. Para cada tabela, fazer `SELECT *` usando o service role client
3. Converter os registros para NDJSON
4. Enviar via BigQuery `tabledata.insertAll` (streaming) ou `jobs.load` (batch)
5. Registrar log de sucesso/erro

**Tabelas exportadas:**
| Tabela | BigQuery Table |
|---|---|
| `avaliacoes_aula` | `avaliacoes_aula` |
| `observacoes_aula_redes` | `observacoes_aula_redes` |
| `relatorios_eteg_redes` | `relatorios_eteg_redes` |
| `relatorios_professor_redes` | `relatorios_professor_redes` |
| `registros_acao` | `registros_acao` |
| `programacoes` | `programacoes` |
| `presencas` | `presencas` |
| `escolas` | `escolas` |
| `professores` | `professores` |
| `profiles` | `profiles` |

### 3. Exportação incremental

Para evitar reenviar tudo a cada execução:
- Manter uma tabela `bigquery_sync_state` com `table_name` e `last_synced_at`
- Na query, filtrar `WHERE created_at > last_synced_at` (ou `updated_at` quando disponível)
- Após sucesso, atualizar `last_synced_at`

### 4. Agendar com pg_cron

Criar um cron job que invoca a Edge Function diariamente (ou semanalmente, configurável):

```sql
SELECT cron.schedule('bigquery-daily-export', '0 3 * * *', ...);
```

### 5. Tabela de controle e log

**Nova tabela:** `bigquery_sync_state`
- `table_name` (PK)
- `last_synced_at` (timestamp)
- `last_status` (text: 'success' | 'error')
- `last_error` (text, nullable)
- `rows_exported` (integer)

## Pré-requisitos do lado GCP

Antes de implementar, você precisará:
1. Criar um projeto no GCP (ou usar existente)
2. Criar um dataset no BigQuery
3. Criar as tabelas no BigQuery com schemas correspondentes
4. Criar uma Service Account com role `BigQuery Data Editor`
5. Gerar a chave JSON da Service Account

## Arquivos alterados/criados

| Arquivo | Alteração |
|---|---|
| `supabase/functions/bigquery-export/index.ts` | Nova Edge Function |
| `supabase/config.toml` | Adicionar `[functions.bigquery-export]` |
| Migração SQL | Criar tabela `bigquery_sync_state` + habilitar `pg_cron`/`pg_net` + agendar job |

