import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkRateLimit } from "../_shared/rateLimit.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-notion-signature",
};

// ============================================================
// CONFIGURACAO: PROGRAMAS QUE SINCRONIZAM COM ESTE NOTION
//
// Somente acoes cujo campo 'programa' inclui um destes valores
// serao sincronizadas. Acoes de outros programas sao ignoradas.
// ============================================================

const PROGRAMAS_PARA_SINCRONIZAR: string[] = [
  "redes_municipais",
  // 'regionais',       // apontar quanto necessário
  // 'escolas',         // apontar quanto necessário
];

// ============================================================
// CONFIGURACAO: TIPOS DE ACAO A SINCRONIZAR
// ============================================================

const TIPOS_PARA_SINCRONIZAR: string[] = [
  "formacao",
  "encontro_eteg_redes",
  "encontro_professor_redes",
  "observacao_aula_redes",
  "agenda_gestao",
  // 'acompanhamento_formacoes',
  // 'participa_formacoes',
  // 'lista_presenca',
  // 'observacao_aula',
  // 'devolutiva_pedagogica',
  // 'obs_engajamento_solidez',
  // 'obs_implantacao_programa',
  // 'obs_uso_dados',
  // 'qualidade_acomp_aula',
  // 'autoavaliacao',
  // 'qualidade_implementacao',
  // 'qualidade_atpcs',
  // 'sustentabilidade_programa',
  // 'avaliacao_formacao_participante',
];

// ============================================================
// MAPEAMENTO DE REDES: Supabase (nome da escola) -> Notion (page ID)
// Atualizar com os IDs do workspace de producao quando sair do teste
// ============================================================

const REDE_SUPABASE_TO_NOTION: Record<string, string> = {
  "Rede Municipal de Araraquara": "32d6e2c7-d2c9-81e5-8070-faf0f3b6ccc6",
  "Rede Municipal de Bebedouro": "32d6e2c7-d2c9-81f8-bf38-e9f898f6a14f",
  "Rede Municipal de Bertioga": "32d6e2c7-d2c9-812b-8f05-f156415900d1",
  "Rede Municipal de Caraguatatuba": "32d6e2c7-d2c9-8193-97f9-c0cac8f2677a",
  "Rede Municipal de Descalvado": "32d6e2c7-d2c9-81b9-9cd0-cca874194741",
  "Rede Municipal de Espírito Santo do Pinhal": "32d6e2c7-d2c9-8120-acdc-f7dfa740f70a",
  "Rede Municipal de Itaquaquecetuba": "32d6e2c7-d2c9-8115-910e-f0d1a476fbf3",
  "Rede Municipal de Jarinu": "32d6e2c7-d2c9-81a1-926a-f03bae74e495",
  "Rede Municipal de Santos (SME)": "32d6e2c7-d2c9-819a-beeb-eb387d8a1651",
  "Rede Municipal de Santos (URE)": "32d6e2c7-d2c9-8165-8cd4-d0e88799484f",
};

const REDE_NOTION_TO_SUPABASE: Record<string, string> = {};
for (const [nome, pageId] of Object.entries(REDE_SUPABASE_TO_NOTION)) {
  REDE_NOTION_TO_SUPABASE[pageId] = nome;
}

// ============================================================
// Mapeamentos de status
// ============================================================

const STATUS_TO_NOTION: Record<string, string> = {
  prevista: "A fazer",
  agendada: "A fazer",
  realizada: "Concluída",
  cancelada: "Inativa",
};

const STATUS_TO_SUPABASE: Record<string, { status: string; tabela: "programacoes" | "registros_acao" }> = {
  "A fazer": { status: "prevista", tabela: "programacoes" },
  Pendente: { status: "prevista", tabela: "programacoes" },
  Pausada: { status: "prevista", tabela: "programacoes" },
  "Em andamento": { status: "prevista", tabela: "programacoes" },
  Concluída: { status: "realizada", tabela: "registros_acao" },
  Inativa: { status: "cancelada", tabela: "programacoes" },
};

// ============================================================
// Mapeamento de tipo: Supabase -> Notion
// ============================================================

