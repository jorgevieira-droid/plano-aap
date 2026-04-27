import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Printer, Calendar, Users, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ListaPresencaPrint } from '@/components/presenca/ListaPresencaPrint';
import { toast } from 'sonner';

const TIPOS_SUPORTADOS = [
  'formacao',
  'encontro_microciclos_recomposicao',
  'encontro_eteg_redes',
  'encontro_professor_redes',
] as const;

type TipoAcao = typeof TIPOS_SUPORTADOS[number];

const TIPO_LABEL: Record<TipoAcao, string> = {
  formacao: 'Formação',
  encontro_microciclos_recomposicao: 'Encontro Formativo — Microciclos de Recomposição',
  encontro_eteg_redes: 'Encontro Formativo ET/EG — REDES',
  encontro_professor_redes: 'Encontro Formativo Professor — REDES',
};

const TIPO_LABEL_CURTO: Record<TipoAcao, string> = {
  formacao: 'Formação',
  encontro_microciclos_recomposicao: 'Microciclos',
  encontro_eteg_redes: 'ET/EG REDES',
  encontro_professor_redes: 'Professor REDES',
};

const REDES_ENCONTRO_TYPES = new Set<TipoAcao>([
  'encontro_microciclos_recomposicao',
  'encontro_eteg_redes',
  'encontro_professor_redes',
]);

interface Formacao {
  id: string;
  tipo: TipoAcao;
  titulo: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  programa: string[] | null;
  tipo_ator_presenca: string | null;
  turma_formacao: string | null;
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
  const [selectedTipo, setSelectedTipo] = useState<'all' | TipoAcao>('all');
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

      const tiposParaBuscar =
        selectedTipo === 'all' ? [...TIPOS_SUPORTADOS] : [selectedTipo];

      let query = supabase
        .from('programacoes')
        .select(`
          id,
          tipo,
          titulo,
          data,
          horario_inicio,
          horario_fim,
          segmento,
          componente,
          ano_serie,
          programa,
          tipo_ator_presenca,
          turma_formacao,
          escola_id,
          escolas!inner(nome),
          profiles!programacoes_aap_id_fkey(nome)
        `)
        .in('tipo', tiposParaBuscar)
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
        toast.error('Erro ao carregar ações');
      } else if (data) {
        const mapped = data.map((f: any) => ({
          id: f.id,
          tipo: f.tipo as TipoAcao,
          titulo: f.titulo,
          data: f.data,
          horario_inicio: f.horario_inicio,
          horario_fim: f.horario_fim,
          segmento: f.segmento,
          componente: f.componente,
          ano_serie: f.ano_serie,
          programa: f.programa,
          tipo_ator_presenca: f.tipo_ator_presenca || 'todos',
          turma_formacao: f.turma_formacao || null,
          escola_id: f.escola_id,
          escola_nome: f.escolas?.nome || '',
          formador_nome: f.profiles?.nome || '',
        }));
        setFormacoes(mapped);
      }

      setIsLoading(false);
    };

    fetchFormacoes();
  }, [selectedEscola, selectedTipo, dataInicio, dataFim]);

  // Load eligible teachers when formation is selected
  useEffect(() => {
    const fetchProfessores = async () => {
      if (!selectedFormacao) {
        setProfessores([]);
        return;
      }

      const isRedesEncontro = REDES_ENCONTRO_TYPES.has(selectedFormacao.tipo);

      let query = supabase
        .from('professores')
        .select(`
          id,
          nome,
          cargo,
          turma_formacao,
          escolas!inner(nome)
        `)
        .eq('escola_id', selectedFormacao.escola_id)
        .eq('ativo', true)
        .order('nome');

      if (isRedesEncontro) {
        // Para encontros REDES: filtrar apenas por turma_formacao se preenchida.
        const turma = selectedFormacao.turma_formacao?.trim();
        if (turma) {
          query = query.eq('turma_formacao', turma);
        }
      } else {
        // Formação tradicional: filtros por componente/segmento/ano_serie/cargo
        const tipoAtor = selectedFormacao.tipo_ator_presenca;
        const isCargoAdministrativo =
          tipoAtor && tipoAtor !== 'todos' && tipoAtor !== 'professor';

        if (
          !isCargoAdministrativo &&
          selectedFormacao.componente &&
          selectedFormacao.componente !== 'todos'
        ) {
          query = query.eq('componente', selectedFormacao.componente);
        }

        if (
          !isCargoAdministrativo &&
          selectedFormacao.segmento &&
          selectedFormacao.segmento !== 'todos'
        ) {
          query = query.eq('segmento', selectedFormacao.segmento);
        }

        if (
          !isCargoAdministrativo &&
          selectedFormacao.ano_serie &&
          selectedFormacao.ano_serie !== 'todos'
        ) {
          query = query.eq('ano_serie', selectedFormacao.ano_serie);
        }

        if (tipoAtor && tipoAtor !== 'todos') {
          query = query.eq('cargo', tipoAtor);
        }
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching professores:', error);
        toast.error('Erro ao carregar participantes');
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

  return (
    <div className="space-y-6">
      {/* Page Header - hidden when printing */}
      <div className="print:hidden">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Printer className="h-6 w-6" />
          Lista de Presença
        </h1>
        <p className="text-muted-foreground mt-1">
          Gere listas de presença para impressão de formações e encontros formativos
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
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Ação</Label>
              <Select
                value={selectedTipo}
                onValueChange={(v) => setSelectedTipo(v as 'all' | TipoAcao)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {TIPOS_SUPORTADOS.map((t) => (
                    <SelectItem key={t} value={t}>
                      {TIPO_LABEL[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
            Ações ({formacoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-muted-foreground">Carregando...</p>
          ) : formacoes.length === 0 ? (
            <p className="text-muted-foreground">Nenhuma ação encontrada com os filtros selecionados.</p>
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
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="secondary">{TIPO_LABEL_CURTO[formacao.tipo]}</Badge>
                        <h3 className="font-medium">{formacao.titulo}</h3>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {format(parseISO(formacao.data), 'dd/MM/yyyy', { locale: ptBR })} • {formacao.horario_inicio} às {formacao.horario_fim}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {formacao.escola_nome} • {formacao.formador_nome}
                      </p>
                    </div>
                    <div className="text-right text-sm text-muted-foreground shrink-0">
                      {REDES_ENCONTRO_TYPES.has(formacao.tipo) ? (
                        <p>{formacao.turma_formacao ? `Turma: ${formacao.turma_formacao}` : 'Todas as turmas'}</p>
                      ) : (
                        <>
                          <p>{formacao.segmento}</p>
                          <p>{formacao.componente}</p>
                        </>
                      )}
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
                Nenhum participante elegível encontrado para esta ação.
              </p>
            ) : (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-4">
                  {professores.length} participante(s) elegível(is) + {linhasExtras} linha(s) extra(s)
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
            tipo: selectedFormacao.tipo,
            tipoLabel: TIPO_LABEL[selectedFormacao.tipo],
            titulo: selectedFormacao.titulo,
            data: selectedFormacao.data,
            horario_inicio: selectedFormacao.horario_inicio,
            horario_fim: selectedFormacao.horario_fim,
            segmento: selectedFormacao.segmento,
            componente: selectedFormacao.componente,
            programa: selectedFormacao.programa,
            turma_formacao: selectedFormacao.turma_formacao,
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
