import React, { useEffect, useState } from 'react';
import { Loader2, Printer } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { exportSectionsToPdf } from '@/lib/pdfExport';
import { AcaoPrintForm } from './AcaoPrintForm';
import { getAcaoLabel, normalizeAcaoTipo } from '@/config/acaoPermissions';
import type { InstrumentField } from '@/hooks/useInstrumentFields';
import { toast } from 'sonner';

function slugify(s: string): string {
  return (s || 'acao')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'acao';
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  programacaoId: string | null;
  /** Alternativa ao programacaoId: abre a visualização a partir de um registro de ação */
  registroId?: string | null;
}

export function AcaoPrintDialog({ open, onOpenChange, programacaoId, registroId: registroIdProp = null }: Props) {
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [data, setData] = useState<{
    programacao: any;
    escolaNome: string;
    responsavelNome: string;
    professorNome?: string;
    fields: InstrumentField[];
    responses: Record<string, any> | null;
    textFields: { label: string; value: string | null | undefined }[];
    acaoLabel: string;
    presencas?: { nome: string; cargo?: string | null; presente: boolean }[];
    visitaMicrociclos?: any | null;
    visitaAlfabetizacao?: any | null;
    visitaAlfabetizacaoEscola?: any | null;
    visitaTarl?: any | null;
    observacaoGpa?: any | null;
    encontroMicrociclos?: any | null;
  } | null>(null);


  useEffect(() => {
    if (!open || (!programacaoId && !registroIdProp)) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let prog: any = null;
        let primaryRegistroId: string | null = null;

        if (programacaoId) {
          const { data: p } = await supabase
            .from('programacoes')
            .select('*')
            .eq('id', programacaoId)
            .maybeSingle();
          prog = p;
        } else if (registroIdProp) {
          const { data: reg } = await supabase
            .from('registros_acao')
            .select('*')
            .eq('id', registroIdProp)
            .maybeSingle();
          if (!reg) throw new Error('Registro não encontrado');
          primaryRegistroId = reg.id;
          if (reg.programacao_id) {
            const { data: p } = await supabase
              .from('programacoes')
              .select('*')
              .eq('id', reg.programacao_id)
              .maybeSingle();
            prog = p;
          }
          if (prog) {
            prog = { ...prog, data: reg.data || prog.data, status: reg.status || prog.status };
          } else {
            prog = {
              id: null,
              tipo: reg.tipo,
              titulo: getAcaoLabel(reg.tipo),
              data: reg.data,
              horario_inicio: '—',
              horario_fim: '—',
              segmento: reg.segmento,
              componente: reg.componente,
              status: reg.status,
              escola_id: reg.escola_id,
              aap_id: reg.aap_id,
            };
          }
        }
        if (!prog) throw new Error('Programação não encontrada');

        const [{ data: escola }, { data: responsavel }] = await Promise.all([
          prog.escola_id
            ? supabase.from('escolas').select('nome').eq('id', prog.escola_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
          prog.aap_id
            ? supabase.from('profiles').select('nome').eq('id', prog.aap_id).maybeSingle()
            : Promise.resolve({ data: null } as any),
        ]);

        const formType = normalizeAcaoTipo(prog.tipo);

        const { data: fields } = await (supabase as any)
          .from('instrument_fields')
          .select('*')
          .eq('form_type', formType)
          .order('sort_order', { ascending: true });

        // Load registros_acao to find responses if action was realized
        let registroIds: string[] = [];
        if (primaryRegistroId) {
          registroIds = [primaryRegistroId];
        } else if (prog.id) {
          const { data: registros } = await supabase
            .from('registros_acao')
            .select('id')
            .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
          registroIds = (registros || []).map((r: any) => r.id);
        }
        const registroId = registroIds[0];

        // Lista de presença
        let presencas: { nome: string; cargo?: string | null; presente: boolean }[] | undefined;
        if (registroIds.length > 0) {
          const { data: presRows } = await (supabase as any)
            .from('presencas')
            .select('presente, professor_id, professores(nome, cargo)')
            .in('registro_acao_id', registroIds);
          if (presRows && presRows.length > 0) {
            presencas = presRows
              .map((p: any) => ({
                nome: p.professores?.nome || '—',
                cargo: p.professores?.cargo || null,
                presente: !!p.presente,
              }))
              .sort((a: any, b: any) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }));
          }
        }


        let responses: Record<string, any> | null = null;
        const textFields: { label: string; value: string | null | undefined }[] = [];

        if (registroIds.length > 0) {
          // Generic instrument response — pode haver linhas duplicadas/parciais: mesclar todas.
          const { data: irRows } = await (supabase as any)
            .from('instrument_responses')
            .select('responses, created_at')
            .in('registro_acao_id', registroIds)
            .eq('form_type', formType)
            .order('created_at', { ascending: true });
          const merged: Record<string, any> = {};
          (irRows || []).forEach((row: any) => {
            Object.entries((row?.responses as Record<string, any>) || {}).forEach(([k, v]) => {
              if (v !== null && v !== undefined && v !== '') merged[k] = v;
            });
          });
          if (Object.keys(merged).length > 0) responses = merged;

          // Special tables
          if (formType === 'observacao_aula') {
            const { data: av } = await supabase
              .from('avaliacoes_aula')
              .select('clareza_objetivos,dominio_conteudo,estrategias_didaticas,engajamento_turma,gestao_tempo,observacoes')
              .eq('registro_acao_id', registroId)
              .maybeSingle();
            if (av) {
              responses = {
                clareza_objetivos: av.clareza_objetivos,
                dominio_conteudo: av.dominio_conteudo,
                estrategias_didaticas: av.estrategias_didaticas,
                engajamento_turma: av.engajamento_turma,
                gestao_tempo: av.gestao_tempo,
                ...(responses || {}),
              };
              if (av.observacoes) textFields.push({ label: 'Observações', value: av.observacoes });
            }
          }

          if (formType === 'registro_consultoria_pedagogica') {
            const { data: cr } = await supabase
              .from('consultoria_pedagogica_respostas')
              .select('boas_praticas,pontos_preocupacao,encaminhamentos,outros_pontos')
              .eq('registro_acao_id', registroId)
              .maybeSingle();
            if (cr) {
              textFields.push(
                { label: 'Boas práticas', value: cr.boas_praticas },
                { label: 'Pontos de preocupação', value: cr.pontos_preocupacao },
                { label: 'Encaminhamentos', value: cr.encaminhamentos },
                { label: 'Outros pontos', value: cr.outros_pontos },
              );
            }
          }
        }

        // Visitas Técnicas - Microciclos (tipo `observacao_aula_redes`) — tabela própria
        // Estratégia de busca em camadas para evitar PDF em branco quando o relatório
        // foi salvo em um registro_acao diferente do vinculado a esta programação.
        let visitaMicrociclos: any | null = null;
        let professorNomeRedes: string | undefined;
        if (formType === 'observacao_aula_redes') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            // Prioriza enviado > rascunho, e mais recente.
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          // 1) Direto pelo registro_acao_id principal desta programação
          if (registroId) {
            const { data: vmList } = await (supabase as any)
              .from('relatorios_visita_tecnica_microciclos')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaMicrociclos = pickBest(vmList);
          }

          // 2) Qualquer registro_acao desta mesma programação
          if (!visitaMicrociclos) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_microciclos')
                .select('*')
                .in('registro_acao_id', ids);
              visitaMicrociclos = pickBest(vmList);
            }
          }

          // 3) Fallback final: mesma escola + mesma data (relatório salvo em outro registro)
          if (!visitaMicrociclos && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'observacao_aula_redes');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_microciclos')
                .select('*')
                .in('registro_acao_id', ids);
              visitaMicrociclos = pickBest(vmList);
            }
          }

          if (visitaMicrociclos?.professor_observado) {
            professorNomeRedes = visitaMicrociclos.professor_observado;
          }
        }

        // Visita Técnica — Alfabetização (REDES) — tabela própria
        let visitaAlfabetizacao: any | null = null;
        if (formType === 'visita_tecnica_alfabetizacao_redes') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          if (registroId) {
            const { data: vmList } = await (supabase as any)
              .from('relatorios_visita_tecnica_alfabetizacao_redes')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaAlfabetizacao = pickBest(vmList);
          }

          if (!visitaAlfabetizacao) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao_redes')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacao = pickBest(vmList);
            }
          }

          if (!visitaAlfabetizacao && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'visita_tecnica_alfabetizacao_redes');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: vmList } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao_redes')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacao = pickBest(vmList);
            }
          }
        }


        // Visita Técnica — Alfabetização (Escolas/Redes/Regionais) — tabela própria
        let visitaAlfabetizacaoEscola: any | null = null;
        if (formType === 'visita_tecnica_alfabetizacao') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          if (registroId) {
            const { data: rows } = await (supabase as any)
              .from('relatorios_visita_tecnica_alfabetizacao')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaAlfabetizacaoEscola = pickBest(rows);
          }
          if (!visitaAlfabetizacaoEscola) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacaoEscola = pickBest(rows);
            }
          }
          if (!visitaAlfabetizacaoEscola && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'visita_tecnica_alfabetizacao');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('relatorios_visita_tecnica_alfabetizacao')
                .select('*')
                .in('registro_acao_id', ids);
              visitaAlfabetizacaoEscola = pickBest(rows);
            }
          }
        }

        // Visita Técnica — T@RL — tabela própria
        let visitaTarl: any | null = null;
        if (formType === 'visita_tecnica_tarl') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          if (registroId) {
            const { data: rows } = await (supabase as any)
              .from('relatorios_visita_tecnica_tarl')
              .select('*')
              .eq('registro_acao_id', registroId);
            visitaTarl = pickBest(rows);
          }
          if (!visitaTarl) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('relatorios_visita_tecnica_tarl')
                .select('*')
                .in('registro_acao_id', ids);
              visitaTarl = pickBest(rows);
            }
          }
          if (!visitaTarl && prog.escola_id && prog.data) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'visita_tecnica_tarl');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('relatorios_visita_tecnica_tarl')
                .select('*')
                .in('registro_acao_id', ids);
              visitaTarl = pickBest(rows);
            }
          }
        }

        // Observação de Aula (GPA) — tabela própria

        let observacaoGpa: any | null = null;
        if (formType === 'observacao_aula_gpa') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };
          if (registroId) {
            const { data: rows } = await (supabase as any)
              .from('observacoes_aula_gpa')
              .select('*')
              .eq('registro_acao_id', registroId);
            observacaoGpa = pickBest(rows);
          }
          if (!observacaoGpa) {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            const ids = (regs || []).map((r: any) => r.id);
            if (ids.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('observacoes_aula_gpa')
                .select('*')
                .in('registro_acao_id', ids);
              observacaoGpa = pickBest(rows);
            }
          }
        }

        // Visita Técnica à Secretaria (SME) — instrumento genérico com fallback em camadas
        if (formType === 'visita_tecnica_secretaria_sme' && !responses) {
          // 1) Qualquer registro_acao desta programação
          const { data: regs } = await supabase
            .from('registros_acao')
            .select('id')
            .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
          const ids = (regs || []).map((r: any) => r.id);
          if (ids.length > 0) {
            const { data: irRows } = await (supabase as any)
              .from('instrument_responses')
              .select('responses,created_at')
              .in('registro_acao_id', ids)
              .eq('form_type', formType);
            if (irRows && irRows.length > 0) {
              const sorted = [...irRows].sort((a: any, b: any) =>
                (b.created_at || '').localeCompare(a.created_at || ''),
              );
              if (sorted[0]?.responses) responses = sorted[0].responses;
            }
          }
          // 2) Fallback por escola + data + tipo
          if (!responses && prog.escola_id && prog.data) {
            const { data: regs2 } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('escola_id', prog.escola_id)
              .eq('data', prog.data)
              .eq('tipo', 'visita_tecnica_secretaria_sme');
            const ids2 = (regs2 || []).map((r: any) => r.id);
            if (ids2.length > 0) {
              const { data: irRows } = await (supabase as any)
                .from('instrument_responses')
                .select('responses,created_at')
                .in('registro_acao_id', ids2)
                .eq('form_type', formType);
              if (irRows && irRows.length > 0) {
                const sorted = [...irRows].sort((a: any, b: any) =>
                  (b.created_at || '').localeCompare(a.created_at || ''),
                );
                if (sorted[0]?.responses) responses = sorted[0].responses;
              }
            }
          }
        }



        // Encontro Formativo — Microciclos de Recomposição
        // Fonte primária: instrument_responses (mesma usada no dashboard).
        // Fallback: tabela própria relatorios_microciclos_recomposicao.
        let encontroMicrociclos: any | null = null;
        if (prog.tipo === 'encontro_microciclos_recomposicao') {
          const pickBest = (rows: any[] | null | undefined) => {
            if (!rows || rows.length === 0) return null;
            const sorted = [...rows].sort((a, b) => {
              const sa = a.status === 'enviado' ? 0 : 1;
              const sb = b.status === 'enviado' ? 0 : 1;
              if (sa !== sb) return sa - sb;
              return (b.updated_at || b.created_at || '').localeCompare(a.updated_at || a.created_at || '');
            });
            return sorted[0];
          };

          // Coleta todos os registros_acao relacionados a esta programação
          const registroIds: string[] = [];
          if (registroId) registroIds.push(registroId);
          {
            const { data: regs } = await supabase
              .from('registros_acao')
              .select('id')
              .eq('programacao_id', prog.id || '00000000-0000-0000-0000-000000000000');
            for (const r of (regs || []) as any[]) {
              if (!registroIds.includes(r.id)) registroIds.push(r.id);
            }
          }

          // 1) Tenta instrument_responses primeiro
          let irResponses: Record<string, any> | null = null;
          if (registroIds.length > 0) {
            const { data: irRows } = await (supabase as any)
              .from('instrument_responses')
              .select('responses,created_at')
              .in('registro_acao_id', registroIds)
              .eq('form_type', 'encontro_microciclos_recomposicao');
            if (irRows && irRows.length > 0) {
              const sorted = [...irRows].sort((a: any, b: any) =>
                (b.created_at || '').localeCompare(a.created_at || ''),
              );
              irResponses = sorted[0]?.responses || null;
            }
          }

          if (irResponses) {
            encontroMicrociclos = {
              ...irResponses,
              municipio: irResponses.municipio || (escola as any)?.nome || null,
              data: irResponses.data || prog.data || null,
              formador: irResponses.formador || (responsavel as any)?.nome || null,
              horario: irResponses.horario || (prog.horario_inicio && prog.horario_fim
                ? `${prog.horario_inicio} – ${prog.horario_fim}`
                : prog.horario_inicio || null),
              local: irResponses.local || prog.local || prog.local_outro || null,
            };
          } else {
            // 2) Fallback: tabela própria
            if (registroIds.length > 0) {
              const { data: rows } = await (supabase as any)
                .from('relatorios_microciclos_recomposicao')
                .select('*')
                .in('registro_acao_id', registroIds);
              encontroMicrociclos = pickBest(rows);
            }
            if (!encontroMicrociclos && prog.escola_id && prog.data) {
              const { data: regs } = await supabase
                .from('registros_acao')
                .select('id')
                .eq('escola_id', prog.escola_id)
                .eq('data', prog.data)
                .eq('tipo', 'encontro_microciclos_recomposicao');
              const ids = (regs || []).map((r: any) => r.id);
              if (ids.length > 0) {
                const { data: rows } = await (supabase as any)
                  .from('relatorios_microciclos_recomposicao')
                  .select('*')
                  .in('registro_acao_id', ids);
                encontroMicrociclos = pickBest(rows);
              }
            }
          }
        }


        if (cancelled) return;
        setData({
          programacao: prog,
          escolaNome: (escola as any)?.nome || '—',
          responsavelNome: (responsavel as any)?.nome || '—',
          professorNome: professorNomeRedes,
          fields: (fields || []) as InstrumentField[],
          responses,
          textFields,
          acaoLabel: getAcaoLabel(prog.tipo),
          visitaMicrociclos,
          visitaAlfabetizacao,
          visitaAlfabetizacaoEscola,
          visitaTarl,
          observacaoGpa,
          encontroMicrociclos,
        });
      } catch (e: any) {
        console.error(e);
        toast.error(e?.message || 'Erro ao carregar dados da ação');
        onOpenChange(false);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, programacaoId, onOpenChange]);

  const handleExport = async () => {
    if (!data) return;
    setExporting(true);
    try {
      await exportSectionsToPdf(
        [{
          node: (
            <AcaoPrintForm
              acaoLabel={data.acaoLabel}
              programacao={data.programacao}
              escolaNome={data.escolaNome}
              responsavelNome={data.responsavelNome}
              professorNome={data.professorNome}
              fields={data.fields}
              responses={data.responses}
              textFields={data.textFields}
              visitaMicrociclos={data.visitaMicrociclos}
              visitaAlfabetizacao={data.visitaAlfabetizacao}
              visitaAlfabetizacaoEscola={data.visitaAlfabetizacaoEscola}
              visitaTarl={data.visitaTarl}
              observacaoGpa={data.observacaoGpa}
              encontroMicrociclos={data.encontroMicrociclos}
            />
          ),
        }],
        `${slugify(data.acaoLabel)}-${slugify(data.escolaNome)}-${data.programacao.data}.pdf`,
        { title: data.acaoLabel, subtitle: `${data.escolaNome} | ${data.programacao.data}` },
      );
      toast.success('PDF gerado');
    } catch (e: any) {
      console.error(e);
      toast.error('Erro ao gerar PDF');
    } finally {
      setExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] sm:max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Imprimir formulário da ação</DialogTitle>
        </DialogHeader>

        {loading || !data ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : (
          <div className="text-sm space-y-2">
            <p><strong>{data.acaoLabel}</strong> — {data.programacao.titulo}</p>
            <p className="text-muted-foreground">
              Escola: {data.escolaNome} | Data: {data.programacao.data} | Status: {data.programacao.status}
            </p>
            <p className="text-muted-foreground text-xs">
              {data.programacao.status === 'realizada'
                ? 'O PDF incluirá os dados já preenchidos.'
                : 'O PDF trará a estrutura do formulário em branco para preenchimento.'}
            </p>
            {data.programacao.tipo === 'observacao_aula_redes'
              && data.programacao.status === 'realizada'
              && !data.visitaMicrociclos && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório de Visita Técnica preenchido para esta ação. O PDF será gerado em branco.
              </p>
            )}
            {data.programacao.tipo === 'visita_tecnica_alfabetizacao_redes'
              && data.programacao.status === 'realizada'
              && !data.visitaAlfabetizacao && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório de Visita Técnica preenchido para esta ação. O PDF será gerado em branco.
              </p>
            )}
            {data.programacao.tipo === 'visita_tecnica_alfabetizacao'
              && data.programacao.status === 'realizada'
              && !data.visitaAlfabetizacaoEscola && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório de Visita Técnica — Alfabetização preenchido para esta ação. O PDF será gerado em branco.
              </p>
            )}
            {data.programacao.tipo === 'visita_tecnica_tarl'
              && data.programacao.status === 'realizada'
              && !data.visitaTarl && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório de Visita Técnica — T@RL preenchido para esta ação. O PDF será gerado em branco.
              </p>
            )}
            {data.programacao.tipo === 'encontro_microciclos_recomposicao'
              && data.programacao.status === 'realizada'
              && !data.encontroMicrociclos && (
              <p className="text-xs text-destructive">
                Atenção: não localizamos um relatório preenchido para este Encontro Formativo. O PDF será gerado em branco.
              </p>
            )}
          </div>

        )}

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
          <Button onClick={handleExport} disabled={loading || exporting || !data}>
            {exporting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Printer className="w-4 h-4 mr-2" />}
            Gerar PDF
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
