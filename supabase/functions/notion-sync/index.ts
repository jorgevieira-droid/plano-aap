import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-notion-signature',
};

// Mapeamento de status do Notion para o sistema
const statusMapping: Record<string, { status: string; tabela: 'programacoes' | 'registros_acao' }> = {
  'Prevista': { status: 'prevista', tabela: 'programacoes' },
  'Agendada': { status: 'prevista', tabela: 'programacoes' },
  'Em Andamento': { status: 'prevista', tabela: 'programacoes' },
  'Realizada': { status: 'realizada', tabela: 'registros_acao' },
  'Concluída': { status: 'realizada', tabela: 'registros_acao' },
  'Cancelada': { status: 'cancelada', tabela: 'programacoes' },
};

// Mapeamento de etiquetas para tipo de ação
const tipoMapping: Record<string, string> = {
  'Visita': 'visita',
  'Formação': 'formacao',
  'Acompanhamento': 'acompanhamento_aula',
  'Acompanhamento de Aula': 'acompanhamento_aula',
};

// Campo "Projeto" do Notion é ignorado na importação
// Campo "Tag do Projeto" do Notion é sincronizado com o campo "tags" do sistema

// Cache para resolver títulos de relações do Notion
const relationTitleCache: Record<string, string> = {};

async function resolveRelationTitle(notionApiKey: string, pageId: string): Promise<string> {
  if (relationTitleCache[pageId]) {
    return relationTitleCache[pageId];
  }

  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${notionApiKey}`,
        'Notion-Version': '2022-06-28',
      },
    });

    if (!response.ok) {
      console.error(`Failed to resolve relation ${pageId}: ${response.status}`);
      return '';
    }

    const pageData = await response.json();
    
    // Extrair título da página - pode estar em diferentes propriedades
    let title = '';
    for (const prop of Object.values(pageData.properties || {})) {
      const p = prop as NotionProperty;
      if (p.type === 'title' && p.title && p.title.length > 0) {
        title = p.title.map((t: { plain_text: string }) => t.plain_text).join('');
        break;
      }
    }

    relationTitleCache[pageId] = title;
    return title;
  } catch (error) {
    console.error(`Error resolving relation ${pageId}:`, error);
    return '';
  }
}

function extractRelationIds(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'relation' || !prop.relation) return [];
  return prop.relation.map(r => r.id);
}

// Mapeamento de segmento/componente
const segmentoMapping: Record<string, { segmento: string; componente: string }> = {
  'Anos Iniciais': { segmento: 'anos_iniciais', componente: 'polivalente' },
  'Língua Portuguesa': { segmento: 'anos_finais', componente: 'lingua_portuguesa' },
  'Matemática': { segmento: 'anos_finais', componente: 'matematica' },
};

interface NotionProperty {
  type: string;
  title?: Array<{ plain_text: string }>;
  rich_text?: Array<{ plain_text: string }>;
  date?: { start: string; end?: string };
  status?: { name: string };
  select?: { name: string };
  multi_select?: Array<{ name: string }>;
  people?: Array<{ id: string; person?: { email: string } }>;
  relation?: Array<{ id: string }>;
}

interface NotionPage {
  id: string;
  properties: Record<string, NotionProperty>;
  created_time: string;
  last_edited_time: string;
}

function extractTextFromProperty(prop: NotionProperty | undefined): string {
  if (!prop) return '';
  
  if (prop.type === 'title' && prop.title) {
    return prop.title.map(t => t.plain_text).join('');
  }
  if (prop.type === 'rich_text' && prop.rich_text) {
    return prop.rich_text.map(t => t.plain_text).join('');
  }
  return '';
}

function extractDateFromProperty(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== 'date' || !prop.date) return null;
  return prop.date.start;
}

function extractStatusFromProperty(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'status' || !prop.status) return 'Prevista';
  return prop.status.name;
}

function extractSelectFromProperty(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== 'select' || !prop.select) return '';
  return prop.select.name;
}

function extractMultiSelectFromProperty(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'multi_select' || !prop.multi_select) return [];
  return prop.multi_select.map(s => s.name);
}

function extractPeopleEmailsFromProperty(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== 'people' || !prop.people) return [];
  return prop.people
    .filter(p => p.person?.email)
    .map(p => p.person!.email);
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const notionApiKey = Deno.env.get('NOTION_API_KEY');
  const notionDatabaseId = Deno.env.get('NOTION_DATABASE_ID');

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase configuration');
    return new Response(JSON.stringify({ error: 'Server configuration error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  if (!notionApiKey || !notionDatabaseId) {
    console.error('Missing Notion configuration');
    return new Response(JSON.stringify({ error: 'Notion not configured' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'sync';

    if (action === 'sync') {
      // Polling: buscar tarefas do Notion e sincronizar
      console.log('Starting Notion sync...');
      
      const notionResponse = await fetch(
        `https://api.notion.com/v1/databases/${notionDatabaseId}/query`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': '2022-06-28',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            sorts: [{ property: 'Prazo', direction: 'ascending' }],
          }),
        }
      );

      if (!notionResponse.ok) {
        const errorText = await notionResponse.text();
        console.error('Notion API error:', errorText);
        throw new Error(`Notion API error: ${notionResponse.status}`);
      }

      const notionData = await notionResponse.json();
      const pages: NotionPage[] = notionData.results;

      console.log(`Found ${pages.length} pages to sync`);

      const results = {
        total: pages.length,
        synced: 0,
        errors: 0,
        skipped: 0,
      };

      for (const page of pages) {
      try {
          await syncNotionPage(supabase, page, notionDatabaseId, notionApiKey);
          results.synced++;
        } catch (error) {
          console.error(`Error syncing page ${page.id}:`, error);
          results.errors++;
          
          // Log error
          await supabase.from('notion_sync_log').insert({
            notion_page_id: page.id,
            notion_database_id: notionDatabaseId,
            tabela_destino: 'unknown',
            operacao: 'sync',
            status: 'erro',
            erro_mensagem: error instanceof Error ? error.message : 'Unknown error',
            payload: page.properties,
          });
        }
      }

      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'webhook') {
      // Webhook: processar evento único do Notion
      const payload = await req.json();
      console.log('Received webhook payload:', JSON.stringify(payload).substring(0, 500));

      if (payload.type === 'page' && payload.page) {
        await syncNotionPage(supabase, payload.page, notionDatabaseId, notionApiKey);
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } else if (action === 'test') {
      // Teste de conexão
      const notionResponse = await fetch(
        `https://api.notion.com/v1/databases/${notionDatabaseId}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${notionApiKey}`,
            'Notion-Version': '2022-06-28',
          },
        }
      );

      if (!notionResponse.ok) {
        const errorText = await notionResponse.text();
        throw new Error(`Notion connection failed: ${errorText}`);
      }

      const dbInfo = await notionResponse.json();

      return new Response(JSON.stringify({ 
        success: true, 
        database: {
          id: dbInfo.id,
          title: dbInfo.title?.[0]?.plain_text || 'Unknown',
          properties: Object.keys(dbInfo.properties),
        }
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in notion-sync:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function syncNotionPage(
  supabase: ReturnType<typeof createClient>,
  page: NotionPage,
  databaseId: string,
  notionApiKey: string
) {
  const props = page.properties;

  // Extrair dados do Notion
  const titulo = extractTextFromProperty(props['Tarefa']) || extractTextFromProperty(props['Nome']) || 'Sem título';
  const descricao = extractTextFromProperty(props['Descrição']);
  const prazoStr = extractDateFromProperty(props['Prazo']);
  const statusNotion = extractStatusFromProperty(props['Status']);
  const etiquetaNotion = extractSelectFromProperty(props['Etiquetas']); // select (valor único)
  const responsavelEmails = extractPeopleEmailsFromProperty(props['Responsável']);
  const eixoNotion = extractSelectFromProperty(props['Eixo Relacionado']);

  // Extrair "Tag do Projeto" do Notion para tags do sistema
  const tagDoProjetoNotion = props['Tag do Projeto'];
  let tags: string[] = [];
  if (tagDoProjetoNotion?.type === 'multi_select') {
    tags = tagDoProjetoNotion.multi_select?.map((t: { name: string }) => t.name) || [];
  } else if (tagDoProjetoNotion?.type === 'select' && tagDoProjetoNotion.select) {
    tags = [tagDoProjetoNotion.select.name];
  }

  // Programa fixo - campo "Projeto" do Notion é ignorado
  const programa = 'escolas';

  // Mapear segmento e componente
  const segmentoInfo = segmentoMapping[eixoNotion] || { segmento: 'anos_iniciais', componente: 'polivalente' };

  // Mapear status do Notion para status e tabela de destino do sistema
  const statusInfo = statusMapping[statusNotion] || { status: 'prevista', tabela: 'programacoes' as const };

  // Buscar se esta página já foi sincronizada antes
  const { data: existingLog } = await supabase
    .from('notion_sync_log')
    .select('registro_id, tabela_destino')
    .eq('notion_page_id', page.id)
    .eq('status', 'sucesso')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Buscar usuário do sistema pelo email do responsável
  let aapId: string | null = null;
  let escolaId: string | null = null;

  if (responsavelEmails.length > 0) {
    const { data: configData } = await supabase
      .from('notion_sync_config')
      .select('system_user_id, escola_padrao_id')
      .eq('notion_user_email', responsavelEmails[0])
      .eq('ativo', true)
      .single();

    if (configData) {
      aapId = configData.system_user_id;
      escolaId = configData.escola_padrao_id;
    }
  }

  // Se não encontrou usuário mapeado, tentar buscar pelo email no profiles
  if (!aapId && responsavelEmails.length > 0) {
    const { data: profileData } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', responsavelEmails[0])
      .single();

    if (profileData) {
      aapId = profileData.id;
    }
  }

  // Se não tem AAP ou escola, não podemos sincronizar
  if (!aapId) {
    console.log(`Skipping page ${page.id}: no mapped user for emails ${responsavelEmails.join(', ')}`);
    
    await supabase.from('notion_sync_log').insert({
      notion_page_id: page.id,
      notion_database_id: databaseId,
      tabela_destino: statusInfo.tabela,
      operacao: 'skip',
      status: 'ignorado',
      erro_mensagem: `Usuário não mapeado: ${responsavelEmails.join(', ')}`,
      payload: props,
    });
    
    return;
  }

  // Se não tem escola, buscar primeira escola do AAP
  if (!escolaId) {
    const { data: aapEscola } = await supabase
      .from('aap_escolas')
      .select('escola_id')
      .eq('aap_user_id', aapId)
      .limit(1)
      .single();

    if (aapEscola) {
      escolaId = aapEscola.escola_id;
    }
  }

  if (!escolaId) {
    console.log(`Skipping page ${page.id}: no escola for user ${aapId}`);
    
    await supabase.from('notion_sync_log').insert({
      notion_page_id: page.id,
      notion_database_id: databaseId,
      tabela_destino: statusInfo.tabela,
      operacao: 'skip',
      status: 'ignorado',
      erro_mensagem: `Escola não encontrada para usuário ${aapId}`,
      payload: props,
    });
    
    return;
  }

  const data = prazoStr || new Date().toISOString().split('T')[0];

  // Dados comuns para ambas as tabelas
  const commonData = {
    titulo,
    tipo,
    data,
    aap_id: aapId,
    escola_id: escolaId,
    segmento: segmentoInfo.segmento,
    componente: segmentoInfo.componente,
    ano_serie: '1º ano', // Default, pode ser ajustado
    programa: [programa],
    status: statusInfo.status,
    tags: tags.length > 0 ? tags : null,
  };

  let registroId: string;
  let operacao: string;

  if (statusInfo.tabela === 'programacoes') {
    const programacaoData = {
      ...commonData,
      descricao,
      horario_inicio: '08:00',
      horario_fim: '12:00',
    };

    if (existingLog?.tabela_destino === 'programacoes' && existingLog.registro_id) {
      // Atualizar existente
      const { error } = await supabase
        .from('programacoes')
        .update(programacaoData)
        .eq('id', existingLog.registro_id);

      if (error) throw error;
      registroId = existingLog.registro_id;
      operacao = 'update';
    } else {
      // Criar novo
      const { data: newProg, error } = await supabase
        .from('programacoes')
        .insert(programacaoData)
        .select('id')
        .single();

      if (error) throw error;
      registroId = newProg.id;
      operacao = 'create';
    }

  } else {
    // registros_acao
    const registroData = {
      ...commonData,
      observacoes: descricao,
    };

    if (existingLog?.tabela_destino === 'registros_acao' && existingLog.registro_id) {
      // Atualizar existente
      const { error } = await supabase
        .from('registros_acao')
        .update(registroData)
        .eq('id', existingLog.registro_id);

      if (error) throw error;
      registroId = existingLog.registro_id;
      operacao = 'update';
    } else {
      // Se tinha uma programação anterior, vincular
      let programacaoId: string | null = null;
      if (existingLog?.tabela_destino === 'programacoes' && existingLog.registro_id) {
        programacaoId = existingLog.registro_id;
        
        // Atualizar status da programação para realizada
        await supabase
          .from('programacoes')
          .update({ status: 'realizada' })
          .eq('id', programacaoId);
      }

      // Criar novo registro
      const { data: newReg, error } = await supabase
        .from('registros_acao')
        .insert({
          ...registroData,
          programacao_id: programacaoId,
        })
        .select('id')
        .single();

      if (error) throw error;
      registroId = newReg.id;
      operacao = 'create';
    }
  }

  // Log de sucesso
  await supabase.from('notion_sync_log').insert({
    notion_page_id: page.id,
    notion_database_id: databaseId,
    tabela_destino: statusInfo.tabela,
    registro_id: registroId,
    operacao,
    status: 'sucesso',
    payload: props,
  });

  console.log(`Synced page ${page.id} to ${statusInfo.tabela}/${registroId} (${operacao})`);
}
