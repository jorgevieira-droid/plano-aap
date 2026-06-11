import { useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { InstrumentField } from "@/hooks/useInstrumentFields";

// Same map as RelatorioInstrumentosPage
const DEDICATED_TABLES: Record<string, string> = {
  registro_consultoria_pedagogica: "consultoria_pedagogica_respostas",
  monitoramento_gestao: "relatorios_monitoramento_gestao",
  monitoramento_acoes_formativas: "relatorios_monit_acoes_formativas",
  observacao_aula_redes: "observacoes_aula_redes",
  visita_tecnica_alfabetizacao_redes: "relatorios_visita_tecnica_alfabetizacao_redes",
  encontro_microciclos_recomposicao: "relatorios_microciclos_recomposicao",
  encontro_eteg_redes: "relatorios_eteg_redes",
  encontro_professor_redes: "relatorios_professor_redes",
  observacao_aula: "avaliacoes_aula",
  visita_tecnica_alfabetizacao: "relatorios_visita_tecnica_alfabetizacao",
  visita_tecnica_tarl: "relatorios_visita_tecnica_tarl",
  observacao_aula_gpa: "observacoes_aula_gpa",
  reuniao_acomp_alfabetizacao: "relatorios_reuniao_acomp_alfabetizacao",
};

const actionTypeAliases = (formType: string) => {
  const aliases = new Set<string>([formType]);
  if (formType === "observacao_aula") {
    aliases.add("acompanhamento_aula");
    aliases.add("visita");
  }
  return Array.from(aliases);
};

export interface NarrativeFilters {
  programa: string;
  programaLabel: string;
  instrumento: string;
  instrumentoLabel: string;
  atorId?: string;
  atorLabel?: string;
  entidadeId?: string;
  entidadeLabel?: string;
  status?: string;
  statusLabel?: string;
  dataInicio?: string;
  dataFim?: string;
}

export interface RatingDimension {
  field_key: string;
  label: string;
  scaleMin: number;
  scaleMax: number;
  avg: number | null;
  count: number;
  distribution: { value: number; count: number; label?: string }[];
}

export interface ThemeItem {
  label: string;
  count: number;
  descricao: string;
}

export interface NarrativeReport {
  filters: NarrativeFilters;
  totalRegistros: number;
  entidadesUnicas: number;
  atoresUnicos: number;
  ratingDimensions: RatingDimension[];
  textFields: { field_key: string; label: string; responseCount: number }[];
  themesByField: Record<string, ThemeItem[]>;
  highlights: { tipo: "destaque" | "alerta" | "padrao"; texto: string }[];
  resumoExecutivo: string;
  rankingEntidades: { id: string; nome: string; count: number }[];
}

const isRatingField = (f: InstrumentField) =>
  f.field_type === "rating" ||
  (f.scale_min !== null && f.scale_max !== null && f.field_type !== "text" && f.field_type !== "textarea");

const isTextField = (f: InstrumentField) =>
  f.field_type === "textarea" || f.field_type === "text" || f.field_type === "string";

export function useNarrativeReport() {
  return useMutation<NarrativeReport, Error, { filters: NarrativeFilters; fields: InstrumentField[] }>({
    mutationFn: async ({ filters, fields }) => {
      // 1. Fetch registros_acao matching filters
      let regQuery = (supabase as any)
        .from("registros_acao")
        .select("id, data, status, aap_id, escola_id, programa, tipo")
        .in("tipo", actionTypeAliases(filters.instrumento))
        .contains("programa", [filters.programa])
        .order("data", { ascending: false })
        .limit(5000);
      if (filters.atorId && filters.atorId !== "todos") regQuery = regQuery.eq("aap_id", filters.atorId);
      if (filters.entidadeId && filters.entidadeId !== "todos") regQuery = regQuery.eq("escola_id", filters.entidadeId);
      if (filters.status && filters.status !== "todos") regQuery = regQuery.eq("status", filters.status);
      if (filters.dataInicio) regQuery = regQuery.gte("data", filters.dataInicio);
      if (filters.dataFim) regQuery = regQuery.lte("data", filters.dataFim);
      const { data: registros, error: regErr } = await regQuery;
      if (regErr) throw regErr;
      const regs = (registros || []) as any[];
      const registroIds = regs.map((r) => r.id);

      // 2. Fetch responses
      const dedicated = DEDICATED_TABLES[filters.instrumento];
      const ratingFields = fields.filter(isRatingField);
      const textFields = fields.filter(isTextField);
      type RowResp = Record<string, any>;
      let responsesByRegistro = new Map<string, RowResp>();

      if (registroIds.length > 0) {
        if (dedicated) {
          const fieldKeys = fields.map((f) => f.field_key);
          const cols = ["id", "registro_acao_id", ...fieldKeys].join(", ");
          const { data, error } = await (supabase as any)
            .from(dedicated)
            .select(cols)
            .in("registro_acao_id", registroIds)
            .limit(5000);
          if (error) throw error;
          (data || []).forEach((r: any) => {
            if (!responsesByRegistro.has(r.registro_acao_id)) responsesByRegistro.set(r.registro_acao_id, r);
          });
        } else {
          const { data, error } = await (supabase as any)
            .from("instrument_responses")
            .select("registro_acao_id, responses")
            .eq("form_type", filters.instrumento)
            .in("registro_acao_id", registroIds)
            .limit(5000);
          if (error) throw error;
          (data || []).forEach((r: any) => {
            if (!responsesByRegistro.has(r.registro_acao_id))
              responsesByRegistro.set(r.registro_acao_id, r.responses || {});
          });
        }
      }

      // Only consider registros with response data
      const regsWithResp = regs.filter((r) => responsesByRegistro.has(r.id));
      const totalRegistros = regsWithResp.length;

      // 3. Aggregations — rating dimensions
      const isRedesScale = (f: InstrumentField) => (f.scale_min ?? 0) === 0 && (f.scale_max ?? 0) === 2;

      const ratingDimensions: RatingDimension[] = ratingFields.map((f) => {
        const min = f.scale_min ?? 0;
        const max = f.scale_max ?? 4;
        const dist = new Map<number, number>();
        let sum = 0;
        let n = 0;
        const excludeZero = !isRedesScale(f);
        for (const r of regsWithResp) {
          const resp = responsesByRegistro.get(r.id)!;
          const raw = resp[f.field_key];
          const num = typeof raw === "number" ? raw : Number(raw);
          if (!Number.isFinite(num)) continue;
          if (excludeZero && num === 0) continue;
          dist.set(num, (dist.get(num) || 0) + 1);
          sum += num;
          n += 1;
        }
        const distribution: RatingDimension["distribution"] = [];
        for (let v = min; v <= max; v++) {
          const lbl = f.scale_labels?.find((s) => s.value === v)?.label;
          distribution.push({ value: v, count: dist.get(v) || 0, label: lbl });
        }
        return {
          field_key: f.field_key,
          label: f.label,
          scaleMin: min,
          scaleMax: max,
          avg: n > 0 ? sum / n : null,
          count: n,
          distribution,
        };
      });

      // 4. Text samples per field
      const textSamples = textFields.map((f) => {
        const values: string[] = [];
        for (const r of regsWithResp) {
          const resp = responsesByRegistro.get(r.id)!;
          const v = resp[f.field_key];
          if (typeof v === "string" && v.trim()) values.push(v.trim());
        }
        return { field_key: f.field_key, label: f.label, values };
      });

      const textFieldsMeta = textSamples.map((s) => ({
        field_key: s.field_key,
        label: s.label,
        responseCount: s.values.length,
      }));

      // 5. Entidade ranking
      const escolaCounts = new Map<string, number>();
      regsWithResp.forEach((r) => {
        if (r.escola_id) escolaCounts.set(r.escola_id, (escolaCounts.get(r.escola_id) || 0) + 1);
      });
      const entidadesUnicas = escolaCounts.size;
      const atoresUnicos = new Set(regsWithResp.map((r) => r.aap_id).filter(Boolean)).size;

      const escolaIds = Array.from(escolaCounts.keys());
      let rankingEntidades: NarrativeReport["rankingEntidades"] = [];
      if (escolaIds.length > 0) {
        const { data: escolas } = await (supabase as any)
          .from("escolas")
          .select("id, nome")
          .in("id", escolaIds);
        const nameById = new Map<string, string>();
        (escolas || []).forEach((e: any) => nameById.set(e.id, e.nome || "—"));
        rankingEntidades = Array.from(escolaCounts.entries())
          .map(([id, count]) => ({ id, nome: nameById.get(id) || "—", count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 15);
      }

      // 6. Call edge function for AI categorization
      let aiOut = {
        themesByField: {} as Record<string, ThemeItem[]>,
        highlights: [] as NarrativeReport["highlights"],
        resumoExecutivo: "",
      };

      const hasText = textSamples.some((s) => s.values.length > 0);
      if (totalRegistros > 0 && hasText) {
        const { data, error } = await supabase.functions.invoke("generate-narrative-report", {
          body: {
            formType: filters.instrumento,
            instrumentLabel: filters.instrumentoLabel,
            programa: filters.programa,
            programaLabel: filters.programaLabel,
            totalRegistros,
            textSamples,
          },
        });
        if (error) {
          throw new Error((data as any)?.error || error.message || "Falha ao gerar análise por IA");
        }
        aiOut = data as any;
      } else if (totalRegistros === 0) {
        aiOut.resumoExecutivo = "Nenhum registro encontrado para os filtros selecionados.";
      } else {
        aiOut.resumoExecutivo = `Foram considerados ${totalRegistros} registro(s), porém não há campos textuais preenchidos para gerar análise temática.`;
      }

      return {
        filters,
        totalRegistros,
        entidadesUnicas,
        atoresUnicos,
        ratingDimensions,
        textFields: textFieldsMeta,
        themesByField: aiOut.themesByField || {},
        highlights: aiOut.highlights || [],
        resumoExecutivo: aiOut.resumoExecutivo || "",
        rankingEntidades,
      };
    },
  });
}
