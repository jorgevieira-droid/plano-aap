import { useState } from 'react';
import { Upload, Download, Loader2, AlertCircle, CheckCircle, Users } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { ALL_ROLES, ROLES_WITH_PROGRAMAS, roleLabelsMap } from '@/config/roleConfig';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

interface BatchUser {
  nome: string;
  email: string;
  senha: string;
  papel: string;
  programa: string;
  status?: 'pending' | 'success' | 'error';
  message?: string;
}

interface BatchUserUploadDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

// Build roleMapping dynamically from ALL_ROLES
const roleMapping: Record<string, string | null> = { '': null, 'sem papel': null };
ALL_ROLES.forEach(r => {
  roleMapping[r.value] = r.value;
});
// Legacy friendly aliases
roleMapping['administrador'] = 'admin';
roleMapping['aap anos iniciais'] = 'aap_inicial';
roleMapping['aap iniciais'] = 'aap_inicial';
roleMapping['aap português'] = 'aap_portugues';
roleMapping['aap lingua portuguesa'] = 'aap_portugues';
roleMapping['aap matemática'] = 'aap_matematica';

const programaMapping: Record<string, ProgramaType | null> = {
  'escolas': 'escolas',
  'programa de escolas': 'escolas',
  'regionais': 'regionais',
  'regionais de ensino': 'regionais',
  'redes_municipais': 'redes_municipais',
  'redes municipais': 'redes_municipais',
  '': null,
};

const programaLabels: Record<ProgramaType, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais',
  redes_municipais: 'Redes Mun.',
};

