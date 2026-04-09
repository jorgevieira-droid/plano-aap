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

export interface MonitoramentoAcoesFormativasFormProps {
  entidades: { id: string; nome: string }[];
  escolaId: string;
  data: string;
  horarioInicio: string;
  registroAcaoId: string;
  onSuccess?: () => void;
}

const PUBLICO_OPTIONS = [
  'CEC',
  'PEC – Anos Iniciais',
  'PEC – Língua Portuguesa',
  'PEC – Matemática',
  'PEC – Qualidade de Aula',
  'PEC – Multiplica',
  'CGP / CGPG / PAAC',
  'Supervisor(a)',
  'Diretor(a)',
  'Vice-Diretor(a)',
  'Professores(as)',
];

const FRENTE_OPTIONS = [
  'APF – PEC Qualidade de Aula',
  'Jornada PEI',
  'Professor Tutor',
  'VOAR',
  'Multiplica Presencial',
];

const LOCAL_OPTIONS = [
  { value: 'online', label: 'Online' },
  { value: 'regional', label: 'Regional de Ensino' },
  { value: 'efape', label: 'EFAPE' },
  { value: 'escolas', label: 'Escola(s)' },
  { value: 'outro', label: 'Outro' },
];

const FECHAMENTO_OPTIONS = ['Sim', 'Parcialmente', 'Não'];

export default function MonitoramentoAcoesFormativasForm({
  entidades,
  escolaId,
  data,
  horarioInicio,
  registroAcaoId,
  onSuccess,
}: MonitoramentoAcoesFormativasFormProps) {
  const [publico, setPublico] = useState<string[]>([]);
  const [frenteTrabalho, setFrenteTrabalho] = useState('');
  const [localEncontro, setLocalEncontro] = useState('');
  const [localEscolas, setLocalEscolas] = useState<string[]>([]);
  const [localOutro, setLocalOutro] = useState('');
  const [fechamento, setFechamento] = useState('');
  const [encaminhamentos, setEncaminhamentos] = useState('');
  const [entidadesFilho, setEntidadesFilho] = useState<{ id: string; nome: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const singleEntidade = entidades.length === 1;

  // Fetch entidades_filho when escolaId changes
  useEffect(() => {
    if (!escolaId) return;
    const fetchFilhos = async () => {
      const { data: filhos } = await supabase
        .from('entidades_filho')
        .select('id, nome')
        .eq('escola_id', escolaId)
        .eq('ativa', true)
        .order('nome');
      setEntidadesFilho(filhos || []);
    };
    fetchFilhos();
  }, [escolaId]);

  const handleTogglePublico = (option: string, checked: boolean) => {
    setPublico(prev =>
      checked ? [...prev, option] : prev.filter(p => p !== option)
    );
  };

  const handleToggleEscola = (escolaFilhoId: string, checked: boolean) => {
    setLocalEscolas(prev =>
      checked ? [...prev, escolaFilhoId] : prev.filter(id => id !== escolaFilhoId)
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
    if (!localEncontro) {
      toast.error('Selecione o local do encontro');
      return;
    }
    if (localEncontro === 'escolas' && localEscolas.length === 0) {
      toast.error('Selecione ao menos uma escola');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await (supabase as any)
        .from('relatorios_monit_acoes_formativas')
        .insert({
          registro_acao_id: registroAcaoId,
          publico,
          frente_trabalho: frenteTrabalho,
          local_encontro: localEncontro,
          local_escolas: localEncontro === 'escolas' ? localEscolas : [],
          local_outro: localEncontro === 'outro' ? localOutro || null : null,
          fechamento: fechamento || null,
          encaminhamentos: encaminhamentos || null,
          status: 'enviado',
        });

      if (error) throw error;
      toast.success('Monitoramento de Ações Formativas salvo com sucesso!');
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
            <Label>Unidade Regional (Entidade)</Label>
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

      {/* Frente de Trabalho */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Frente de Trabalho/Projeto *</CardTitle>
        </CardHeader>
        <CardContent>
          <Select value={frenteTrabalho} onValueChange={setFrenteTrabalho}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a frente de trabalho" />
            </SelectTrigger>
            <SelectContent>
              {FRENTE_OPTIONS.map(option => (
                <SelectItem key={option} value={option}>{option}</SelectItem>
              ))}
            </SelectContent>
          </Select>
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

      {/* Local do Encontro */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Local do Encontro *</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select value={localEncontro} onValueChange={(v) => { setLocalEncontro(v); setLocalEscolas([]); setLocalOutro(''); }}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione o local" />
            </SelectTrigger>
            <SelectContent>
              {LOCAL_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          {localEncontro === 'escolas' && (
            <div className="space-y-3 pt-2">
              <Label className="text-sm font-medium">Selecione a(s) escola(s) *</Label>
              {entidadesFilho.length === 0 ? (
                <p className="text-sm text-muted-foreground">Nenhuma escola vinculada à entidade selecionada.</p>
              ) : (
                entidadesFilho.map(ef => {
                  const checked = localEscolas.includes(ef.id);
                  return (
                    <label key={ef.id} className="flex items-start gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                      <Checkbox
                        checked={checked}
                        onCheckedChange={(state) => handleToggleEscola(ef.id, !!state)}
                      />
                      <span>{ef.nome}</span>
                    </label>
                  );
                })
              )}
            </div>
          )}

          {localEncontro === 'outro' && (
            <div className="pt-2">
              <Label>Especifique o local</Label>
              <Input
                value={localOutro}
                onChange={(e) => setLocalOutro(e.target.value)}
                placeholder="Informe o local do encontro"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fechamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Foi possível realizar o fechamento do encontro gerando encaminhamentos?</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup value={fechamento} onValueChange={setFechamento} className="space-y-3">
            {FECHAMENTO_OPTIONS.map(option => (
              <label key={option} className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm cursor-pointer hover:bg-muted/30 transition-colors">
                <RadioGroupItem value={option} id={`fechamento-${option}`} />
                <Label htmlFor={`fechamento-${option}`} className="cursor-pointer">{option}</Label>
              </label>
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Encaminhamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Principais encaminhamentos da ação</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            value={encaminhamentos}
            onChange={(e) => setEncaminhamentos(e.target.value)}
            placeholder="Descreva os principais encaminhamentos..."
            rows={5}
          />
        </CardContent>
      </Card>

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
