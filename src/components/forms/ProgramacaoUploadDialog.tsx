import { useState, useRef } from 'react';
import { Upload, Download, AlertCircle, CheckCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import * as XLSX from 'xlsx';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface ProgramacaoUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  escolas: { id: string; nome: string; codesc?: string | null }[];
  aaps: { id: string; nome: string }[];
  onUpload: (programacoes: ParsedProgramacao[]) => void;
}

export interface ParsedProgramacao {
  tipo: string;
  titulo: string;
  descricao?: string;
  data: string;
  horario_inicio: string;
  horario_fim: string;
  escola_id: string;
  aap_id: string;
  segmento: string;
  componente: string;
  ano_serie: string;
  programa: string[];
}

interface ParsedRow extends ParsedProgramacao {
  valid: boolean;
  errors: string[];
  escolaNome?: string;
  aapNome?: string;
}

const tiposValidos = ['formacao', 'visita', 'acompanhamento_aula'];
const segmentosValidos = ['anos_iniciais', 'anos_finais', 'ensino_medio'];
const componentesValidos = ['polivalente', 'portugues', 'matematica'];
const programasValidos = ['escolas', 'regionais', 'redes_municipais'];

export function ProgramacaoUploadDialog({ open, onOpenChange, escolas, aaps, onUpload }: ProgramacaoUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedRow[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const normalizeTime = (value: string): string => {
    if (!value) return '';
    // Handle Excel time format (decimal) or string format
    if (typeof value === 'number') {
      const totalMinutes = Math.round(value * 24 * 60);
      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    }
    const cleaned = String(value).trim();
    // Check if already in HH:MM format
    if (/^\d{1,2}:\d{2}$/.test(cleaned)) {
      const [h, m] = cleaned.split(':');
      return `${String(h).padStart(2, '0')}:${m}`;
    }
    return cleaned;
  };

  const normalizeDate = (value: any): string => {
    if (!value) return '';
    // Handle Excel serial date
    if (typeof value === 'number') {
      const date = XLSX.SSF.parse_date_code(value);
      return `${date.y}-${String(date.m).padStart(2, '0')}-${String(date.d).padStart(2, '0')}`;
    }
    const cleaned = String(value).trim();
    // Try to parse DD/MM/YYYY format
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(cleaned)) {
      const [d, m, y] = cleaned.split('/');
      return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    }
    // Try YYYY-MM-DD format
    if (/^\d{4}-\d{2}-\d{2}$/.test(cleaned)) {
      return cleaned;
    }
    return cleaned;
  };

  const findEscolaByCodesc = (codesc: string): { id: string; nome: string } | null => {
    const cleaned = String(codesc).replace(/\D/g, '');
    const found = escolas.find(e => e.codesc?.replace(/\D/g, '') === cleaned);
    return found ? { id: found.id, nome: found.nome } : null;
  };

  const findAapByNome = (nome: string): { id: string; nome: string } | null => {
    const cleaned = String(nome).trim().toLowerCase();
    const found = aaps.find(a => a.nome.toLowerCase() === cleaned);
    return found ? { id: found.id, nome: found.nome } : null;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array', cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const parsed: ParsedRow[] = jsonData.map((row: any) => {
          const errors: string[] = [];

          // Tipo
          const tipo = String(row['TIPO'] || row['tipo'] || '').toLowerCase().trim();
          if (!tiposValidos.includes(tipo)) {
            errors.push(`Tipo inválido: "${tipo}" (use: formacao, visita, acompanhamento_aula)`);
          }

          // Título
          const titulo = String(row['TITULO'] || row['titulo'] || '').trim();
          if (!titulo) errors.push('Título obrigatório');

          // Descrição (opcional)
          const descricao = String(row['DESCRICAO'] || row['descricao'] || '').trim() || undefined;

          // Data
          const dataRaw = row['DATA'] || row['data'];
          const data = normalizeDate(dataRaw);
          if (!data || !/^\d{4}-\d{2}-\d{2}$/.test(data)) {
            errors.push('Data inválida (use DD/MM/YYYY ou YYYY-MM-DD)');
          }

          // Horários
          const horarioInicioRaw = row['HORARIO_INICIO'] || row['horario_inicio'] || row['INICIO'] || row['inicio'];
          const horarioFimRaw = row['HORARIO_FIM'] || row['horario_fim'] || row['FIM'] || row['fim'];
          const horario_inicio = normalizeTime(horarioInicioRaw);
          const horario_fim = normalizeTime(horarioFimRaw);
          if (!horario_inicio || !/^\d{2}:\d{2}$/.test(horario_inicio)) {
            errors.push('Horário início inválido (use HH:MM)');
          }
          if (!horario_fim || !/^\d{2}:\d{2}$/.test(horario_fim)) {
            errors.push('Horário fim inválido (use HH:MM)');
          }

          // Escola (por CODESC)
          const codesc = String(row['CODESC'] || row['codesc'] || '').trim();
          const escola = findEscolaByCodesc(codesc);
          if (!escola) {
            errors.push(`Escola não encontrada com CODESC: ${codesc}`);
          }

          // AAP/Formador (por nome)
          const aapNome = String(row['AAP'] || row['aap'] || row['FORMADOR'] || row['formador'] || '').trim();
          const aap = findAapByNome(aapNome);
          if (!aap) {
            errors.push(`AAP/Formador não encontrado: "${aapNome}"`);
          }

          // Para visitas, segmento, componente e ano_serie são opcionais
          const isVisita = tipo === 'visita';

          // Segmento
          let segmento = String(row['SEGMENTO'] || row['segmento'] || '').toLowerCase().trim();
          if (!isVisita && !segmentosValidos.includes(segmento)) {
            errors.push(`Segmento inválido: "${segmento}" (use: anos_iniciais, anos_finais)`);
          }
          if (isVisita && !segmento) segmento = 'anos_iniciais'; // valor padrão para visita

          // Componente
          let componente = String(row['COMPONENTE'] || row['componente'] || '').toLowerCase().trim();
          if (!isVisita && !componentesValidos.includes(componente)) {
            errors.push(`Componente inválido: "${componente}" (use: polivalente, portugues, matematica)`);
          }
          if (isVisita && !componente) componente = 'polivalente'; // valor padrão para visita

          // Ano/Série
          let anoSerie = String(row['ANO_SERIE'] || row['ano_serie'] || row['ANO'] || row['ano'] || '').trim();
          if (!isVisita && !anoSerie) errors.push('Ano/Série obrigatório');
          if (isVisita && !anoSerie) anoSerie = 'N/A'; // valor padrão para visita

          // Programa
          const programaRaw = String(row['PROGRAMA'] || row['programa'] || 'escolas').toLowerCase().trim();
          const programa = programaRaw.split(',').map(p => p.trim()).filter(p => programasValidos.includes(p));
          if (programa.length === 0) {
            errors.push(`Programa inválido: "${programaRaw}" (use: escolas, regionais, redes_municipais)`);
          }

          return {
            tipo,
            titulo,
            descricao,
            data,
            horario_inicio,
            horario_fim,
            escola_id: escola?.id || '',
            aap_id: aap?.id || '',
            segmento,
            componente,
            ano_serie: anoSerie,
            programa,
            escolaNome: escola?.nome,
            aapNome: aap?.nome,
            valid: errors.length === 0,
            errors,
          };
        });

        setParsedData(parsed);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Erro ao processar arquivo. Verifique o formato.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const template = [
      {
        TIPO: 'formacao',
        TITULO: 'Formação em Alfabetização',
        DESCRICAO: 'Formação para professores do 1º ano',
        DATA: format(new Date(), 'dd/MM/yyyy'),
        HORARIO_INICIO: '08:00',
        HORARIO_FIM: '12:00',
        CODESC: '123456',
        AAP: 'Nome do Formador',
        SEGMENTO: 'anos_iniciais',
        COMPONENTE: 'polivalente',
        ANO_SERIE: '1º Ano',
        PROGRAMA: 'escolas',
      },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    
    // Add column widths
    ws['!cols'] = [
      { wch: 20 }, // TIPO
      { wch: 30 }, // TITULO
      { wch: 40 }, // DESCRICAO
      { wch: 12 }, // DATA
      { wch: 15 }, // HORARIO_INICIO
      { wch: 12 }, // HORARIO_FIM
      { wch: 10 }, // CODESC
      { wch: 25 }, // AAP
      { wch: 15 }, // SEGMENTO
      { wch: 15 }, // COMPONENTE
      { wch: 12 }, // ANO_SERIE
      { wch: 15 }, // PROGRAMA
    ];
    
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Programacoes');
    XLSX.writeFile(wb, 'modelo_programacoes.xlsx');
  };

  const handleConfirmUpload = () => {
    const validData = parsedData.filter(item => item.valid);
    if (validData.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }

    const dataToUpload = validData.map(({ valid, errors, escolaNome, aapNome, ...prog }) => prog);
    onUpload(dataToUpload);
    setParsedData([]);
    onOpenChange(false);
  };

  const validCount = parsedData.filter(item => item.valid).length;
  const invalidCount = parsedData.filter(item => !item.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Programações em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Formato do arquivo:</p>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-muted-foreground">
              <div><strong>TIPO</strong>: formacao, visita, acompanhamento_aula</div>
              <div><strong>TITULO</strong>: Nome da ação (obrigatório)</div>
              <div><strong>DESCRICAO</strong>: Descrição (opcional)</div>
              <div><strong>DATA</strong>: DD/MM/YYYY ou YYYY-MM-DD</div>
              <div><strong>HORARIO_INICIO</strong>: HH:MM (ex: 08:00)</div>
              <div><strong>HORARIO_FIM</strong>: HH:MM (ex: 12:00)</div>
              <div><strong>CODESC</strong>: Código da escola</div>
              <div><strong>AAP</strong>: Nome do formador</div>
              <div><strong>SEGMENTO</strong>: anos_iniciais, anos_finais <span className="text-xs">(opcional p/ visita)</span></div>
              <div><strong>COMPONENTE</strong>: polivalente, portugues, matematica <span className="text-xs">(opcional p/ visita)</span></div>
              <div><strong>ANO_SERIE</strong>: Ex: 1º Ano, 5º Ano <span className="text-xs">(opcional p/ visita)</span></div>
              <div><strong>PROGRAMA</strong>: escolas, regionais, redes_municipais</div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadTemplate}
              className="btn-outline flex items-center gap-2"
            >
              <Download size={16} />
              Baixar Modelo
            </button>
            <label className="btn-primary flex items-center gap-2 cursor-pointer">
              <Upload size={16} />
              {isProcessing ? 'Processando...' : 'Selecionar Arquivo'}
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Preview */}
          {parsedData.length > 0 && (
            <div className="flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center gap-4 mb-3">
                <span className="text-sm font-medium">Prévia dos dados:</span>
                <span className="flex items-center gap-1 text-sm text-success">
                  <CheckCircle size={14} />
                  {validCount} válido(s)
                </span>
                {invalidCount > 0 && (
                  <span className="flex items-center gap-1 text-sm text-destructive">
                    <AlertCircle size={14} />
                    {invalidCount} com erro(s)
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left whitespace-nowrap">Status</th>
                      <th className="p-2 text-left whitespace-nowrap">Tipo</th>
                      <th className="p-2 text-left whitespace-nowrap">Título</th>
                      <th className="p-2 text-left whitespace-nowrap">Data</th>
                      <th className="p-2 text-left whitespace-nowrap">Horário</th>
                      <th className="p-2 text-left whitespace-nowrap">Escola</th>
                      <th className="p-2 text-left whitespace-nowrap">AAP</th>
                      <th className="p-2 text-left">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr key={index} className={`border-t border-border ${!item.valid ? 'bg-destructive/5' : ''}`}>
                        <td className="p-2">
                          {item.valid ? (
                            <CheckCircle size={16} className="text-success" />
                          ) : (
                            <AlertCircle size={16} className="text-destructive" />
                          )}
                        </td>
                        <td className="p-2 whitespace-nowrap">{item.tipo}</td>
                        <td className="p-2 max-w-[150px] truncate" title={item.titulo}>{item.titulo}</td>
                        <td className="p-2 whitespace-nowrap">{item.data}</td>
                        <td className="p-2 whitespace-nowrap">{item.horario_inicio}-{item.horario_fim}</td>
                        <td className="p-2 max-w-[120px] truncate" title={item.escolaNome}>{item.escolaNome || '-'}</td>
                        <td className="p-2 max-w-[120px] truncate" title={item.aapNome}>{item.aapNome || '-'}</td>
                        <td className="p-2 text-destructive text-xs">{item.errors.join('; ')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Footer */}
          {parsedData.length > 0 && (
            <div className="flex gap-3 pt-4 border-t border-border">
              <button
                onClick={() => {
                  setParsedData([]);
                  if (fileInputRef.current) fileInputRef.current.value = '';
                }}
                className="btn-outline flex-1"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmUpload}
                disabled={validCount === 0}
                className="btn-primary flex-1 disabled:opacity-50"
              >
                Importar {validCount} Programação(ões)
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