const TIPO_TO_NOTION: Record<string, string> = {
  formacao: "Formação",
  acompanhamento_formacoes: "Formação",
  participa_formacoes: "Formação",
  encontro_eteg_redes: "Formação",
  encontro_professor_redes: "Formação",
  lista_presenca: "Formação",
  observacao_aula: "Visitas",
  observacao_aula_redes: "Visitas",
  visita: "Visitas",
  devolutiva_pedagogica: "Visitas",
  obs_engajamento_solidez: "Visitas",
  obs_implantacao_programa: "Visitas",
  obs_uso_dados: "Visitas",
  qualidade_acomp_aula: "Visitas",
  agenda_gestao: "Reunião de Acompanhamento (SME/URE)",
  autoavaliacao: "Tarefa",
  qualidade_implementacao: "Tarefa",
  qualidade_atpcs: "Tarefa",
  sustentabilidade_programa: "Tarefa",
  avaliacao_formacao_participante: "Tarefa",
};

// Mapeamento reverso: Notion -> Supabase (primeiro match)
const TIPO_FROM_NOTION: Record<string, string> = {};
for (const [supa, notion] of Object.entries(TIPO_TO_NOTION)) {
  if (!TIPO_FROM_NOTION[notion]) TIPO_FROM_NOTION[notion] = supa;
}

// ============================================================
// Helper: verifica se a acao deve ser sincronizada
// ============================================================

function deveSincronizar(programas: string[] | null, tipo: string): boolean {
  if (!programas || !Array.isArray(programas)) return false;
  const programaOk = programas.some((p) => PROGRAMAS_PARA_SINCRONIZAR.includes(p));
  const tipoOk = TIPOS_PARA_SINCRONIZAR.includes(tipo);
  return programaOk && tipoOk;
}

// ============================================================
// Interfaces Notion
// ============================================================

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

// ============================================================
// Helpers de extracao do Notion
// ============================================================

function extractText(prop: NotionProperty | undefined): string {
  if (!prop) return "";
  if (prop.type === "title" && prop.title) return prop.title.map((t) => t.plain_text).join("");
  if (prop.type === "rich_text" && prop.rich_text) return prop.rich_text.map((t) => t.plain_text).join("");
  return "";
}

function extractDate(prop: NotionProperty | undefined): string | null {
  if (!prop || prop.type !== "date" || !prop.date) return null;
  return prop.date.start;
}

function extractStatus(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== "status" || !prop.status) return "A fazer";
  return prop.status.name;
}

function extractSelect(prop: NotionProperty | undefined): string {
  if (!prop || prop.type !== "select" || !prop.select) return "";
  return prop.select.name;
}

function extractPeopleIds(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== "people" || !prop.people) return [];
  return prop.people.map((p) => p.id);
}

function extractPeopleEmails(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== "people" || !prop.people) return [];
  return prop.people.filter((p) => p.person?.email).map((p) => p.person!.email);
}

function extractRelationIds(prop: NotionProperty | undefined): string[] {
  if (!prop || prop.type !== "relation" || !prop.relation) return [];
  return prop.relation.map((r) => r.id);
}

// ============================================================
// Helper: Notion API request
// ============================================================

