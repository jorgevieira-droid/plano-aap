import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY")!;

interface TextSample {
  field_key: string;
  label: string;
  values: string[];
}

interface RequestBody {
  formType: string;
  instrumentLabel: string;
  programaLabel: string;
  totalRegistros: number;
  textSamples: TextSample[];
}

interface ThemeOut {
  label: string;
  count: number;
  descricao: string;
}

interface HighlightOut {
  tipo: "destaque" | "alerta" | "padrao";
  texto: string;
}

interface AiOutput {
  themesByField: Record<string, ThemeOut[]>;
  highlights: HighlightOut[];
  resumoExecutivo: string;
}

const truncate = (s: string, n = 600) => (s.length > n ? s.slice(0, n) + "…" : s);

function buildSystemPrompt(instrumentLabel: string, programaLabel: string, total: number) {
  return [
    `Você é um analista pedagógico que produz relatórios narrativos consolidados a partir de campos textuais de instrumentos pedagógicos.`,
    `Instrumento: ${instrumentLabel}. Programa: ${programaLabel}. Total de registros considerados: ${total}.`,
    `Para cada campo textual fornecido, categorize as respostas em 3 a 6 TEMAS objetivos (rótulo curto + descrição em 1-2 frases) e devolva quantos registros mencionam cada tema.`,
    `Em seguida, gere de 3 a 6 destaques globais com tipo:`,
    `- "destaque": padrão positivo recorrente`,
    `- "alerta": fragilidade ou risco recorrente`,
    `- "padrao": padrão neutro relevante (ex.: encaminhamento mais comum).`,
    `Escreva tudo em PORTUGUÊS DO BRASIL, tom técnico-pedagógico, sem citar IDs ou nomes próprios. Não invente dados.`,
    `Resuma em "resumoExecutivo" (3-5 frases) o panorama geral.`,
  ].join("\n");
}

function buildUserPrompt(samples: TextSample[]) {
  const blocks = samples.map((s) => {
    const lines = s.values
      .map((v, i) => `  [${i + 1}] ${truncate(String(v).replace(/\s+/g, " ").trim())}`)
      .join("\n");
    return `## Campo: ${s.label} (chave: ${s.field_key}) — ${s.values.length} respostas\n${lines || "  (vazio)"}`;
  });
  return blocks.join("\n\n");
}

const RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    resumoExecutivo: { type: "string" },
    themesByField: {
      type: "object",
      additionalProperties: {
        type: "array",
        items: {
          type: "object",
          properties: {
            label: { type: "string" },
            count: { type: "integer", minimum: 0 },
            descricao: { type: "string" },
          },
          required: ["label", "count", "descricao"],
          additionalProperties: false,
        },
      },
    },
    highlights: {
      type: "array",
      items: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["destaque", "alerta", "padrao"] },
          texto: { type: "string" },
        },
        required: ["tipo", "texto"],
        additionalProperties: false,
      },
    },
  },
  required: ["resumoExecutivo", "themesByField", "highlights"],
  additionalProperties: false,
};

serve(async (req) => {
  const pre = handleCorsPreflightRequest(req);
  if (pre) return pre;
  const cors = getCorsHeaders(req);

  try {
    const body = (await req.json()) as RequestBody;
    if (!body?.formType || !Array.isArray(body.textSamples)) {
      return new Response(JSON.stringify({ error: "Payload inválido" }), {
        status: 400,
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    // Filter empty fields and cap to ~150 samples per field
    const samples = body.textSamples
      .map((s) => ({
        ...s,
        values: (s.values || []).filter((v) => v && String(v).trim()).slice(0, 150),
      }))
      .filter((s) => s.values.length > 0);

    if (samples.length === 0) {
      const empty: AiOutput = {
        themesByField: {},
        highlights: [],
        resumoExecutivo: `Foram considerados ${body.totalRegistros} registro(s) do instrumento ${body.instrumentLabel}, mas não há campos textuais suficientes para gerar análise temática.`,
      };
      return new Response(JSON.stringify(empty), {
        headers: { ...cors, "Content-Type": "application/json" },
      });
    }

    const systemPrompt = buildSystemPrompt(body.instrumentLabel, body.programaLabel, body.totalRegistros);
    const userPrompt = buildUserPrompt(samples);

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "narrative_report",
            strict: true,
            schema: RESPONSE_SCHEMA,
          },
        },
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      if (resp.status === 429) {
        return new Response(
          JSON.stringify({ error: "Limite de requisições à IA atingido. Tente novamente em instantes." }),
          { status: 429, headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      if (resp.status === 402) {
        return new Response(
          JSON.stringify({ error: "Créditos da IA esgotados. Recarregue em Lovable Cloud para continuar." }),
          { status: 402, headers: { ...cors, "Content-Type": "application/json" } },
        );
      }
      return new Response(
        JSON.stringify({ error: `Falha na IA (${resp.status}): ${errText.slice(0, 300)}` }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    const ai = await resp.json();
    const content = ai?.choices?.[0]?.message?.content;
    let parsed: AiOutput;
    try {
      parsed = typeof content === "string" ? JSON.parse(content) : content;
    } catch {
      return new Response(
        JSON.stringify({ error: "Resposta da IA não pôde ser interpretada." }),
        { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...cors, "Content-Type": "application/json" },
    });
  } catch (e) {
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }),
      { status: 500, headers: { ...cors, "Content-Type": "application/json" } },
    );
  }
});
