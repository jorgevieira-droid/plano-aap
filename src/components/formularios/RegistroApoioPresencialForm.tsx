import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { InstrumentForm } from '@/components/instruments/InstrumentForm';
import { useInstrumentFields } from '@/hooks/useInstrumentFields';

export interface RegistroApoioPresencialFormProps {
  registroAcaoId: string;
  escolaId: string;
  aapId: string;
  escolaVoar?: boolean;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const COMPONENTE_OPTIONS = ['LP', 'Mat', 'OE MAT', 'OE LP', 'Tutoria MAT', 'Tutoria LP'];

const ETAPA_OPTIONS = [
  '1º Ano', '2º Ano', '3º Ano', '4º Ano', '5º Ano',
  '6º Ano', '7º Ano', '8º Ano', '9º Ano',
  '1ª Série', '2ª Série', '3ª Série',
];

const PARTICIPANTES_OPTIONS = ['Consultor', 'Coordenador', 'Diretor', 'Vice-Diretor', 'Outros'];

const DEVOLUTIVA_OPTIONS = [
  'No mesmo dia da observação',
  'Em até 3 dias após a observação',
  'Entre 4 e 7 dias após a observação',
  'Mais de 7 dias após a observação',
  'Não foi possível agendar ainda',
];

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
  escolaVoar = false,
  onSuccess,
  readOnly = false,
}: RegistroApoioPresencialFormProps) {
  const { fields, isLoading: fieldsLoading } = useInstrumentFields(FORM_TYPE);

  // Pre-rubric fields
  const [componente, setComponente] = useState('');
  const [etapa, setEtapa] = useState('');
  const [turmaVoar, setTurmaVoar] = useState('');
  const [isEscolaVoar, setIsEscolaVoar] = useState(escolaVoar);
  const [professorId, setProfessorId] = useState('');
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [participantesOutros, setParticipantesOutros] = useState('');
  const [obsPlaneada, setObsPlaneada] = useState<boolean | null>(null);
  const [focos, setFocos] = useState<string[]>([]);
  const [devolutiva, setDevolutiva] = useState('');
  const [alunosPrevistos, setAlunosPrevistos] = useState<number | ''>('');
  const [alunosPresentes, setAlunosPresentes] = useState<number | ''>('');
  const [horarioPrevisto, setHorarioPrevisto] = useState('');
  const [horarioReal, setHorarioReal] = useState('');

  // Instrument responses
  const [responses, setResponses] = useState<Record<string, any>>({});

  // Professors list
  const [professores, setProfessores] = useState<{ id: string; nome: string }[]>([]);

  const [saving, setSaving] = useState(false);

  // Load professors for the school
  useEffect(() => {
    if (!escolaId) return;
    (supabase as any)
      .from('professores')
      .select('id, nome')
      .eq('escola_id', escolaId)
      .eq('ativo', true)
      .order('nome')
      .then(({ data }: any) => {
        if (data) setProfessores(data);
      });
  }, [escolaId]);

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
          if (r._componente) setComponente(r._componente);
          if (r._etapa) setEtapa(r._etapa);
          if (r._turma_voar) setTurmaVoar(r._turma_voar);
          if (r._escola_voar !== undefined) setIsEscolaVoar(r._escola_voar);
          if (r._participantes) setParticipantes(r._participantes);
          if (r._participantes_outros) setParticipantesOutros(r._participantes_outros);
          if (r._obs_planeada !== undefined) setObsPlaneada(r._obs_planeada);
          if (r._focos) setFocos(r._focos);
          if (r._devolutiva) setDevolutiva(r._devolutiva);
          if (r._alunos_previstos !== undefined) setAlunosPrevistos(r._alunos_previstos);
          if (r._alunos_presentes !== undefined) setAlunosPresentes(r._alunos_presentes);
          if (r._horario_previsto) setHorarioPrevisto(r._horario_previsto);
          if (r._horario_real) setHorarioReal(r._horario_real);
          if (data.professor_id) setProfessorId(data.professor_id);
        }
      });
  }, [registroAcaoId]);

  const toggleParticipante = (p: string) => {
    setParticipantes(prev =>
      prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
    );
  };

  const toggleFoco = (f: string) => {
    setFocos(prev =>
      prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]
    );
  };

  // Filter instrument fields based on selected focos
  const selectedDimensions = FOCO_OPTIONS
    .filter(f => focos.includes(f.value))
    .map(f => f.dimension);
  // Always include "Obrigatórias" dimension
  selectedDimensions.push('Obrigatórias');

  const visibleFieldKeys = fields
    .filter(f => f.dimension && selectedDimensions.includes(f.dimension))
    .map(f => f.field_key);

  const handleResponseChange = (key: string, value: any) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!registroAcaoId || !escolaId || !aapId) return;
    setSaving(true);
    try {
      const fullResponses = {
        ...responses,
        _componente: componente,
        _etapa: etapa,
        _turma_voar: turmaVoar,
        _escola_voar: isEscolaVoar,
        _participantes: participantes,
        _participantes_outros: participantesOutros,
        _obs_planeada: obsPlaneada,
        _focos: focos,
        _devolutiva: devolutiva,
        _alunos_previstos: alunosPrevistos,
        _alunos_presentes: alunosPresentes,
        _horario_previsto: horarioPrevisto,
        _horario_real: horarioReal,
      };

      // Check if existing
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

  return (
    <div className="space-y-6">
      {/* Pre-rubric fields */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Dados da Observação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Escola VOAR */}
          <div className="space-y-2">
            <Label>A escola faz parte do Projeto VOAR?</Label>
            <RadioGroup
              value={isEscolaVoar ? 'sim' : 'nao'}
              onValueChange={(v) => setIsEscolaVoar(v === 'sim')}
              disabled={readOnly}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sim" id="voar-sim" />
                <Label htmlFor="voar-sim">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="nao" id="voar-nao" />
                <Label htmlFor="voar-nao">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Componente */}
          <div className="space-y-2">
            <Label>Qual o componente da aula observada?</Label>
            <Select value={componente} onValueChange={setComponente} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {COMPONENTE_OPTIONS.map(c => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Etapa */}
          <div className="space-y-2">
            <Label>Qual a etapa de ensino / turma observada?</Label>
            <Select value={etapa} onValueChange={setEtapa} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {ETAPA_OPTIONS.map(e => (
                  <SelectItem key={e} value={e}>{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Turma VOAR - conditional */}
          {isEscolaVoar && (
            <div className="space-y-2">
              <Label>Qual a turma observada (VOAR)?</Label>
              <RadioGroup
                value={turmaVoar}
                onValueChange={setTurmaVoar}
                disabled={readOnly}
                className="flex gap-4"
              >
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Padrão" id="turma-padrao" />
                  <Label htmlFor="turma-padrao">Padrão</Label>
                </div>
                <div className="flex items-center gap-2">
                  <RadioGroupItem value="Adaptada" id="turma-adaptada" />
                  <Label htmlFor="turma-adaptada">Adaptada</Label>
                </div>
              </RadioGroup>
            </div>
          )}

          {/* Professor */}
          {professores.length > 0 && (
            <div className="space-y-2">
              <Label>Professor</Label>
              <Select value={professorId} onValueChange={setProfessorId} disabled={readOnly}>
                <SelectTrigger><SelectValue placeholder="Selecione o professor..." /></SelectTrigger>
                <SelectContent>
                  {professores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Participantes */}
          <div className="space-y-2">
            <Label>Quem participou da observação?</Label>
            <div className="flex flex-wrap gap-3">
              {PARTICIPANTES_OPTIONS.map(p => (
                <div key={p} className="flex items-center gap-2">
                  <Checkbox
                    id={`part-${p}`}
                    checked={participantes.includes(p)}
                    onCheckedChange={() => toggleParticipante(p)}
                    disabled={readOnly}
                  />
                  <Label htmlFor={`part-${p}`} className="text-sm">{p}</Label>
                </div>
              ))}
            </div>
            {participantes.includes('Outros') && (
              <Input
                placeholder="Especifique..."
                value={participantesOutros}
                onChange={e => setParticipantesOutros(e.target.value)}
                disabled={readOnly}
                className="mt-2"
              />
            )}
          </div>

          {/* Observação planejada */}
          <div className="space-y-2">
            <Label>A observação foi previamente planejada com o professor?</Label>
            <RadioGroup
              value={obsPlaneada === null ? '' : obsPlaneada ? 'sim' : 'nao'}
              onValueChange={(v) => setObsPlaneada(v === 'sim')}
              disabled={readOnly}
              className="flex gap-4"
            >
              <div className="flex items-center gap-2">
                <RadioGroupItem value="sim" id="obs-plan-sim" />
                <Label htmlFor="obs-plan-sim">Sim</Label>
              </div>
              <div className="flex items-center gap-2">
                <RadioGroupItem value="nao" id="obs-plan-nao" />
                <Label htmlFor="obs-plan-nao">Não</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Focos de observação */}
          <div className="space-y-2">
            <Label>Qual(is) foco(s) foram escolhidos para nortear a observação?</Label>
            <div className="space-y-2">
              {FOCO_OPTIONS.map(f => (
                <div key={f.value} className="flex items-center gap-2">
                  <Checkbox
                    id={`foco-${f.value}`}
                    checked={focos.includes(f.value)}
                    onCheckedChange={() => toggleFoco(f.value)}
                    disabled={readOnly}
                  />
                  <Label htmlFor={`foco-${f.value}`} className="text-sm">{f.label}</Label>
                </div>
              ))}
            </div>
          </div>

          {/* Devolutiva */}
          <div className="space-y-2">
            <Label>Quando ocorrerá a devolutiva?</Label>
            <Select value={devolutiva} onValueChange={setDevolutiva} disabled={readOnly}>
              <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
              <SelectContent>
                {DEVOLUTIVA_OPTIONS.map(d => (
                  <SelectItem key={d} value={d}>{d}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Alunos */}
          <div className="grid grid-cols-2 gap-4">
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

          {/* Horários */}
          <div className="grid grid-cols-2 gap-4">
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

      {/* Rubric dimensions - filtered by selected focos */}
      {focos.length > 0 && visibleFieldKeys.length > 0 && (
        <InstrumentForm
          formType={FORM_TYPE}
          responses={responses}
          onResponseChange={handleResponseChange}
          readOnly={readOnly}
          selectedKeys={visibleFieldKeys}
        />
      )}

      {/* If no focos selected but we're not read-only, show mandatory fields */}
      {focos.length === 0 && fields.filter(f => f.dimension === 'Obrigatórias').length > 0 && (
        <InstrumentForm
          formType={FORM_TYPE}
          responses={responses}
          onResponseChange={handleResponseChange}
          readOnly={readOnly}
          selectedKeys={fields.filter(f => f.dimension === 'Obrigatórias').map(f => f.field_key)}
        />
      )}

      {/* Save button */}
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
