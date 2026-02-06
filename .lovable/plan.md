
# Integração Notion → Sistema de Acompanhamento

## Resumo

Implementar sincronização automática de tarefas criadas no Notion para as tabelas `programacoes` e `registros_acao` do sistema. Quando uma tarefa for criada ou atualizada no Notion, ela será automaticamente sincronizada com o sistema.

---

## Arquitetura da Integração

```text
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Database      │     │  Supabase Edge  │     │    Supabase     │
│   Notion        │────▶│    Function     │────▶│    Database     │
│                 │     │  (notion-sync)  │     │                 │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                       │
        │  Webhook automático   │  Insere/Atualiza
        │  (ao criar/editar)    │  programacoes ou
        │                       │  registros_acao
        ▼                       ▼
```

---

## Mapeamento de Campos

| Campo Notion | Campo Sistema | Tabela | Observações |
|--------------|---------------|--------|-------------|
| Tarefa | `titulo` | programacoes | Nome da ação |
| Prazo | `data` | programacoes | Data prevista |
| Status | `status` | programacoes/registros | prevista, realizada, cancelada |
| Descrição | `descricao` / `observacoes` | ambas | Detalhes da ação |
| Etiquetas | `tipo` | ambas | visita, formacao, acompanhamento_aula |
| Responsável | `aap_id` | ambas | Mapear email → user_id |
| Projeto | `programa` | ambas | escolas, regionais, redes_municipais |
| Eixo Relacionado | `segmento` / `componente` | ambas | anos_iniciais, lingua_portuguesa, etc. |

---

## Componentes a Implementar

### 1. Edge Function: `notion-sync`

Receberá webhooks do Notion e processará as atualizações:

```typescript
// Fluxo principal
1. Receber payload do webhook Notion
2. Validar assinatura do webhook
3. Extrair dados da tarefa
4. Mapear campos Notion → Sistema
5. Identificar se é programação ou registro
6. Inserir/Atualizar no Supabase
7. Retornar confirmação
```

### 2. Tabela de Mapeamento: `notion_sync_config`

Para mapear responsáveis do Notion aos usuários do sistema:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| notion_user_id | text | ID do usuário no Notion |
| notion_user_email | text | Email no Notion |
| system_user_id | uuid | user_id no sistema |
| escola_padrao_id | uuid | Escola padrão para ações |

### 3. Tabela de Log: `notion_sync_log`

Para rastrear sincronizações:

| Coluna | Tipo | Descrição |
|--------|------|-----------|
| id | uuid | Chave primária |
| notion_page_id | text | ID da página no Notion |
| tabela_destino | text | programacoes ou registros_acao |
| registro_id | uuid | ID do registro criado/atualizado |
| status | text | sucesso, erro, ignorado |
| erro_mensagem | text | Detalhes do erro se houver |
| created_at | timestamp | Data da sincronização |

---

## Lógica de Decisão: Programação vs Registro

```text
IF Status = "Prevista" OR Status = "Agendada"
   → Inserir em programacoes
   
IF Status = "Realizada" OR Status = "Concluída"
   → Inserir em registros_acao
   → Se existir programação relacionada, atualizar status
   
IF Status = "Cancelada"
   → Atualizar status em programacoes (se existir)
```

---

## Configuração Necessária

### 1. Integração Notion (Internal Integration)

O usuário precisará:
1. Criar uma integração em https://www.notion.so/my-integrations
2. Obter o **Internal Integration Token**
3. Compartilhar o database com a integração
4. Configurar webhook (ou usar polling como alternativa)

### 2. Secrets Necessários

| Secret | Descrição |
|--------|-----------|
| NOTION_API_KEY | Token da integração interna |
| NOTION_DATABASE_ID | ID do database de tarefas |
| NOTION_WEBHOOK_SECRET | Secret para validar webhooks |

---

## Arquivos a Criar/Modificar

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `supabase/functions/notion-sync/index.ts` | **CRIAR** | Edge function para webhook |
| `supabase/config.toml` | **MODIFICAR** | Adicionar configuração da function |
| Migração SQL | **CRIAR** | Tabelas notion_sync_config e notion_sync_log |

---

## Alternativa: Polling (caso webhooks não funcionem)

Se houver limitação com webhooks do Notion, podemos implementar:
- Cron job que roda a cada 5-15 minutos
- Consulta a API do Notion por tarefas modificadas
- Sincroniza incrementalmente usando `last_edited_time`

---

## Fluxo de Implementação

1. **Fase 1:** Criar tabelas de configuração e log
2. **Fase 2:** Implementar Edge Function para receber dados
3. **Fase 3:** Configurar mapeamento de usuários
4. **Fase 4:** Testar sincronização
5. **Fase 5:** Configurar webhook/polling no Notion

---

## Próximos Passos Necessários

Antes de implementar, precisamos:

1. **NOTION_API_KEY** - Você precisará criar uma integração no Notion e fornecer o token
2. **NOTION_DATABASE_ID** - O ID do database de tarefas (está na URL quando você abre o database)
3. **Mapeamento de Responsáveis** - Lista de emails do Notion → emails do sistema

---

## Considerações de Segurança

- Validação de assinatura do webhook
- RLS nas tabelas de configuração (apenas admin)
- Log de todas as sincronizações para auditoria
- Tratamento de erros sem expor dados sensíveis

---

## Estimativa

- **Complexidade:** Média-Alta
- **Impacto:** Criação de 2 novas tabelas, 1 Edge Function
- **Dependências:** Configuração da integração Notion pelo usuário
