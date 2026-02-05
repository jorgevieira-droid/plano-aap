import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Printer, Calendar, Users, School, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ListaPresencaPrint } from '@/components/presenca/ListaPresencaPrint';
import { toast } from 'sonner';

interface Formacao {
  id: string;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  programa: string[] | null;
  escola_id: string;
  escola_nome: string;
  formador_nome: string;
}

interface Professor {
  id: string;
  nome: string;
  cargo: string;
  escola_nome: string;
}

export default function ListaPresencaPage() {
  const { profile, isAdmin, isGestor } = useAuth();
  const printRef = useRef<HTMLDivElement>(null);
  
  // Filters
  const [escolas, setEscolas] = useState<{ id: string; nome: string }[]>([]);
  const [selectedEscola, setSelectedEscola] = useState<string>('all');
  const [dataInicio, setDataInicio] = useState<string>('');
  const [dataFim, setDataFim] = useState<string>('');
  
  // Formations and participants
  const [formacoes, setFormacoes] = useState<Formacao[]>([]);
  const [selectedFormacao, setSelectedFormacao] = useState<Formacao | null>(null);
  const [professores, setProfessores] = useState<Professor[]>([]);
  const [linhasExtras, setLinhasExtras] = useState<number>(5);
  const [isLoading, setIsLoading] = useState(false);

  // Load schools
  useEffect(() => {
    const fetchEscolas = async () => {
      const { data, error } = await supabase
        .from('escolas')
        .select('id, nome')
        .eq('ativa', true)
        .order('nome');
      
      if (!error && data) {
        setEscolas(data);
      }
    };
    fetchEscolas();
  }, []);

  // Load formations based on filters
  useEffect(() => {
    const fetchFormacoes = async () => {
      setIsLoading(true);
      
      let query = supabase
        .from('programacoes')
        .select(`
          id,
          titulo,
          data,
          horario_inicio,
          horario_fim,
          segmento,
          componente,
          ano_serie,
          programa,
          escola_id,
          escolas!inner(nome),
          profiles!programacoes_aap_id_fkey(nome)
        `)
        .eq('tipo', 'formacao')
        .order('data', { ascending: false });

      if (selectedEscola !== 'all') {
        query = query.eq('escola_id', selectedEscola);
      }
      
      if (dataInicio) {
        query = query.gte('data', dataInicio);
      }
      
      if (dataFim) {
        query = query.lte('data', dataFim);
      }

      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching formacoes:', error);
        toast.error('Erro ao carregar formações');
      } else if (data) {
        const mapped = data.map((f: any) => ({
          id: f.id,
          titulo: f.titulo,
          data: f.data,
          horario_inicio: f.horario_inicio,
          horario_fim: f.horario_fim,
          segmento: f.segmento,
          componente: f.componente,
          ano_serie: f.ano_serie,
          programa: f.programa,
          escola_id: f.escola_id,
          escola_nome: f.escolas?.nome || '',
          formador_nome: f.profiles?.nome || '',
        }));
        setFormacoes(mapped);
      }
      
      setIsLoading(false);
    };
    
    fetchFormacoes();
  }, [selectedEscola, dataInicio, dataFim]);

  // Load eligible teachers when formation is selected
  useEffect(() => {
    const fetchProfessores = async () => {
      if (!selectedFormacao) {
        setProfessores([]);
        return;
      }

      let query = supabase
        .from('professores')
        .select(`
          id,
          nome,
          cargo,
          escolas!inner(nome)
        `)
        .eq('escola_id', selectedFormacao.escola_id)
        .eq('ativo', true)
        .order('nome');

      // Filter by componente if not "todos"
      if (selectedFormacao.componente && selectedFormacao.componente !== 'todos') {
        query = query.eq('componente', selectedFormacao.componente);
      }

      // Filter by segmento if not "todos"
      if (selectedFormacao.segmento && selectedFormacao.segmento !== 'todos') {
        query = query.eq('segmento', selectedFormacao.segmento);
      }

      // Filter by ano_serie if not "todos"
      if (selectedFormacao.ano_serie && selectedFormacao.ano_serie !== 'todos') {
        query = query.eq('ano_serie', selectedFormacao.ano_serie);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching professores:', error);
        toast.error('Erro ao carregar professores');
      } else if (data) {
        const mapped = data.map((p: any) => ({
          id: p.id,
          nome: p.nome,
          cargo: p.cargo,
          escola_nome: p.escolas?.nome || '',
        }));
        setProfessores(mapped);
      }
    };

    fetchProfessores();
  }, [selectedFormacao]);

  const handlePrint = () => {
    window.print();
  };

  const formatProgramaLabel = (programa: string[] | null) => {
    if (!programa || programa.length === 0) return '-';
    return programa.map(p => {
      switch (p) {
        case 'escolas': return 'Escolas';
        case 'regionais': return 'Regionais';
        case 'redes_municipais': return 'Redes Municipais';
        default: return p;
      }
    }).join(', ');
  };

  return (
    <div className="space-y-6">
      {/* Page Header - hidden when printing */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Printer className="h-6 w-6" />
          Lista de Presença
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere listas de presença para impressão de formações
        </p>
      </div>

      {/* Filters - hidden when printing */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Escola</Label>
              <Select value={selectedEscola} onValueChange={setSelectedEscola}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as escolas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as escolas</SelectItem>
                  {escolas.map((escola) => (
                    <SelectItem key={escola.id} value={escola.id}>
                      {escola.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Data Início</Label>
              <Input
                type="date"
                value={dataInicio}
                onChange={(e) => setDataInicio(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Data Fim</Label>
              <Input
                type="date"
                value={dataFim}
                onChange={(e) => setDataFim(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Linhas Extras</Label>
              <Input
                type="number"
                min={0}
                max={20}
                value={linhasExtras}
                onChange={(e) => setLinhasExtras(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Formations List - hidden when printing */}
      <Card className="print:hidden">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Formações ({formacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : formacoes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma formação encontrada com os filtros selecionados.</p>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {formacoes.map((formacao) => (
                <div
                  key={formacao.id}
                  onClick={() => setSelectedFormacao(formacao)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedFormacao?.id === formacao.id
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-medium">{formacao.titulo}</h3>
                      <p className="text-sm text-muted-foreground">
                        {format(parseISO(formacao.data), "dd/MM/yyyy", { locale: ptBR })} • {formacao.horario_inicio} às {formacao.horario_fim}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formacao.escola_nome} • {formacao.formador_nome}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground">
                      <p>{formacao.segmento}</p>
                      <p>{formacao.componente}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Selected Formation Preview - hidden when printing */}
      {selectedFormacao && (
        <Card className="print:hidden">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Users className="h-5 w-5" />
              Participantes ({professores.length})
            </CardTitle>
            <Button onClick={handlePrint} className="gap-2">
              <Printer className="h-4 w-4" />
              Imprimir
            </Button>
          </CardHeader>
          <CardContent>
            {professores.length === 0 ? (
              <p className="text-muted-foreground">
                Nenhum professor elegível encontrado para esta formação.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {professores.length} professor(es) elegível(is) + {linhasExtras} linha(s) extra(s)
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {professores.map((prof) => (
                    <div key={prof.id} className="p-2 bg-muted rounded text-sm">
                      <p className="font-medium">{prof.nome}</p>
                      <p className="text-muted-foreground text-xs">{prof.escola_nome}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Print Component - only visible when printing */}
      {selectedFormacao && (
        <ListaPresencaPrint
          ref={printRef}
          formacao={{
            titulo: selectedFormacao.titulo,
            data: selectedFormacao.data,
            horario_inicio: selectedFormacao.horario_inicio,
            horario_fim: selectedFormacao.horario_fim,
            segmento: selectedFormacao.segmento,
            componente: selectedFormacao.componente,
            programa: selectedFormacao.programa,
          }}
          formador={selectedFormacao.formador_nome}
          escola={selectedFormacao.escola_nome}
          professores={professores}
          linhasExtras={linhasExtras}
        />
      )}
    </div>
  );
}
