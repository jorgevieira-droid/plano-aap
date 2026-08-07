import { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, ProgramaType } from '@/contexts/AuthContext';
import { useAcoesByPrograma } from '@/hooks/useAcoesByPrograma';
import { ACAO_TYPE_INFO, AcaoTipo, canUserCreateAcao } from '@/config/acaoPermissions';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';

const PROGRAMA_LABELS: Record<ProgramaType, string> = {
  escolas: 'Escolas',
  regionais: 'Regionais',
  redes_municipais: 'Redes Municipais',
};

export default function AdicionarAcaoPage() {
  const navigate = useNavigate();
  const { profile, isRealAdmin, isSimulating, simulatedRole } = useAuth();
  const { getAcoesByPrograma, isLoading } = useAcoesByPrograma();

  const effectiveRole = isSimulating ? simulatedRole ?? profile?.role : profile?.role;

  const userProgramas = useMemo<ProgramaType[]>(() => {
    const all: ProgramaType[] = ['escolas', 'regionais', 'redes_municipais'];
    if (isRealAdmin && !isSimulating) return all;
    const p = profile?.programas || [];
    return p.length > 0 ? p : all;
  }, [profile?.programas, isRealAdmin, isSimulating]);

  const [programa, setPrograma] = useState<ProgramaType>(userProgramas[0] || 'escolas');

  useEffect(() => {
    if (!userProgramas.includes(programa)) setPrograma(userProgramas[0] || 'escolas');
  }, [userProgramas, programa]);

  const acoes = useMemo(() => {
    return getAcoesByPrograma(programa).filter(
      (tipo) => tipo !== 'acompanhamento_formacoes' && canUserCreateAcao(effectiveRole, tipo)
    ) as AcaoTipo[];
  }, [getAcoesByPrograma, programa, effectiveRole]);

  const handleSelect = (tipo: AcaoTipo) => {
    navigate(`/programacao?novaAcao=${tipo}&direto=1&programa=${programa}`);
  };

  return (
    <div className="min-w-0 overflow-x-hidden">
        <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground md:text-3xl">Adicionar Ação</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Selecione a ação realizada para registrá-la diretamente, sem agendamento prévio.
            </p>
          </div>
          {userProgramas.length > 1 && (
            <div className="w-full md:w-[280px]">
              <label className="mb-1 block text-xs font-medium text-muted-foreground">Programa</label>
              <Select value={programa} onValueChange={(v) => setPrograma(v as ProgramaType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userProgramas.map((p) => (
                    <SelectItem key={p} value={p}>
                      {PROGRAMA_LABELS[p]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {isLoading ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
          </div>
        ) : acoes.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
            Nenhuma ação disponível para o seu perfil neste programa.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {acoes.map((tipo) => {
              const info = ACAO_TYPE_INFO[tipo];
              const Icon = info?.icon || Plus;
              return (
                <button
                  key={tipo}
                  type="button"
                  onClick={() => handleSelect(tipo)}
                  className="group flex items-center gap-3 rounded-xl border-2 border-border bg-card p-4 text-left transition-all hover:border-primary hover:bg-primary/5"
                >
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary transition-colors group-hover:bg-primary/20">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="min-w-0 break-words text-sm font-medium leading-tight">
                    {info?.label || tipo}
                  </span>
                </button>
              );
            })}
          </div>
        )}
    </div>
  );
}
