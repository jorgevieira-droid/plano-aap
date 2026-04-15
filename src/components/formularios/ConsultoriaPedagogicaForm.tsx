import { useState } from 'react';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';

export interface ConsultoriaPedagogicaFormProps {
  registroAcaoId: string;
  escolaId: string;
  aapId: string;
  escolaVoar?: boolean;
  onSuccess?: () => void;
  readOnly?: boolean;
}

const PARTICIPANTES_OPTIONS = [
  'Diretor(a)',
  'Vice-Diretor(a)',
  'Coordenador(a) Pedagógico(a)',
  'Professor(a)',
  'Supervisor(a)',
  'Outros',
];

const ETAPA_OPTIONS = [
  { value: 'EFAI', label: 'EFAI – Anos Iniciais' },
  { value: 'EFAF', label: 'EFAF – Anos Finais' },
  { value: 'EM', label: 'EM – Ensino Médio' },
];

export default function ConsultoriaPedagogicaForm({
  registroAcaoId,
  escolaId,
  aapId,
  escolaVoar = false,
  onSuccess,
  readOnly = false,
}: ConsultoriaPedagogicaFormProps) {
  // Etapa e VOAR
  const [etapaEnsino, setEtapaEnsino] = useState<string[]>([]);
  const [isEscolaVoar, setIsEscolaVoar] = useState(escolaVoar);

  // Participantes
  const [participantes, setParticipantes] = useState<string[]>([]);
  const [participantesOutros, setParticipantesOutros] = useState('');

  // Agenda
  const [agendaPlanejada, setAgendaPlanejada] = useState<boolean | null>(null);
  const [agendaAlterada, setAgendaAlterada] = useState<boolean | null>(null);
  const [agendaAlteradaRazoes, setAgendaAlteradaRazoes] = useState('');

  // Ações formativas junto aos professores
  const [aulasObsLp, setAulasObsLp] = useState(0);
  const [aulasObsMat, setAulasObsMat] = useState(0);
  const [aulasObsOeLp, setAulasObsOeLp] = useState(0);
  const [aulasObsOeMat, setAulasObsOeMat] = useState(0);
  const [aulasTutoriaObs, setAulasTutoriaObs] = useState(0);
  const [aulasObsTurmaPadrao, setAulasObsTurmaPadrao] = useState(0);
  const [aulasObsTurmaAdaptada, setAulasObsTurmaAdaptada] = useState(0);
  const [professoresObservados, setProfessoresObservados] = useState(0);
  const [devolutivasProfessor, setDevolutivasProfessor] = useState(0);
  const [atpcsMinistrados, setAtpcsMinistrados] = useState(0);

  // Ações formativas junto à coordenação
  const [aulasObsParceriaCoord, setAulasObsParceriaCoord] = useState(0);
  const [devolutivasModelCoord, setDevolutivasModelCoord] = useState(0);
  const [acompDevolutivasCoord, setAcompDevolutivasCoord] = useState(0);
  const [atpcsAcompCoord, setAtpcsAcompCoord] = useState(0);
  const [devolutivasCoordAtpc, setDevolutivasCoordAtpc] = useState(0);

  // Questões finais
  const [analiseDados, setAnaliseDados] = useState<boolean | null>(null);
  const [pautaFormativa, setPautaFormativa] = useState<boolean | null>(null);
  const [boasPraticas, setBoasPraticas] = useState('');
  const [pontosPreocupacao, setPontosPreocupacao] = useState('');
  const [encaminhamentos, setEncaminhamentos] = useState('');
  const [outrosPontos, setOutrosPontos] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggleParticipante = (option: string, checked: boolean) => {
    setParticipantes(prev =>
      checked ? [...prev, option] : prev.filter(p => p !== option)
    );
  };

  const handleToggleEtapa = (value: string, checked: boolean) => {
    setEtapaEnsino(prev =>
      checked ? [...prev, value] : prev.filter(e => e !== value)
    );
  };

  const handleSubmit = async () => {
    if (participantes.length === 0) {
      toast.error('Selecione ao menos um participante');
      return;
    }
    if (agendaPlanejada === null) {
      toast.error('Informe se a agenda foi planejada');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('consultoria_pedagogica_respostas')
        .insert({
          registro_acao_id: registroAcaoId,
          aap_id: aapId,
          escola_id: escolaId,
          etapa_ensino: etapaEnsino,
          escola_voar: isEscolaVoar,
          participantes,
          participantes_outros: participantes.includes('Outros') ? participantesOutros : null,
          agenda_planejada: agendaPlanejada,
          agenda_alterada: agendaAlterada,
          agenda_alterada_razoes: agendaAlterada ? agendaAlteradaRazoes : null,
          aulas_obs_lp: aulasObsLp,
          aulas_obs_mat: aulasObsMat,
          aulas_obs_oe_lp: aulasObsOeLp,
          aulas_obs_oe_mat: aulasObsOeMat,
          aulas_tutoria_obs: aulasTutoriaObs,
          aulas_obs_turma_padrao: isEscolaVoar ? aulasObsTurmaPadrao : 0,
          aulas_obs_turma_adaptada: isEscolaVoar ? aulasObsTurmaAdaptada : 0,
          professores_observados: professoresObservados,
          devolutivas_professor: devolutivasProfessor,
          atpcs_ministrados: atpcsMinistrados,
          aulas_obs_parceria_coord: aulasObsParceriaCoord,
          devolutivas_model_coord: devolutivasModelCoord,
          acomp_devolutivas_coord: acompDevolutivasCoord,
          atpcs_acomp_coord: atpcsAcompCoord,
          devolutivas_coord_atpc: devolutivasCoordAtpc,
          analise_dados: analiseDados,
          pauta_formativa: pautaFormativa,
          boas_praticas: boasPraticas || null,
          pontos_preocupacao: pontosPreocupacao || null,
          encaminhamentos: encaminhamentos || null,
          outros_pontos: outrosPontos || null,
        });

      if (error) throw error;

      // Update registro_acao status to realizada
      await supabase
        .from('registros_acao')
        .update({ status: 'realizada' })
        .eq('id', registroAcaoId);

      toast.success('Registro da consultoria pedagógica salvo com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      console.error('Error saving consultoria:', error);
      toast.error(error?.message || 'Erro ao salvar consultoria');
    } finally {
      setIsSubmitting(false);
    }
  };

  const NumberField = ({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) => (
    <div className="flex items-center justify-between gap-3">
      <Label className="text-sm flex-1">{label}</Label>
      <Input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(parseInt(e.target.value) || 0)}
        className="w-20 text-center"
      />
    </div>
  );

  const BoolField = ({ label, value, onChange }: { label: string; value: boolean | null; onChange: (v: boolean) => void }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <RadioGroup
        value={value === null ? '' : value ? 'sim' : 'nao'}
        onValueChange={v => onChange(v === 'sim')}
        className="flex gap-4"
      >
        <div className="flex items-center gap-2">
          <RadioGroupItem value="sim" id={`${label}-sim`} />
          <Label htmlFor={`${label}-sim`} className="text-sm cursor-pointer">Sim</Label>
        </div>
        <div className="flex items-center gap-2">
          <RadioGroupItem value="nao" id={`${label}-nao`} />
          <Label htmlFor={`${label}-nao`} className="text-sm cursor-pointer">Não</Label>
        </div>
      </RadioGroup>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Etapa de Ensino */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etapa de Ensino</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {ETAPA_OPTIONS.map(opt => (
            <div key={opt.value} className="flex items-center gap-2">
              <Checkbox
                id={`etapa-${opt.value}`}
                checked={etapaEnsino.includes(opt.value)}
                onCheckedChange={checked => handleToggleEtapa(opt.value, !!checked)}
              />
              <Label htmlFor={`etapa-${opt.value}`} className="text-sm cursor-pointer">{opt.label}</Label>
            </div>
          ))}

          <BoolField
            label="Escola do Voar?"
            value={isEscolaVoar}
            onChange={setIsEscolaVoar}
          />
        </CardContent>
      </Card>

      {/* Participantes */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Participantes da visita</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PARTICIPANTES_OPTIONS.map(opt => (
            <div key={opt} className="flex items-center gap-2">
              <Checkbox
                id={`part-${opt}`}
                checked={participantes.includes(opt)}
                onCheckedChange={checked => handleToggleParticipante(opt, !!checked)}
              />
              <Label htmlFor={`part-${opt}`} className="text-sm cursor-pointer">{opt}</Label>
            </div>
          ))}
          {participantes.includes('Outros') && (
            <Textarea
              value={participantesOutros}
              onChange={e => setParticipantesOutros(e.target.value)}
              placeholder="Especifique os outros participantes..."
              rows={2}
            />
          )}
        </CardContent>
      </Card>

      {/* Agenda */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Agenda</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BoolField label="A agenda foi planejada?" value={agendaPlanejada} onChange={setAgendaPlanejada} />
          <BoolField label="A agenda foi alterada?" value={agendaAlterada} onChange={setAgendaAlterada} />
          {agendaAlterada && (
            <div>
              <Label className="text-sm">Razões da alteração</Label>
              <Textarea
                value={agendaAlteradaRazoes}
                onChange={e => setAgendaAlteradaRazoes(e.target.value)}
                placeholder="Descreva os motivos da alteração..."
                rows={2}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Ações formativas junto aos professores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações formativas junto aos professores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberField label="Aulas observadas – Língua Portuguesa" value={aulasObsLp} onChange={setAulasObsLp} />
          <NumberField label="Aulas observadas – Matemática" value={aulasObsMat} onChange={setAulasObsMat} />
          <NumberField label="Aulas observadas com OE – Língua Portuguesa" value={aulasObsOeLp} onChange={setAulasObsOeLp} />
          <NumberField label="Aulas observadas com OE – Matemática" value={aulasObsOeMat} onChange={setAulasObsOeMat} />
          <NumberField label="Aulas de tutoria observadas" value={aulasTutoriaObs} onChange={setAulasTutoriaObs} />
          {isEscolaVoar && (
            <>
              <NumberField label="Aulas observadas – Turma padrão (VOAR)" value={aulasObsTurmaPadrao} onChange={setAulasObsTurmaPadrao} />
              <NumberField label="Aulas observadas – Turma adaptada (VOAR)" value={aulasObsTurmaAdaptada} onChange={setAulasObsTurmaAdaptada} />
            </>
          )}
          <NumberField label="Professores observados" value={professoresObservados} onChange={setProfessoresObservados} />
          <NumberField label="Devolutivas ao professor" value={devolutivasProfessor} onChange={setDevolutivasProfessor} />
          <NumberField label="ATPCs ministrados" value={atpcsMinistrados} onChange={setAtpcsMinistrados} />
        </CardContent>
      </Card>

      {/* Ações formativas junto à coordenação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações formativas junto à coordenação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberField label="Observação de aula em parceria com coordenação" value={aulasObsParceriaCoord} onChange={setAulasObsParceriaCoord} />
          <NumberField label="Devolutivas com modelagem para coordenação" value={devolutivasModelCoord} onChange={setDevolutivasModelCoord} />
          <NumberField label="Acompanhamento de devolutivas da coordenação" value={acompDevolutivasCoord} onChange={setAcompDevolutivasCoord} />
          <NumberField label="ATPCs acompanhados pela coordenação" value={atpcsAcompCoord} onChange={setAtpcsAcompCoord} />
          <NumberField label="Devolutivas da coordenação sobre ATPC" value={devolutivasCoordAtpc} onChange={setDevolutivasCoordAtpc} />
        </CardContent>
      </Card>

      {/* Questões finais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Questões finais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BoolField label="Análise de dados?" value={analiseDados} onChange={setAnaliseDados} />
          <BoolField label="Pauta formativa?" value={pautaFormativa} onChange={setPautaFormativa} />

          <div>
            <Label className="text-sm">Boas práticas</Label>
            <Textarea value={boasPraticas} onChange={e => setBoasPraticas(e.target.value)} placeholder="Descreva as boas práticas observadas..." rows={3} />
          </div>
          <div>
            <Label className="text-sm">Pontos de preocupação</Label>
            <Textarea value={pontosPreocupacao} onChange={e => setPontosPreocupacao(e.target.value)} placeholder="Descreva os pontos de preocupação..." rows={3} />
          </div>
          <div>
            <Label className="text-sm">Encaminhamentos</Label>
            <Textarea value={encaminhamentos} onChange={e => setEncaminhamentos(e.target.value)} placeholder="Descreva os encaminhamentos..." rows={3} />
          </div>
          <div>
            <Label className="text-sm">Outros pontos</Label>
            <Textarea value={outrosPontos} onChange={e => setOutrosPontos(e.target.value)} placeholder="Outros pontos relevantes..." rows={3} />
          </div>
        </CardContent>
      </Card>

      {!readOnly && (
        <div className="flex justify-end">
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
            Salvar Consultoria
          </Button>
        </div>
      )}
    </div>
  );
}