export function BatchUserUploadDialog({ open, onClose, onSuccess }: BatchUserUploadDialogProps) {
  const [users, setUsers] = useState<BatchUser[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedCount, setProcessedCount] = useState(0);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n').filter(line => line.trim());
        
        // Skip header if present
        const startIndex = lines[0].toLowerCase().includes('nome') ? 1 : 0;
        
        const parsedUsers: BatchUser[] = [];
        
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          // Try to parse as CSV (comma or semicolon separated)
          const parts = line.includes(';') 
            ? line.split(';').map(p => p.trim())
            : line.split(',').map(p => p.trim());
          
          if (parts.length >= 3) {
            parsedUsers.push({
              nome: parts[0],
              email: parts[1],
              senha: parts[2],
              papel: parts[3] || '',
              programa: parts[4] || '',
              status: 'pending',
            });
          }
        }
        
        if (parsedUsers.length === 0) {
          toast.error('Nenhum usuário válido encontrado no arquivo');
          return;
        }
        
        setUsers(parsedUsers);
        toast.success(`${parsedUsers.length} usuários carregados para revisão`);
      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Erro ao processar o arquivo');
      }
    };
    
    reader.readAsText(file);
    event.target.value = '';
  };

  const downloadTemplate = () => {
    // Reference header with all valid values
    const rolesRef = ALL_ROLES.map(r => `${r.value} = ${r.label}`).join(', ');
    const progRef = 'escolas, regionais, redes_municipais';
    const header = 'nome;email;senha;papel;programa';
    const examples = [
      'João Silva;joao@email.com;Senha@123;n5_formador;escolas',
      'Maria Santos;maria@email.com;Senha@123;gestor;regionais',
      'Carlos Admin;carlos@email.com;Senha@123;admin;',
      'Ana Coord;ana@email.com;Senha@123;n3_coordenador_programa;redes_municipais',
      'Pedro Prof;pedro@email.com;Senha@123;n7_professor;',
    ];
    const reference = `\n# VALORES VÁLIDOS PARA PAPEL: ${rolesRef}\n# VALORES VÁLIDOS PARA PROGRAMA: ${progRef}`;
    const template = header + '\n' + examples.join('\n') + reference;
    const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'modelo_usuarios.csv';
    link.click();
  };

  const validateUsers = (): boolean => {
    for (const user of users) {
      if (!user.nome || !user.email || !user.senha) {
        toast.error('Todos os usuários devem ter nome, email e senha');
        return false;
      }
      
      if (user.senha.length < 9) {
        toast.error(`A senha do usuário ${user.nome} deve ter pelo menos 9 caracteres`);
        return false;
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(user.email)) {
        toast.error(`Email inválido para o usuário ${user.nome}`);
        return false;
      }
      
      // Validate role if provided
      const role = user.papel ? roleMapping[user.papel.toLowerCase()] : null;
      if (user.papel && role === undefined) {
        toast.error(`Papel inválido para o usuário ${user.nome}: ${user.papel}`);
        return false;
      }
      
      // Validate programa if provided
      const programa = user.programa ? programaMapping[user.programa.toLowerCase()] : null;
      if (user.programa && programa === undefined) {
        toast.error(`Programa inválido para o usuário ${user.nome}: ${user.programa}`);
        return false;
      }
      
      // Validate that roles requiring programa have one
      if (role && ROLES_WITH_PROGRAMAS.includes(role as any) && !programa) {
        toast.error(`O papel "${role}" do usuário ${user.nome} exige um programa definido`);
        return false;
      }
    }
    return true;
  };

  const processUsers = async () => {
    if (!validateUsers()) return;
    
    setIsProcessing(true);
    setProcessedCount(0);
    
    const { data: { session }, error: sessionError } = await supabase.auth.refreshSession();
    const token = session?.access_token;
    
    if (sessionError || !token) {
      toast.error('Sessão expirada. Faça login novamente.');
      setIsProcessing(false);
      return;
    }

    const updatedUsers = [...users];
    let successCount = 0;
    let errorCount = 0;
    
    for (let i = 0; i < updatedUsers.length; i++) {
      const user = updatedUsers[i];
      const role = roleMapping[user.papel.toLowerCase()] || null;
      const programa = programaMapping[user.programa.toLowerCase()] || null;
      
      // Build programas array if programa is provided
      const programas = programa ? [programa] : [];
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/manage-users`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'apikey': import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
          },
          body: JSON.stringify({
            action: 'create-batch',
            email: user.email,
            password: user.senha,
            nome: user.nome,
            role: role,
            programas: programas,
            mustChangePassword: true,
          }),
        });

        const result = await response.json();
        
        if (!response.ok) {
          throw new Error(result.error || 'Erro ao criar usuário');
        }
        
        updatedUsers[i] = {
          ...user,
          status: 'success',
          message: 'Criado com sucesso',
        };
        successCount++;
      } catch (error) {
        updatedUsers[i] = {
          ...user,
          status: 'error',
          message: error instanceof Error ? error.message : 'Erro desconhecido',
        };
        errorCount++;
      }
      
      setProcessedCount(i + 1);
      setUsers([...updatedUsers]);
    }
    
    setIsProcessing(false);
    
    if (successCount > 0) {
      toast.success(`${successCount} usuário(s) criado(s) com sucesso`);
    }
    if (errorCount > 0) {
      toast.error(`${errorCount} usuário(s) com erro`);
    }
    
    if (successCount > 0) {
      onSuccess();
    }
  };

  const handleClose = () => {
    if (!isProcessing) {
      setUsers([]);
      setProcessedCount(0);
      onClose();
    }
  };

  const getMappedRole = (papel: string): string | null => {
    return roleMapping[papel.toLowerCase()] || null;
  };

  const getMappedPrograma = (programa: string): ProgramaType | null => {
    return programaMapping[programa.toLowerCase()] || null;
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Cadastro em Lote de Usuários
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 mt-4">
          {users.length === 0 ? (
            <>
              <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                <p className="text-sm text-muted-foreground">
                  Faça upload de um arquivo CSV com os dados dos usuários. O arquivo deve conter as colunas:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>nome</strong> - Nome completo do usuário</li>
                  <li><strong>email</strong> - Email do usuário</li>
                  <li><strong>senha</strong> - Senha inicial (mínimo 9 caracteres)</li>
                  <li><strong>papel</strong> (opcional) — valores aceitos:</li>
                </ul>
                <div className="text-xs text-muted-foreground ml-6 mb-2 grid grid-cols-2 gap-x-4 gap-y-0.5">
                  {ALL_ROLES.map(r => (
                    <span key={r.value}><code className="bg-muted px-1 rounded">{r.value}</code> — {r.label}</span>
                  ))}
                </div>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1">
                  <li><strong>programa</strong> (opcional, obrigatório para alguns papéis) — valores aceitos: <code className="bg-muted px-1 rounded">escolas</code>, <code className="bg-muted px-1 rounded">regionais</code>, <code className="bg-muted px-1 rounded">redes_municipais</code></li>
                </ul>
                <p className="text-sm text-primary font-medium">
                  ⚠️ Todos os usuários serão obrigados a alterar a senha no primeiro acesso.
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={downloadTemplate} className="gap-2">
                  <Download size={18} />
                  Baixar Modelo
                </Button>
                <Label htmlFor="csv-upload" className="cursor-pointer">
                  <div className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2">
                    <Upload size={18} />
                    Upload CSV
                  </div>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv,.txt"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </Label>
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {users.length} usuário(s) carregado(s)
                  {isProcessing && ` - Processando ${processedCount}/${users.length}`}
                </p>
                {!isProcessing && users.some(u => u.status === 'pending') && (
                  <Button variant="outline" size="sm" onClick={() => setUsers([])}>
                    Limpar Lista
                  </Button>
                )}
              </div>
              
              <ScrollArea className="h-[400px] border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Papel</TableHead>
                      <TableHead>Programa</TableHead>
                      <TableHead className="w-32">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user, index) => {
                      const mappedRole = getMappedRole(user.papel);
                      const mappedPrograma = getMappedPrograma(user.programa);
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-medium">{user.nome}</TableCell>
                          <TableCell>{user.email}</TableCell>
                          <TableCell>
                            {mappedRole ? (
                              <Badge variant="outline">{roleLabelsMap[mappedRole] || mappedRole}</Badge>
                            ) : (
                              <span className="text-muted-foreground">Sem papel</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {mappedPrograma ? (
                              <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {programaLabels[mappedPrograma]}
                              </span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {user.status === 'pending' && (
                              <Badge variant="secondary">Pendente</Badge>
                            )}
                            {user.status === 'success' && (
                              <Badge className="bg-green-500/10 text-green-600 border-green-500/20">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                OK
                              </Badge>
                            )}
                            {user.status === 'error' && (
                              <Badge variant="destructive" title={user.message}>
                                <AlertCircle className="w-3 h-3 mr-1" />
                                Erro
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </ScrollArea>
              
              {users.some(u => u.status === 'error') && (
                <div className="bg-destructive/10 p-3 rounded-lg">
                  <p className="text-sm text-destructive font-medium mb-2">Erros encontrados:</p>
                  <ul className="text-sm text-destructive space-y-1">
                    {users.filter(u => u.status === 'error').map((u, i) => (
                      <li key={i}>{u.nome}: {u.message}</li>
                    ))}
                  </ul>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} disabled={isProcessing} className="flex-1">
                  {isProcessing ? 'Processando...' : 'Fechar'}
                </Button>
                {users.some(u => u.status === 'pending') && (
                  <Button onClick={processUsers} disabled={isProcessing} className="flex-1 gap-2">
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Processando...
                      </>
                    ) : (
                      <>
                        <Upload size={18} />
                        Processar {users.filter(u => u.status === 'pending').length} Usuários
                      </>
                    )}
                  </Button>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
