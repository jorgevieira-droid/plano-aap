

# Correção da Edge Function notion-sync - Variáveis Ausentes

## Problema

A função `notion-sync` falha em tempo de execução porque duas variáveis essenciais nunca são definidas no corpo da função `syncNotionPage`:

- **`statusInfo`**: deveria vir de `statusMapping[statusNotion]`, mas a linha que faz essa atribuição está faltando
- **`existingLog`**: deveria ser buscado da tabela `notion_sync_log` para saber se a página já foi sincronizada antes, mas a consulta está ausente

Sem essas variáveis, qualquer tentativa de sincronizar uma página causa erro.

---

## Correções

### Arquivo: `supabase/functions/notion-sync/index.ts`

**1. Adicionar definição de `statusInfo` (após linha 336)**

Depois do mapeamento de programa, adicionar:

```text
const statusInfo = statusMapping[statusNotion] || { status: 'prevista', tabela: 'programacoes' };
```

Isso mapeia o status do Notion (ex: "Prevista", "Realizada") para o status e tabela de destino do sistema.

**2. Adicionar consulta de `existingLog` (antes da verificação de `aapId`)**

Buscar na tabela `notion_sync_log` se já existe um registro para esta página do Notion:

```text
const { data: existingLog } = await supabase
  .from('notion_sync_log')
  .select('registro_id, tabela_destino')
  .eq('notion_page_id', page.id)
  .eq('status', 'sucesso')
  .order('created_at', { ascending: false })
  .limit(1)
  .maybeSingle();
```

Isso permite que a função saiba se deve criar um novo registro ou atualizar um existente.

---

## Resultado Esperado

Com essas duas correções, a sincronização deve funcionar corretamente:
- Páginas novas serão criadas nas tabelas corretas (programacoes ou registros_acao)
- Páginas já sincronizadas serão atualizadas em vez de duplicadas
- O campo "Projeto" (relation) será resolvido via API e mapeado para o programa correto, incluindo "Acompanhamento Pedagógico"

