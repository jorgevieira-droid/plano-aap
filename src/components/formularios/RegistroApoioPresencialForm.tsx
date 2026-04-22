import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { useInstrumentFields } from '@/hooks/useInstrumentFields';

export interface ApoioCadastroData {
  componente?: string | null;
  etapa?: string | null;
  turmaVoar?: string | null;
  escolaVoar?: boolean | null;
  professorId?: string | null;
  professorNome?: string | null;
  participantes?: string[] | null;
  participantesOutros?: string | null;
  obsPlanejada?: boolean | null;
  focos?: string[] | null;
  devolutiva?: string | null;
}

export interface RegistroApoioPresencialFormProps {
  registroAcaoId: string;
  escolaId: string;
  aapId: string;
  cadastro?: ApoioCadastroData;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const FOCO_OPTIONS = [
  { value: 'planejamento', label: 'Planejamento e domínio de conteúdo e recursos didáticos', dimension: 'Planejamento e Domínio do Conteúdo e Recursos Pedagógicos' },
  { value: 'estrategias', label: 'Estratégias de aprendizagem', dimension: 'Estratégias de Aprendizagem' },
  { value: 'gestao', label: 'Gestão de sala de aula', dimension: 'Gestão de Sala de Aula' },
];

const FORM_TYPE = 'registro_apoio_presencial';

export default function RegistroApoioPresencialForm({
  registroAcaoId,
  escolaId,
  aapId,
  cadastro,
  onSuccess,
  readOnly = false,
}: RegistroApoioPresencialFormProps) {
  const { fields, isLoading: fieldsLoading } = useInstrumentFields(FORM_TYPE);

  const focos = cadastro?.focos ?? [];
  const professorId = cadastro?.professorId ?? '';

  // (R) fields
  const [alunosPrevistos, setAlunosPrevistos] = useState<number | ''>('');
  const [alunosPresentes, setAlunosPresentes] = useState<number | ''>('');
  const [horarioPrevisto, setHorarioPrevisto] = useState('');
  const [horarioReal, setHorarioReal] = useState('');

  // Instrument responses
  const [responses, setResponses] = useState<Record<string, any>>({});

  const [saving, setSaving] = useState(false);

  // Load existing response
  useEffect(() => {
    if (!registroAcaoId) return;
    (supabase as any)
      .from('instrument_responses')
      .select('*')
      .eq('registro_acao_id', registroAcaoId)
      .eq('form_type', FORM_TYPE)
      .maybeSingle()
      .then(({ data }: any) => {
        if (data?.responses) {
          const r = data.responses as Record<string, any>;
          setResponses(r);
          if (r._alunos_previstos !== undefined && r._alunos_previstos !== null && r._alunos_previstos !== '') setAlunosPrevistos(r._alunos_previstos);
          if (r._alunos_presentes !== undefined && r._alunos_presentes !== null && r._alunos_presentes !== '') setAlunosPresentes(r._alunos_presentes);
          if (r._horario_previsto) setHorarioPrevisto(r._horario_previsto);
          if (r._horario_real) setHorarioReal(r._horario_real);
        }
      });
  }, [registroAcaoId]);

  // Filter instrument fields based on selected focos (from cadastro)
  const selectedDimensions = FOCO_OPTIONS
    .filter(f => focos.includes(f.value))
    .map(f => f.dimension);
  selectedDimensions.push('Obrigatórias');

  const visibleFieldKeys = fields
    .filter(f => f.dimension && selectedDimensions.includes(f.dimension))
    .map(f => f.field_key);

  const handleResponseChange = (key: string, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!registroAcaoId || !escolaId || !aapId) return;

    // Validate 4 mandatory textareas (Obrigatórias dimension)
    const obrigatoriasKeys = fields
      .filter(f => f.dimension === 'Obrigatórias')
      .map(f => f.field_key);
    for (const k of obrigatoriasKeys) {
      const v = responses[k];
      if (!v || (typeof v === 'string' && v.trim() === '')) {
        toast.error('Preencha todas as perguntas obrigatórias finais.');
        return;
      }
    }

    setSaving(true);
    try {
      const fullResponses = {
        ...responses,
        // Mirror (C) data into responses for historical/analytical use
        _componente: cadastro?.componente ?? null,
        _etapa: cadastro?.etapa ?? null,
        _turma_voar: cadastro?.turmaVoar ?? null,
        _escola_voar: cadastro?.escolaVoar ?? null,
        _participantes: cadastro?.participantes ?? [],
        _participantes_outros: cadastro?.participantesOutros ?? null,
        _obs_planejada: cadastro?.obsPlanejada ?? null,
        _focos: focos,
        _devolutiva: cadastro?.devolutiva ?? null,
        // (R) fields
        _alunos_previstos: alunosPrevistos,
        _alunos_presentes: alunosPresentes,
        _horario_previsto: horarioPrevisto,
        _horario_real: horarioReal,
      };

      const { data: existing } = await (supabase as any)
        .from('instrument_responses')
        .select('id')
        .eq('registro_acao_id', registroAcaoId)
        .eq('form_type', FORM_TYPE)
        .maybeSingle();

      if (existing) {
        const { error } = await (supabase as any)
          .from('instrument_responses')
          .update({
            responses: fullResponses,
            professor_id: professorId || undefined,
          })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any)
          .from('instrument_responses')
          .insert({
            registro_acao_id: registroAcaoId,
            form_type: FORM_TYPE,
            escola_id: escolaId,
            aap_id: aapId,
            professor_id: professorId || undefined,
            responses: fullResponses,
          });
        if (error) throw error;
      }

      toast.success('Registro de Apoio Presencial salvo com sucesso!');
      onSuccess?.();
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || 'Erro ao salvar formulário.');
    } finally {
      setSaving(false);
    }
  };

  if (fieldsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const focoLabels = FOCO_OPTIONS.filter(f => focos.includes(f.value)).map(f => f.label);

  return (
    <div className="space-y-6">
      {/* Read-only summary of (C) data */}
      {cadastro && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dados do Cadastro</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
            <div><span className="text-muted-foreground">Escola é VOAR: </span><span className="font-medium">{cadastro.escolaVoar == null ? '—' : (cadastro.escolaVoar ? 'Sim' : 'Não')}</span></div>
            <div><span className="text-muted-foreground">Componente: </span><span className="font-medium">{cadastro.componente || '—'}</span></div>
            <div><span className="text-muted-foreground">Etapa: </span><span className="font-medium">{cadastro.etapa || '—'}</span></div>
            {cadastro.escolaVoar && (
              <div><span className="text-muted-foreground">Turma observada (VOAR): </span><span className="font-medium">{cadastro.turmaVoar || '—'}</span></div>
            )}
            <div><span className="text-muted-foreground">Professor: </span><span className="font-medium">{cadastro.professorNome || '—'}</span></div>
            <div><span className="text-muted-foreground">Observação planejada: </span><span className="font-medium">{cadastro.obsPlanejada == null ? '—' : (cadastro.obsPlanejada ? 'Sim' : 'Não')}</span></div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Participantes: </span>
              <span className="font-medium">
                {(cadastro.participantes && cadastro.participantes.length > 0)
                  ? cadastro.participantes.join(', ') + (cadastro.participantesOutros ? ` (${cadastro.participantesOutros})` : '')
                  : '—'}
              </span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Foco(s) da observação: </span>
              <span className="font-medium">{focoLabels.length > 0 ? focoLabels.join(' • ') : '—'}</span>
            </div>
            <div className="md:col-span-2">
              <span className="text-muted-foreground">Devolutiva: </span><span className="font-medium">{cadastro.devolutiva || '—'}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* (R) fields: alunos + horários */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Realização</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Alunos previstos</Label>
              <Input
                type="number"
                min={0}
                value={alunosPrevistos}
                onChange={e => setAlunosPrevistos(e.target.value ? parseInt(e.target.value) : '')}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Alunos presentes</Label>
              <Input
                type="number"
                min={0}
                value={alunosPresentes}
                onChange={e => setAlunosPresentes(e.target.value ? parseInt(e.target.value) : '')}
                disabled={readOnly}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Horário previsto para início</Label>
              <Input
                type="time"
                value={horarioPrevisto}
                onChange={e => setHorarioPrevisto(e.target.value)}
                disabled={readOnly}
              />
            </div>
            <div className="space-y-2">
              <Label>Horário real de início</Label>
              <Input
                type="time"
                value={horarioReal}
                onChange={e => setHorarioReal(e.target.value)}
                disabled={readOnly}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rubric dimensions filtered by focos (from cadastro) + Obrigatórias */}
      {visibleFieldKeys.length > 0 && (
        <InstrumentForm
          formType={FORM_TYPE}
          responses={responses}
          onResponseChange={handleResponseChange}
          readOnly={readOnly}
          selectedKeys={visibleFieldKeys}
        />
      )}

      {!readOnly && registroAcaoId && (
        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Salvar Registro
          </Button>
        </div>
      )}
    </div>
  );
}