async function notionFetch(notionApiKey: string, endpoint: string, method = "GET", body: unknown = null) {
  const options: RequestInit = {
    method,
    headers: {
      Authorization: `Bearer ${notionApiKey}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
    },
  };
  if (body) options.body = JSON.stringify(body);
  const response = await fetch(`https://api.notion.com/v1${endpoint}`, options);
  if (!response.ok) {
    const text = await response.text();
    console.error(`Notion API error (${response.status}): ${text}`);
    return null;
  }
  return response.json();
}

// ============================================================
// DIRECAO 1: Supabase -> Notion (exportar/atualizar)
// ============================================================

async function syncSupabaseToNotion(
  supabase: ReturnType<typeof createClient>,
  notionApiKey: string,
  notionDatabaseId: string,
) {
  console.log("Starting Supabase -> Notion sync...");

  const { data: programacoes } = await supabase
    .from("programacoes")
    .select("id, titulo, tipo, status, data, descricao, escola_id, aap_id, programa")
    .order("created_at", { ascending: false });

  if (!programacoes || programacoes.length === 0) {
    console.log("No programacoes to export");
    return { exported: 0, updated: 0, skipped: 0, ignored: 0, errors: 0 };
  }

  console.log(`Found ${programacoes.length} programacoes to check`);

  // Buscar sync logs
  const { data: syncLogs } = await supabase
    .from("notion_sync_log")
    .select("registro_id, notion_page_id")
    .eq("status", "sucesso")
    .eq("tabela_destino", "programacoes");

  const exportedMap = new Map<string, string>();
  for (const log of syncLogs || []) {
    if (log.registro_id && log.notion_page_id && !exportedMap.has(log.registro_id)) {
      exportedMap.set(log.registro_id, log.notion_page_id);
    }
  }

  // Pre-carregar escolas e sync_config
  const { data: escolas } = await supabase.from("escolas").select("id, nome");
  const escolaMap = new Map((escolas || []).map((e) => [e.id, e.nome]));

  const { data: syncConfigs } = await supabase.from("notion_sync_config").select("*").eq("ativo", true);
  const aapToNotionUser = new Map<string, string>();
  for (const c of syncConfigs || []) {
    if (c.system_user_id && c.notion_user_id) {
      aapToNotionUser.set(c.system_user_id, c.notion_user_id);
    }
  }

  const results = { exported: 0, updated: 0, skipped: 0, ignored: 0, errors: 0 };

  for (const prog of programacoes) {
    try {
      // Filtro por programa + tipo
      if (!deveSincronizar(prog.programa, prog.tipo)) {
        results.ignored++;
        continue;
      }

      const tipoNotion = TIPO_TO_NOTION[prog.tipo];
      if (!tipoNotion) {
        results.ignored++;
        continue;
      }

      const statusNotion = STATUS_TO_NOTION[prog.status] || "A fazer";
      const escolaNome = escolaMap.get(prog.escola_id) || null;
      const redeNotionId = escolaNome ? REDE_SUPABASE_TO_NOTION[escolaNome] : null;
      const notionUserId = aapToNotionUser.get(prog.aap_id) || null;

      // Ja exportado? -> verificar se precisa atualizar
      const existingNotionPageId = exportedMap.get(prog.id);

      if (existingNotionPageId) {
        const notionPage = await notionFetch(notionApiKey, `/pages/${existingNotionPageId}`);
        if (!notionPage) {
          results.errors++;
          continue;
        }

        const currentStatus = notionPage.properties?.Status?.status?.name || "A fazer";
        const currentPrazo = notionPage.properties?.Prazo?.date?.start || null;

        const updateProps: Record<string, unknown> = {};
        let needsUpdate = false;

        const expectedNotionStatus = STATUS_TO_NOTION[prog.status];
        if (expectedNotionStatus && currentStatus !== expectedNotionStatus) {
          updateProps["Status"] = { status: { name: expectedNotionStatus } };
          needsUpdate = true;
        }
        if (prog.data && currentPrazo !== prog.data) {
          updateProps["Prazo"] = { date: { start: prog.data } };
          needsUpdate = true;
        }

        if (needsUpdate) {
          await notionFetch(notionApiKey, `/pages/${existingNotionPageId}`, "PATCH", {
            properties: updateProps,
          });
          results.updated++;
          console.log(`Updated Notion page ${existingNotionPageId} from programacao ${prog.id}`);
        } else {
          results.skipped++;
        }
        continue;
      }

      // Novo: criar pagina no Notion
      const properties: Record<string, unknown> = {
        Tarefa: { title: [{ text: { content: prog.titulo } }] },
        Status: { status: { name: statusNotion } },
        "Tipo da Ação": { select: { name: tipoNotion } },
      };

      if (prog.data) properties["Prazo"] = { date: { start: prog.data } };
      if (prog.descricao) properties["Descrição"] = { rich_text: [{ text: { content: prog.descricao } }] };
      if (redeNotionId) properties["Rede"] = { relation: [{ id: redeNotionId }] };
      if (notionUserId) properties["Responsável"] = { people: [{ id: notionUserId }] };

      const notionPage = await notionFetch(notionApiKey, "/pages", "POST", {
        parent: { database_id: notionDatabaseId },
        properties,
      });

      if (!notionPage) {
        results.errors++;
        continue;
      }

      await supabase.from("notion_sync_log").insert({
        notion_page_id: notionPage.id,
        notion_database_id: notionDatabaseId,
        tabela_destino: "programacoes",
        registro_id: prog.id,
        operacao: "export",
        status: "sucesso",
      });

      results.exported++;
      console.log(`Exported programacao ${prog.id} -> Notion page ${notionPage.id} [${prog.programa}]`);
    } catch (error) {
      console.error(`Error exporting programacao ${prog.id}:`, error);
      results.errors++;
    }
  }

  if (results.ignored > 0) {
    console.log(`${results.ignored} programacao(es) ignored (programa or tipo not configured)`);
  }

  return results;
}

// ============================================================
// DIRECAO 2: Notion -> Supabase (importar/atualizar)
// ============================================================

async function syncNotionToSupabase(
  supabase: ReturnType<typeof createClient>,
  notionApiKey: string,
  notionDatabaseId: string,
) {
  console.log("Starting Notion -> Supabase sync...");

  // Buscar todas as paginas do Notion com paginacao
  let allPages: NotionPage[] = [];
  let hasMore = true;
  let startCursor: string | undefined;

  while (hasMore) {
    const body: Record<string, unknown> = { page_size: 100 };
    if (startCursor) body.start_cursor = startCursor;
    const result = await notionFetch(notionApiKey, `/databases/${notionDatabaseId}/query`, "POST", body);
    if (!result) break;
    allPages = allPages.concat(result.results);
    hasMore = result.has_more;
    startCursor = result.next_cursor;
  }

  console.log(`Found ${allPages.length} pages in Notion`);

  const tiposNotionPermitidos = new Set(TIPOS_PARA_SINCRONIZAR.map((t) => TIPO_TO_NOTION[t]).filter(Boolean));

  // Pre-carregar escolas e sync_config
  const { data: escolas } = await supabase.from("escolas").select("id, nome");
  const escolaByName = new Map((escolas || []).map((e) => [e.nome, e.id]));

  const { data: syncConfigs } = await supabase.from("notion_sync_config").select("*").eq("ativo", true);

  const results = { imported: 0, updated: 0, skipped: 0, errors: 0 };

  for (const page of allPages) {
    try {
      const props = page.properties;
      const tipoNotion = extractSelect(props["Tipo da Ação"]);

      if (!tipoNotion || !tiposNotionPermitidos.has(tipoNotion)) {
        results.skipped++;
        continue;
      }

      const titulo = extractText(props["Tarefa"]) || extractText(props["Nome"]) || "Sem título";
      const descricao = extractText(props["Descrição"]);
      const statusNotion = extractStatus(props["Status"]);
      const prazoStr = extractDate(props["Prazo"]);
      const responsavelNotionIds = extractPeopleIds(props["Responsável"]);
      const responsavelEmails = extractPeopleEmails(props["Responsável"]);
      const redeRelationIds = extractRelationIds(props["Rede"]);

      const statusInfo = STATUS_TO_SUPABASE[statusNotion] || { status: "prevista", tabela: "programacoes" as const };
      const tipoSupabase = TIPO_FROM_NOTION[tipoNotion] || "formacao";

      // Verificar se ja foi sincronizado
      const { data: existingLog } = await supabase
        .from("notion_sync_log")
        .select("registro_id, tabela_destino")
        .eq("notion_page_id", page.id)
        .eq("status", "sucesso")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Se ja existe, atualizar
      if (existingLog?.registro_id) {
        const tabela = existingLog.tabela_destino || "programacoes";
        const { data: existing } = await supabase
          .from(tabela)
          .select("id, status, data, escola_id, aap_id")
          .eq("id", existingLog.registro_id)
          .maybeSingle();

        if (existing) {
          const updateData: Record<string, unknown> = {};
          let changed = false;

          if (existing.status !== statusInfo.status) {
            updateData.status = statusInfo.status;
            changed = true;
          }
          if (prazoStr && existing.data !== prazoStr) {
            updateData.data = prazoStr;
            changed = true;
          }
          // Atualizar rede se mudou
          if (redeRelationIds.length > 0) {
            const redeNome = REDE_NOTION_TO_SUPABASE[redeRelationIds[0]];
            if (redeNome) {
              const escolaId = escolaByName.get(redeNome);
              if (escolaId && escolaId !== existing.escola_id) {
                updateData.escola_id = escolaId;
                changed = true;
              }
            }
          }
          // Atualizar responsavel se mudou
          if (responsavelNotionIds.length > 0) {
            const config = (syncConfigs || []).find((c) => c.notion_user_id === responsavelNotionIds[0]);
            if (config && config.system_user_id !== existing.aap_id) {
              updateData.aap_id = config.system_user_id;
              changed = true;
            }
          }

          if (changed) {
            await supabase.from(tabela).update(updateData).eq("id", existingLog.registro_id);
            results.updated++;
            console.log(`Updated ${tabela}/${existingLog.registro_id} from Notion page ${page.id}`);
          } else {
            results.skipped++;
          }
        }
        continue;
      }

      // Novo registro: resolver usuario
      let aapId: string | null = null;
      let escolaId: string | null = null;

      // Tentar por Notion User ID primeiro
      for (const notionUserId of responsavelNotionIds) {
        const config = (syncConfigs || []).find((c) => c.notion_user_id === notionUserId && c.ativo);
        if (config) {
          aapId = config.system_user_id;
          escolaId = config.escola_padrao_id;
          break;
        }
      }

      // Fallback: tentar por email
      if (!aapId) {
        for (const email of responsavelEmails) {
          const config = (syncConfigs || []).find((c) => c.notion_user_email === email && c.ativo);
          if (config) {
            aapId = config.system_user_id;
            escolaId = config.escola_padrao_id;
            break;
          }
        }
      }

      // Fallback: buscar pelo email no profiles
      if (!aapId && responsavelEmails.length > 0) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", responsavelEmails[0])
          .maybeSingle();
        if (profile) aapId = profile.id;
      }

      if (!aapId) {
        results.skipped++;
        continue;
      }

      // Resolver escola pela Rede do Notion
      if (redeRelationIds.length > 0) {
        const redeNome = REDE_NOTION_TO_SUPABASE[redeRelationIds[0]];
        if (redeNome) {
          const redeEscolaId = escolaByName.get(redeNome);
          if (redeEscolaId) escolaId = redeEscolaId;
        }
      }

      // Fallback: primeira escola do usuario
      if (!escolaId) {
        const { data: entidade } = await supabase
          .from("user_entidades")
          .select("escola_id")
          .eq("user_id", aapId)
          .limit(1)
          .maybeSingle();
        if (entidade) escolaId = entidade.escola_id;
      }

      if (!escolaId) {
        results.skipped++;
        continue;
      }

      const data = prazoStr || new Date().toISOString().split("T")[0];

      const programacaoData = {
        titulo,
        tipo: tipoSupabase,
        data,
        aap_id: aapId,
        escola_id: escolaId,
        segmento: "anos_iniciais",
        componente: "polivalente",
        ano_serie: "todos",
        programa: PROGRAMAS_PARA_SINCRONIZAR,
        status: statusInfo.status,
        horario_inicio: "08:00",
        horario_fim: "12:00",
        descricao: descricao || null,
      };

      const { data: newProg, error } = await supabase
        .from("programacoes")
        .insert(programacaoData)
        .select("id")
        .single();

      if (error) throw error;

      await supabase.from("notion_sync_log").insert({
        notion_page_id: page.id,
        notion_database_id: notionDatabaseId,
        tabela_destino: "programacoes",
        registro_id: newProg.id,
        operacao: "import",
        status: "sucesso",
        payload: props,
      });

      results.imported++;
      console.log(`Imported Notion page ${page.id} -> programacoes/${newProg.id}`);
    } catch (error) {
      console.error(`Error processing page ${page.id}:`, error);
      results.errors++;
    }
  }

  return results;
}

// ============================================================
// Servidor principal
// ============================================================

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const notionApiKey = Deno.env.get("NOTION_API_KEY");
  const notionDatabaseId = Deno.env.get("NOTION_DATABASE_ID");

  if (!supabaseUrl || !supabaseServiceKey) {
    return new Response(JSON.stringify({ error: "Server configuration error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  if (!notionApiKey || !notionDatabaseId) {
    return new Response(JSON.stringify({ error: "Notion not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") || "sync";

    // Autenticacao para sync/export/import/test
    if (["sync", "export", "import", "test"].includes(action)) {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const token = authHeader.replace("Bearer ", "");
      const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claims?.claims?.sub) {
        return new Response(JSON.stringify({ error: "Invalid token" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const userId = claims.claims.sub as string;
      const { data: isAdminOrGestor } = await supabase.rpc("is_admin_or_gestor", { _user_id: userId });
      if (!isAdminOrGestor) {
        return new Response(JSON.stringify({ error: "Forbidden" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // Autenticacao para cron (secret key)
    if (action === "cron") {
      const cronSecret = Deno.env.get("NOTIFICATION_SECRET_KEY");
      const providedSecret = req.headers.get("x-webhook-secret") || url.searchParams.get("secret");
      if (!cronSecret || providedSecret !== cronSecret) {
        return new Response(JSON.stringify({ error: "Unauthorized cron" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // ---- ACTION: sync (bidirecional — botao na plataforma) ----
    if (action === "sync") {
      if (!checkRateLimit("notion-sync:global", 1, 60_000)) {
        return new Response(JSON.stringify({ error: "Sincronização já em andamento. Aguarde um momento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("=== SYNC BIDIRECIONAL (botao) ===");
      console.log(`Programas: ${PROGRAMAS_PARA_SINCRONIZAR.join(", ")}`);
      console.log(`Tipos: ${TIPOS_PARA_SINCRONIZAR.join(", ")}`);

      const exportResults = await syncSupabaseToNotion(supabase, notionApiKey, notionDatabaseId);
      const importResults = await syncNotionToSupabase(supabase, notionApiKey, notionDatabaseId);

      return new Response(
        JSON.stringify({
          success: true,
          results: {
            supabaseToNotion: exportResults,
            notionToSupabase: importResults,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ---- ACTION: export (somente Supabase -> Notion) ----
    if (action === "export") {
      if (!checkRateLimit("notion-sync:export", 1, 60_000)) {
        return new Response(JSON.stringify({ error: "Exportação já em andamento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = await syncSupabaseToNotion(supabase, notionApiKey, notionDatabaseId);
      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: import (somente Notion -> Supabase) ----
    if (action === "import") {
      if (!checkRateLimit("notion-sync:import", 1, 60_000)) {
        return new Response(JSON.stringify({ error: "Importação já em andamento." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const results = await syncNotionToSupabase(supabase, notionApiKey, notionDatabaseId);
      return new Response(JSON.stringify({ success: true, results }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ---- ACTION: cron (chamado pelo agendador do Supabase) ----
    if (action === "cron") {
      console.log("=== SYNC BIDIRECIONAL (cron) ===");

      const exportResults = await syncSupabaseToNotion(supabase, notionApiKey, notionDatabaseId);
      const importResults = await syncNotionToSupabase(supabase, notionApiKey, notionDatabaseId);

      return new Response(
        JSON.stringify({
          success: true,
          results: {
            supabaseToNotion: exportResults,
            notionToSupabase: importResults,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ---- ACTION: test (teste de conexao) ----
    if (action === "test") {
      const dbInfo = await notionFetch(notionApiKey, `/databases/${notionDatabaseId}`);
      if (!dbInfo) throw new Error("Notion connection failed");

      return new Response(
        JSON.stringify({
          success: true,
          database: {
            id: dbInfo.id,
            title: dbInfo.title?.[0]?.plain_text || "Unknown",
            properties: Object.keys(dbInfo.properties),
          },
          config: {
            programasSincronizados: PROGRAMAS_PARA_SINCRONIZAR,
            tiposSincronizados: TIPOS_PARA_SINCRONIZAR,
            redesMapeadas: Object.keys(REDE_SUPABASE_TO_NOTION).length,
          },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action. Use: sync, export, import, cron, test" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in notion-sync:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
