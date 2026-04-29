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
import { useFormFieldConfig } from '@/hooks/useFormFieldConfig';

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

const FORM_KEY = 'registro_consultoria_pedagogica';

const NumberField = ({ label, value, onChange, required }: { label: string; value: number; onChange: (v: number) => void; required?: boolean }) => (
  <div className="flex items-center justify-between gap-3">
    <Label className="text-sm flex-1">{label}{required ? ' *' : ''}</Label>
    <Input
      type="number"
      min={0}
      value={value}
      onChange={e => onChange(parseInt(e.target.value) || 0)}
      className="w-20 text-center"
    />
  </div>
);

const BoolField = ({ label, value, onChange, required }: { label: string; value: boolean | null; onChange: (v: boolean) => void; required?: boolean }) => (
  <div className="space-y-2">
    <Label className="text-sm font-medium">{label}{required ? ' *' : ''}</Label>
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

const TextAreaField = ({ label, value, onChange, placeholder, required }: { label: string; value: string; onChange: (v: string) => void; placeholder: string; required?: boolean }) => (
  <div>
    <Label className="text-sm">{label}{required ? ' *' : ''}</Label>
    <Textarea value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3} />
  </div>
);

export default function ConsultoriaPedagogicaForm({
  registroAcaoId,
  escolaId,
  aapId,
  escolaVoar = false,
  onSuccess,
  readOnly = false,
}: ConsultoriaPedagogicaFormProps) {
  const { isFieldEnabled, isFieldRequired } = useFormFieldConfig(FORM_KEY);

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
  const [aulasObsTutorMat, setAulasObsTutorMat] = useState(0);
  const [aulasObsTurmaPadrao, setAulasObsTurmaPadrao] = useState(0);
  const [aulasObsTurmaAdaptada, setAulasObsTurmaAdaptada] = useState(0);
  const [professoresObservados, setProfessoresObservados] = useState(0);
  const [devolutivasProfessor, setDevolutivasProfessor] = useState(0);
  const [atpcsMinistrados, setAtpcsMinistrados] = useState(0);

  // Ações formativas junto à coordenação
  const [aulasObsParceriaCoord, setAulasObsParceriaCoord] = useState(0);
  const [obsAulaParceriaCoordExtra, setObsAulaParceriaCoordExtra] = useState(0);
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
    if (isFieldEnabled('participantes') && participantes.length === 0) {
      toast.error('Selecione ao menos um participante');
      return;
    }
    if (isFieldEnabled('agenda_planejada') && isFieldRequired('agenda_planejada') && agendaPlanejada === null) {
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
          aulas_obs_tutor_lp: aulasTutoriaObs,
          aulas_obs_tutor_mat: aulasObsTutorMat,
          aulas_obs_turma_padrao: isEscolaVoar ? aulasObsTurmaPadrao : 0,
          aulas_obs_turma_adaptada: isEscolaVoar ? aulasObsTurmaAdaptada : 0,
          professores_observados: professoresObservados,
          devolutivas_professor: devolutivasProfessor,
          atpcs_ministrados: atpcsMinistrados,
          aulas_obs_parceria_coord: aulasObsParceriaCoord,
          obs_aula_parceria_coord_extra: obsAulaParceriaCoordExtra,
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

  return (
    <div className="space-y-6">
      {/* Etapa de Ensino */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Etapa de Ensino acompanhada na visita</CardTitle>
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
      {isFieldEnabled('participantes') && (
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
            {participantes.includes('Outros') && isFieldEnabled('participantes_outros') && (
              <Textarea
                value={participantesOutros}
                onChange={e => setParticipantesOutros(e.target.value)}
                placeholder="Especifique os outros participantes..."
                rows={2}
              />
            )}
          </CardContent>
        </Card>
      )}

      {/* Agenda */}
      {(isFieldEnabled('agenda_planejada') || isFieldEnabled('agenda_alterada')) && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isFieldEnabled('agenda_planejada') && <BoolField required={isFieldRequired('agenda_planejada')} label="A agenda da visita foi planejada previamente com o coordenador(a)?" value={agendaPlanejada} onChange={setAgendaPlanejada} />}
            {isFieldEnabled('agenda_alterada') && <BoolField required={isFieldRequired('agenda_alterada')} label="A agenda foi alterada durante a visita?" value={agendaAlterada} onChange={setAgendaAlterada} />}
            {agendaAlterada && isFieldEnabled('agenda_alterada_razoes') && (
              <div>
                <Label className="text-sm">Explicite as razões da alteração da agenda programada.</Label>
                <Textarea
                  value={agendaAlteradaRazoes}
                  onChange={e => setAgendaAlteradaRazoes(e.target.value)}
                  placeholder="Explicite as razões da alteração da agenda programada."
                  rows={2}
                />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Ações formativas junto aos professores */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Ações formativas junto aos professores</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberField fieldKey="professores_observados" label="Professores observados" value={professoresObservados} onChange={setProfessoresObservados} />
          <NumberField fieldKey="aulas_obs_lp" label="Aulas observadas – Língua Portuguesa" value={aulasObsLp} onChange={setAulasObsLp} />
          <NumberField fieldKey="aulas_obs_mat" label="Aulas observadas – Matemática" value={aulasObsMat} onChange={setAulasObsMat} />
          <NumberField fieldKey="aulas_obs_oe_lp" label="Aulas observadas – OE Língua Portuguesa" value={aulasObsOeLp} onChange={setAulasObsOeLp} />
          <NumberField fieldKey="aulas_obs_oe_mat" label="Aulas observadas – OE Matemática" value={aulasObsOeMat} onChange={setAulasObsOeMat} />
          <NumberField fieldKey="aulas_obs_tutor_lp" label="Aulas observadas – Professor Tutor Língua Portuguesa" value={aulasTutoriaObs} onChange={setAulasTutoriaObs} />
          <NumberField fieldKey="aulas_obs_tutor_mat" label="Aulas observadas – Professor Tutor Matemática" value={aulasObsTutorMat} onChange={setAulasObsTutorMat} />
          <NumberField fieldKey="devolutivas_professor" label="Devolutivas realizadas aos professores" value={devolutivasProfessor} onChange={setDevolutivasProfessor} />
          {isEscolaVoar && (
            <>
              <NumberField fieldKey="aulas_obs_turma_padrao" label="Aulas observadas – Turma padrão (VOAR)" value={aulasObsTurmaPadrao} onChange={setAulasObsTurmaPadrao} />
              <NumberField fieldKey="aulas_obs_turma_adaptada" label="Aulas observadas – Turma adaptada (VOAR)" value={aulasObsTurmaAdaptada} onChange={setAulasObsTurmaAdaptada} />
            </>
          )}
        </CardContent>
      </Card>

      {/* Ações formativas junto à coordenação */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Em relação às ações de formação da coordenação para realização do Apoio Presencial:</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberField fieldKey="aulas_obs_parceria_coord" label="Quantidade de aulas observadas em parceria com a coordenação pedagógica" value={aulasObsParceriaCoord} onChange={setAulasObsParceriaCoord} />
          <NumberField fieldKey="obs_aula_parceria_coord_extra" label="Observação de aula em parceria com a coordenação" value={obsAulaParceriaCoordExtra} onChange={setObsAulaParceriaCoordExtra} />
          <NumberField fieldKey="devolutivas_model_coord" label="Devolutivas modelizadas à coordenação pedagógica" value={devolutivasModelCoord} onChange={setDevolutivasModelCoord} />
          <NumberField fieldKey="acomp_devolutivas_coord" label="Devolutivas da coordenação pedagógica acompanhadas" value={acompDevolutivasCoord} onChange={setAcompDevolutivasCoord} />
        </CardContent>
      </Card>

      {/* Ações formativas ligadas à ATPC */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Em relação às ações de formação ligadas à ATPC</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <NumberField fieldKey="atpcs_ministrados" label="ATPCs ministrados por você" value={atpcsMinistrados} onChange={setAtpcsMinistrados} />
          <NumberField fieldKey="atpcs_acomp_coord" label="ATPCs realizados pela coordenação e acompanhados por você" value={atpcsAcompCoord} onChange={setAtpcsAcompCoord} />
          <NumberField fieldKey="devolutivas_coord_atpc" label="Devolutivas sobre os ATPCs ministrados pela coordenação" value={devolutivasCoordAtpc} onChange={setDevolutivasCoordAtpc} />
        </CardContent>
      </Card>

      {/* Questões finais */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Questões finais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <BoolField fieldKey="analise_dados" label="Houve análise de dados sobre os resultados de aprendizagem dos estudantes?" value={analiseDados} onChange={setAnaliseDados} />
          <BoolField fieldKey="pauta_formativa" label="Houve levantamento de temas e/ou construção de pautas formativas com a coordenação?" value={pautaFormativa} onChange={setPautaFormativa} />
          <TextAreaField fieldKey="boas_praticas" label="Boas práticas" value={boasPraticas} onChange={setBoasPraticas} placeholder="Descreva as boas práticas observadas..." />
          <TextAreaField fieldKey="pontos_preocupacao" label="Pontos de preocupação" value={pontosPreocupacao} onChange={setPontosPreocupacao} placeholder="Descreva os pontos de preocupação..." />
          <TextAreaField fieldKey="encaminhamentos" label="Encaminhamentos" value={encaminhamentos} onChange={setEncaminhamentos} placeholder="Descreva os encaminhamentos..." />
          <TextAreaField fieldKey="outros_pontos" label="Outros pontos" value={outrosPontos} onChange={setOutrosPontos} placeholder="Outros pontos relevantes..." />
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
