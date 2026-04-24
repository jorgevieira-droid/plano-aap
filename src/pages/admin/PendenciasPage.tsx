import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertTriangle, Filter, ExternalLink, Loader2, Mail } from 'lucide-react';
import { usePendencias } from '@/hooks/usePendencias';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const TIPO_LABELS: Record<string, string> = {
  observacao_aula: 'Observação de Aula',
  formacao_pauta: 'Formação em Pauta',
  reuniao_gestao: 'Reunião com Gestão',
  atpc_htpc: 'ATPC / HTPC',
  acompanhamento_individual: 'Acompanhamento Individual',
  devolutiva_professor: 'Devolutiva ao Professor',
  devolutiva_gestao: 'Devolutiva à Gestão',
  planejamento_conjunto: 'Planejamento Conjunto',
  avaliacao_diagnostica: 'Avaliação Diagnóstica',
  analise_dados: 'Análise de Dados',
  formacao_continuada: 'Formação Continuada',
  visita_tecnica: 'Visita Técnica',
  autoavaliacao: 'Autoavaliação',
  avaliacao_formacao_participante: 'Avaliação Formação Participante',
  outro: 'Outro',
};

export default function PendenciasPage() {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const [filterPrograma, setFilterPrograma] = useState<string>('all');
  const [filterEscola, setFilterEscola] = useState<string>('all');
  const [filterTipo, setFilterTipo] = useState<string>('all');
  const [sendingRegistroId, setSendingRegistroId] = useState<string | null>(null);

  const filters = useMemo(() => ({
    programa: filterPrograma !== 'all' ? filterPrograma : undefined,
    escolaId: filterEscola !== 'all' ? filterEscola : undefined,
    tipo: filterTipo !== 'all' ? filterTipo : undefined,
  }), [filterPrograma, filterEscola, filterTipo]);

  const { pendencias, count, isLoading } = usePendencias(filters);

  // Fetch escolas for filter dropdown
  const { data: escolas } = useQuery({
    queryKey: ['escolas-pendencias-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome');
      return data || [];
    },
  });

  // Get unique tipos from pendencias for filter
  const { pendencias: allPendencias } = usePendencias();
  const tiposDisponiveis = useMemo(() => {
    const tipos = [...new Set(allPendencias.map(p => p.tipo))];
    return tipos.sort();
  }, [allPendencias]);

  const programaLabels: Record<string, string> = {
    escolas: 'Escolas',
    regionais: 'Regionais',
    redes_municipais: 'Redes Municipais',
  };

  const getSeverityBadge = (dias: number) => {
    if (dias >= 5) {
      return <Badge variant="destructive">{dias} dias</Badge>;
    }
    return (
      <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300">
        {dias} dias
      </Badge>
    );
  };

  const canSendPendingEmail = profile?.role === 'admin' || profile?.role === 'gestor' || profile?.role === 'n3_coordenador_programa';

  const handleSendPendingEmail = async (registroId: string) => {
    setSendingRegistroId(registroId);
    try {
      const { data, error } = await supabase.functions.invoke('send-pending-notifications', {
        body: { registroId },
      });

      if (error) {
        toast.error(error.message || 'Erro ao enviar e-mail');
        return;
      }

      if (data?.success === false) {
        toast.error(data.error || 'Erro ao enviar e-mail');
        return;
      }

      const sent = Array.isArray(data?.results) && data.results.some((result: any) => result.status === 'sent');
      if (sent) {
        toast.success('E-mail enviado para o responsável pela ação pendente.');
      } else {
        toast.error('Não foi possível enviar o e-mail para esta pendência.');
      }
    } catch (error: any) {
      console.error('Error sending pending notification:', error);
      toast.error(error?.message || 'Erro ao enviar e-mail');
    } finally {
      setSendingRegistroId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-amber-500" />
            Pendências
          </h1>
          <p className="text-muted-foreground mt-1">
            Ações atrasadas há mais de 2 dias
          </p>
        </div>
        {count > 0 && (
          <div className="flex items-center gap-2">
            <Badge variant="destructive" className="text-lg px-4 py-2">
              {count} {count === 1 ? 'pendência' : 'pendências'}
            </Badge>
          </div>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Filter className="h-4 w-4" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Programa</label>
              <Select value={filterPrograma} onValueChange={setFilterPrograma}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os programas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os programas</SelectItem>
                  {Object.entries(programaLabels).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Entidade</label>
              <Select value={filterEscola} onValueChange={setFilterEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as entidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as entidades</SelectItem>
                  {escolas?.map(e => (
                    <SelectItem key={e.id} value={e.id}>{e.nome}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-muted-foreground mb-1 block">Tipo de Ação</label>
              <Select value={filterTipo} onValueChange={setFilterTipo}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os tipos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {tiposDisponiveis.map(t => (
                    <SelectItem key={t} value={t}>{TIPO_LABELS[t] || t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : pendencias.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mb-4 opacity-30" />
              <p className="text-lg font-medium">Nenhuma pendência encontrada</p>
              <p className="text-sm">Todas as ações estão em dia! 🎉</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Entidade</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Data Prevista</TableHead>
                  <TableHead>Atraso</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendencias.map(p => {
                  const dataStr = p.status === 'reagendada' && p.reagendada_para
                    ? p.reagendada_para
                    : p.data;
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">
                        {TIPO_LABELS[p.tipo] || p.tipo}
                      </TableCell>
                      <TableCell>{p.escola_nome}</TableCell>
                      <TableCell>{p.aap_nome}</TableCell>
                      <TableCell>
                        {new Date(dataStr).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>{getSeverityBadge(p.dias_atraso)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          {canSendPendingEmail && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleSendPendingEmail(p.id)}
                              disabled={sendingRegistroId === p.id}
                              title="Enviar pendência por e-mail"
                            >
                              {sendingRegistroId === p.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Mail className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate('/registros')}
                            title="Ver registros"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
