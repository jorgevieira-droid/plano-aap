import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// Tables to export with their timestamp column for incremental sync
const TABLES_CONFIG: { name: string; timestampCol: string }[] = [
  { name: "avaliacoes_aula", timestampCol: "created_at" },
  { name: "observacoes_aula_redes", timestampCol: "created_at" },
  { name: "relatorios_eteg_redes", timestampCol: "created_at" },
  { name: "relatorios_professor_redes", timestampCol: "created_at" },
  { name: "registros_acao", timestampCol: "updated_at" },
  { name: "programacoes", timestampCol: "updated_at" },
  { name: "presencas", timestampCol: "created_at" },
  { name: "escolas", timestampCol: "created_at" },
  { name: "professores", timestampCol: "updated_at" },
  { name: "profiles", timestampCol: "updated_at" },
];

// --- GCP Auth helpers ---

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function createSignedJwt(
  serviceAccount: { client_email: string; private_key: string },
  scopes: string[]
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const payload = {
    iss: serviceAccount.client_email,
    scope: scopes.join(" "),
    aud: "https://oauth2.googleapis.com/token",
    iat: now,
    exp: now + 3600,
  };

  const enc = new TextEncoder();
  const headerB64 = base64url(enc.encode(JSON.stringify(header)));
  const payloadB64 = base64url(enc.encode(JSON.stringify(payload)));
  const signingInput = `${headerB64}.${payloadB64}`;

  const key = await importPrivateKey(serviceAccount.private_key);
  const signature = new Uint8Array(
    await crypto.subtle.sign(
      "RSASSA-PKCS1-v1_5",
      key,
      enc.encode(signingInput)
    )
  );

  return `${signingInput}.${base64url(signature)}`;
}

async function getAccessToken(
  serviceAccount: { client_email: string; private_key: string }
): Promise<string> {
  const jwt = await createSignedJwt(serviceAccount, [
    "https://www.googleapis.com/auth/bigquery",
  ]);

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${jwt}`,
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Failed to get GCP access token: ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

// --- BigQuery streaming insert ---

async function insertRowsToBigQuery(
  accessToken: string,
  projectId: string,
  datasetId: string,
  tableId: string,
  rows: Record<string, unknown>[]
): Promise<{ insertedCount: number; errors: string[] }> {
  if (rows.length === 0) return { insertedCount: 0, errors: [] };

  const BATCH_SIZE = 500;
  let totalInserted = 0;
  const allErrors: string[] = [];

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const requestBody = {
      kind: "bigquery#tableDataInsertAllRequest",
      ignoreUnknownValues: true,
      skipInvalidRows: true,
      rows: batch.map((row, idx) => ({
        insertId: `${tableId}_${i + idx}_${Date.now()}`,
        json: row,
      })),
    };

    const url = `https://bigquery.googleapis.com/bigquery/v2/projects/${projectId}/datasets/${datasetId}/tables/${tableId}/insertAll`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await res.json();

    if (!res.ok) {
      allErrors.push(
        `Batch ${Math.floor(i / BATCH_SIZE)}: HTTP ${res.status} - ${JSON.stringify(result.error?.message || result)}`
      );
      continue;
    }

    if (result.insertErrors && result.insertErrors.length > 0) {
      const errMsgs = result.insertErrors
        .slice(0, 5)
        .map(
          (e: { index: number; errors: { reason: string; message: string }[] }) =>
            `Row ${e.index}: ${e.errors.map((err) => err.message).join(", ")}`
        );
      allErrors.push(...errMsgs);
      totalInserted += batch.length - result.insertErrors.length;
    } else {
      totalInserted += batch.length;
    }
  }

  return { insertedCount: totalInserted, errors: allErrors };
}

// --- Main handler ---

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Parse GCP credentials
    const gcpKeyJson = Deno.env.get("GCP_SERVICE_ACCOUNT_KEY");
    if (!gcpKeyJson) {
      throw new Error("GCP_SERVICE_ACCOUNT_KEY secret not configured");
    }
    const serviceAccount = JSON.parse(gcpKeyJson);
    const projectId = serviceAccount.project_id;

    const datasetId = Deno.env.get("BQ_DATASET_ID") || "acompanhamento_aaps";

    // Get GCP access token
    const accessToken = await getAccessToken(serviceAccount);

    // Create Supabase admin client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get sync state for all tables
    const { data: syncStates, error: syncError } = await supabase
      .from("bigquery_sync_state")
      .select("*");

    if (syncError) throw new Error(`Failed to read sync state: ${syncError.message}`);

    const syncMap = new Map(
      (syncStates || []).map((s: { table_name: string; last_synced_at: string }) => [
        s.table_name,
        s.last_synced_at,
      ])
    );

    const results: {
      table: string;
      status: string;
      rows: number;
      errors?: string[];
    }[] = [];

    for (const tableConfig of TABLES_CONFIG) {
      const { name: tableName, timestampCol } = tableConfig;
      const lastSynced = syncMap.get(tableName) || "1970-01-01T00:00:00Z";

      try {
        // Fetch new/updated rows (up to 5000 per run to avoid timeouts)
        const { data: rows, error: fetchError } = await supabase
          .from(tableName)
          .select("*")
          .gt(timestampCol, lastSynced)
          .order(timestampCol, { ascending: true })
          .limit(5000);

        if (fetchError) {
          throw new Error(`Fetch error: ${fetchError.message}`);
        }

        if (!rows || rows.length === 0) {
          results.push({ table: tableName, status: "skip", rows: 0 });

          await supabase
            .from("bigquery_sync_state")
            .update({ last_status: "success", updated_at: new Date().toISOString() })
            .eq("table_name", tableName);

          continue;
        }

        // Send to BigQuery
        const { insertedCount, errors } = await insertRowsToBigQuery(
          accessToken,
          projectId,
          datasetId,
          tableName,
          rows
        );

        // Find the max timestamp from exported rows
        const maxTimestamp = rows.reduce((max: string, row: Record<string, unknown>) => {
          const ts = row[timestampCol] as string;
          return ts > max ? ts : max;
        }, lastSynced);

        // Update sync state
        await supabase
          .from("bigquery_sync_state")
          .update({
            last_synced_at: maxTimestamp,
            last_status: errors.length > 0 ? "partial" : "success",
            last_error: errors.length > 0 ? errors.join("; ").slice(0, 1000) : null,
            rows_exported: insertedCount,
            updated_at: new Date().toISOString(),
          })
          .eq("table_name", tableName);

        results.push({
          table: tableName,
          status: errors.length > 0 ? "partial" : "success",
          rows: insertedCount,
          ...(errors.length > 0 ? { errors } : {}),
        });
      } catch (tableError) {
        const errMsg = tableError instanceof Error ? tableError.message : String(tableError);

        await supabase
          .from("bigquery_sync_state")
          .update({
            last_status: "error",
            last_error: errMsg.slice(0, 1000),
            rows_exported: 0,
            updated_at: new Date().toISOString(),
          })
          .eq("table_name", tableName);

        results.push({ table: tableName, status: "error", rows: 0, errors: [errMsg] });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ success: false, error: errMsg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
