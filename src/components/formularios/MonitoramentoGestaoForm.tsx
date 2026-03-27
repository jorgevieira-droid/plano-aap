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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export interface MonitoramentoGestaoFormProps {
  entidades: { id: string; nome: string }[];
  data: string;
  horarioInicio: string;
  registroAcaoId: string;
  onSuccess?: () => void;
}

const PUBLICO_OPTIONS = [
  'Líder Regional',
  'Dirigente',
  'CEC',
  'Supervisor',
  'PEC',
  'Gestão Escolar (Diretor, Vice, Coordenador, outros)',
  'Professor',
];

const FRENTE_OPTIONS = [
  'Semanal Gestão',
  'Governança',
  'Mentoria Dirigente',
  'PDCA',
  'Alinhamento CEC',
  'Imersão em Dados',
];

export default function MonitoramentoGestaoForm({
  entidades,
  data,
  horarioInicio,
  registroAcaoId,
  onSuccess,
}: MonitoramentoGestaoFormProps) {
  const [publico, setPublico] = useState<string[]>([]);
  const [frenteTrabalho, setFrenteTrabalho] = useState('');
  const [observacao, setObservacao] = useState('');
  const [pdcaTemas, setPdcaTemas] = useState('');
  const [pdcaPontosAtencao, setPdcaPontosAtencao] = useState('');
  const [pdcaEncaminhamentos, setPdcaEncaminhamentos] = useState('');
  const [pdcaMaterial, setPdcaMaterial] = useState('');
  const [pdcaAprendizados, setPdcaAprendizados] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isPdca = frenteTrabalho === 'PDCA';
  const singleEntidade = entidades.length === 1;

  const handleTogglePublico = (option: string, checked: boolean) => {
    setPublico(prev =>
      checked ? [...prev, option] : prev.filter(p => p !== option)
    );
  };

  const handleSubmit = async () => {
    if (publico.length === 0) {
      toast.error('Selecione ao menos um público');
      return;
    }
    if (!frenteTrabalho) {
      toast.error('Selecione a frente de trabalho');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('relatorios_monitoramento_gestao')
        .insert({
          registro_acao_id: registroAcaoId,
          publico,
          frente_trabalho: frenteTrabalho,
          observacao: observacao || null,
          pdca_temas: isPdca ? pdcaTemas || null : null,
          pdca_pontos_atencao: isPdca ? pdcaPontosAtencao || null : null,
          pdca_encaminhamentos: isPdca ? pdcaEncaminhamentos || null : null,
          pdca_material: isPdca ? pdcaMaterial || null : null,
          pdca_aprendizados: isPdca ? pdcaAprendizados || null : null,
          status: 'enviado',
        });

      if (error) throw error;
      toast.success('Monitoramento e Gestão salvo com sucesso!');
      onSuccess?.();
    } catch (error: any) {
      toast.error(error?.message || 'Erro ao salvar formulário');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Informações Gerais */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Informações Gerais</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>URE (Entidade)</Label>
            <Input value={singleEntidade ? entidades[0].nome : 'Selecione na programação'} disabled />
          </div>
          <div>
            <Label>Data</Label>
            <Input value={data || ''} disabled />
          </div>
          <div>
            <Label>Horário</Label>
            <Input value={horarioInicio || ''} disabled />
          </div>
        </CardContent>
      </Card>

      {/* Público do Encontro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Público do Encontro *</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {PUBLICO_OPTIONS.map(option => {
              const checked = publico.includes(option);
              return (
                <label key={option} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                  <Checkbox
                    checked={checked}
                    onCheckedChange={(state) => handleTogglePublico(option, !!state)}
                  />
                  <span>{option}</span>
                </label>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Frente de Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frente de Trabalho *</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={frenteTrabalho} onValueChange={setFrenteTrabalho} className="space-y-3">
            {FRENTE_OPTIONS.map(option => (
              <label key={option} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                <RadioGroupItem value={option} id={`frente-${option}`} />
                <Label htmlFor={`frente-${option}`} className="cursor-pointer">{option}</Label>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Observação */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Observação</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observações gerais sobre o encontro..."
            rows={4}
          />
        </CardContent>
      </Card>

      {/* Campos condicionais PDCA */}
      {isPdca && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Detalhes do PDCA</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Quais os temas abordados?</Label>
              <Textarea
                value={pdcaTemas}
                onChange={(e) => setPdcaTemas(e.target.value)}
                placeholder="Descreva os temas..."
                rows={3}
              />
            </div>
            <div>
              <Label>Quais os pontos de atenção da agenda?</Label>
              <Textarea
                value={pdcaPontosAtencao}
                onChange={(e) => setPdcaPontosAtencao(e.target.value)}
                placeholder="Descreva os pontos de atenção..."
                rows={3}
              />
            </div>
            <div>
              <Label>Quais os encaminhamentos da agenda?</Label>
              <Textarea
                value={pdcaEncaminhamentos}
                onChange={(e) => setPdcaEncaminhamentos(e.target.value)}
                placeholder="Descreva os encaminhamentos..."
                rows={3}
              />
            </div>
            <div>
              <Label>Material utilizado? (incluir link se houver)</Label>
              <Textarea
                value={pdcaMaterial}
                onChange={(e) => setPdcaMaterial(e.target.value)}
                placeholder="Descreva o material utilizado..."
                rows={3}
              />
            </div>
            <div>
              <Label>Quais foram os aprendizados em relação a este encontro e a estrutura do PDCA?</Label>
              <Textarea
                value={pdcaAprendizados}
                onChange={(e) => setPdcaAprendizados(e.target.value)}
                placeholder="Descreva os aprendizados..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? <Loader2 className="animate-spin mr-2" size={18} /> : null}
          Salvar Registro
        </Button>
      </div>
    </div>
  );
}
