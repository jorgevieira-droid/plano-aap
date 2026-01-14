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

interface EscolaUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpload: (escolas: { codesc: string; codInep: string; nome: string; endereco?: string }[], updateExisting: boolean) => void;
}

interface ParsedEscola {
  codesc: string;
  codInep: string;
  nome: string;
  endereco?: string;
  valid: boolean;
  errors: string[];
}

export function EscolaUploadDialog({ open, onOpenChange, onUpload }: EscolaUploadDialogProps) {
  const [parsedData, setParsedData] = useState<ParsedEscola[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [updateExisting, setUpdateExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateCodesc = (value: string): boolean => {
    const cleaned = String(value).replace(/\D/g, '');
    return cleaned.length <= 6 && cleaned.length > 0;
  };

  const validateCodInep = (value: string): boolean => {
    const cleaned = String(value).replace(/\D/g, '');
    return cleaned.length === 8;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });

        const parsed: ParsedEscola[] = jsonData.map((row: any) => {
          const errors: string[] = [];
          const codesc = String(row['CODESC'] || row['codesc'] || '').trim();
          const codInep = String(row['COD_INEP'] || row['cod_inep'] || row['CODINEP'] || '').trim();
          const nome = String(row['NOME'] || row['nome'] || row['Nome'] || '').trim();
          const endereco = String(row['ENDERECO'] || row['endereco'] || row['Endereco'] || '').trim() || undefined;

          if (!codesc) errors.push('CODESC obrigatório');
          else if (!validateCodesc(codesc)) errors.push('CODESC inválido (até 6 dígitos)');

          if (!codInep) errors.push('COD_INEP obrigatório');
          else if (!validateCodInep(codInep)) errors.push('COD_INEP inválido (8 dígitos)');

          if (!nome) errors.push('Nome obrigatório');

          return {
            codesc: codesc.replace(/\D/g, ''),
            codInep: codInep.replace(/\D/g, ''),
            nome,
            endereco,
            valid: errors.length === 0,
            errors,
          };
        });

        setParsedData(parsed);
      } catch (error) {
        toast.error('Erro ao processar arquivo. Verifique o formato.');
      } finally {
        setIsProcessing(false);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleDownloadTemplate = () => {
    const template = [
      { CODESC: '123456', COD_INEP: '35123456', NOME: 'E.E. Exemplo', ENDERECO: 'Rua Exemplo, 123 - Bairro' },
    ];
    const ws = XLSX.utils.json_to_sheet(template);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Escolas');
    XLSX.writeFile(wb, 'modelo_escolas.xlsx');
  };

  const handleConfirmUpload = () => {
    const validData = parsedData.filter(item => item.valid);
    if (validData.length === 0) {
      toast.error('Nenhum registro válido para importar');
      return;
    }

    onUpload(validData.map(({ valid, errors, ...escola }) => escola), updateExisting);
    setParsedData([]);
    setUpdateExisting(false);
    onOpenChange(false);
  };

  const validCount = parsedData.filter(item => item.valid).length;
  const invalidCount = parsedData.filter(item => !item.valid).length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Importar Escola / Regional / Rede em Lote</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Instructions */}
          <div className="bg-muted/50 rounded-lg p-4 text-sm">
            <p className="font-medium mb-2">Formato do arquivo:</p>
            <ul className="list-disc list-inside space-y-1 text-muted-foreground">
              <li><strong>CODESC</strong>: Código da escola (numérico, até 6 dígitos)</li>
              <li><strong>COD_INEP</strong>: Código INEP (numérico, 8 dígitos)</li>
              <li><strong>NOME</strong>: Nome da escola (obrigatório)</li>
              <li><strong>ENDERECO</strong>: Endereço (opcional)</li>
            </ul>
          </div>

          {/* Update existing option */}
          <label className="flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg cursor-pointer hover:bg-primary/10 transition-colors">
            <input
              type="checkbox"
              checked={updateExisting}
              onChange={(e) => setUpdateExisting(e.target.checked)}
              className="rounded border-border w-4 h-4"
            />
            <div className="flex-1">
              <span className="font-medium text-sm">Atualizar escolas existentes</span>
              <p className="text-xs text-muted-foreground">
                Se habilitado, escolas com mesmo CODESC serão atualizadas. Caso contrário, duplicatas serão ignoradas.
              </p>
            </div>
          </label>

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
              Selecionar Arquivo
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv"
                onChange={handleFileUpload}
                className="hidden"
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
                  <span className="flex items-center gap-1 text-sm text-error">
                    <AlertCircle size={14} />
                    {invalidCount} com erro(s)
                  </span>
                )}
              </div>

              <div className="flex-1 overflow-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="p-2 text-left">Status</th>
                      <th className="p-2 text-left">CODESC</th>
                      <th className="p-2 text-left">COD_INEP</th>
                      <th className="p-2 text-left">Nome</th>
                      <th className="p-2 text-left">Erros</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.map((item, index) => (
                      <tr key={index} className={`border-t border-border ${!item.valid ? 'bg-error/5' : ''}`}>
                        <td className="p-2">
                          {item.valid ? (
                            <CheckCircle size={16} className="text-success" />
                          ) : (
                            <AlertCircle size={16} className="text-error" />
                          )}
                        </td>
                        <td className="p-2">{item.codesc}</td>
                        <td className="p-2">{item.codInep}</td>
                        <td className="p-2">{item.nome}</td>
                        <td className="p-2 text-error">{item.errors.join(', ')}</td>
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
                Importar {validCount} Registro(s)
              </button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
