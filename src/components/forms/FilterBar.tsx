import { useState, useEffect } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { segmentoLabels, componenteLabels } from '@/data/mockData';
import { FilterOptions, Segmento, ComponenteCurricular } from '@/types';
import { supabase } from '@/integrations/supabase/client';

interface Escola {
  id: string;
  nome: string;
}

interface Profile {
  id: string;
  nome: string;
}

interface FilterBarProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  showEscola?: boolean;
  showAAP?: boolean;
  className?: string;
}

export function FilterBar({ 
  filters, 
  onFilterChange, 
  showEscola = true, 
  showAAP = true,
  className 
}: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [escolas, setEscolas] = useState<Escola[]>([]);
  const [aaps, setAaps] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();

      const [escolasRes, userProgramasRes, profilesRes, roleRes] = await Promise.all([
        supabase.from('escolas').select('id, nome, programa').eq('ativa', true).order('nome'),
        supabase.from('user_programas').select('user_id, programa'),
        supabase.from('profiles_directory').select('id, nome').order('nome'),
        user ? supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null } as any),
      ]);

      const allProgramRows = userProgramasRes.data || [];
      const atorUserIds = [...new Set(allProgramRows.map(r => r.user_id))];
      let atorProfiles = (profilesRes.data || [])
        .filter(p => atorUserIds.includes(p.id!))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));

      const role = (roleRes as any)?.data?.role as string | undefined;
      const isAdmin = role === 'admin';
      const isManagerScope = role === 'gestor' || role === 'n3_coordenador_programa';
      const isObserverScope = role === 'n8_equipe_tecnica';
      const isOperationalOrLocal = ['n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica', 'n6_coord_pedagogico', 'n7_professor'].includes(role || '');

      let escolasFiltered = (escolasRes.data || []) as any[];

      if (user && !isAdmin) {
        const myProgs = allProgramRows.filter(r => r.user_id === user.id).map(r => (r as any).programa);

        if (isManagerScope || isObserverScope) {
          escolasFiltered = escolasFiltered.filter(e =>
            (e.programa || []).some((p: string) => myProgs.includes(p))
          );
        } else if (isOperationalOrLocal) {
          const { data: ents } = await supabase
            .from('user_entidades')
            .select('escola_id')
            .eq('user_id', user.id);
          const ids = new Set((ents || []).map(e => e.escola_id));
          escolasFiltered = escolasFiltered.filter(e => ids.has(e.id));
        }

        if (isManagerScope) {
          const allowed = new Set(
            allProgramRows.filter(r => myProgs.includes((r as any).programa)).map(r => r.user_id)
          );
          atorProfiles = atorProfiles.filter(p => allowed.has(p.id!));
        } else {
          atorProfiles = atorProfiles.filter(p => p.id === user.id);
        }
      }

      setEscolas(escolasFiltered.map(e => ({ id: e.id, nome: e.nome })));

      setAaps(atorProfiles);

      setLoading(false);
    };

    fetchData();
  }, []);

  const hasActiveFilters = filters.segmento !== 'todos' || 
    filters.componente !== 'todos' || 
    filters.escolaId !== 'todos' || 
    filters.aapId !== 'todos';

  const clearFilters = () => {
    onFilterChange({
      segmento: 'todos',
      componente: 'todos',
      escolaId: 'todos',
      aapId: 'todos',
    });
  };

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-3">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors",
            hasActiveFilters 
              ? "border-primary bg-primary/5 text-primary" 
              : "border-border hover:bg-muted"
          )}
        >
          <Filter size={18} />
          <span className="text-sm font-medium">Filtros</span>
          {hasActiveFilters && (
            <span className="w-5 h-5 rounded-full bg-primary text-primary-foreground text-xs flex items-center justify-center">
              !
            </span>
          )}
        </button>
        
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
          >
            <X size={16} />
            Limpar filtros
          </button>
        )}
      </div>

      {isOpen && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-card rounded-xl border border-border animate-scale-in">
          <div>
            <label className="form-label text-xs">Segmento</label>
            <select
              value={filters.segmento || 'todos'}
              onChange={(e) => onFilterChange({ ...filters, segmento: e.target.value as Segmento | 'todos' })}
              className="input-field text-sm py-2"
            >
              <option value="todos">Todos</option>
              {Object.entries(segmentoLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="form-label text-xs">Componente</label>
            <select
              value={filters.componente || 'todos'}
              onChange={(e) => onFilterChange({ ...filters, componente: e.target.value as ComponenteCurricular | 'todos' })}
              className="input-field text-sm py-2"
            >
              <option value="todos">Todos</option>
              {Object.entries(componenteLabels).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>

          {showEscola && (
            <div>
              <label className="form-label text-xs">Escola</label>
              <select
                value={filters.escolaId || 'todos'}
                onChange={(e) => onFilterChange({ ...filters, escolaId: e.target.value })}
                className="input-field text-sm py-2"
                disabled={loading}
              >
                <option value="todos">Todas</option>
                {escolas.map((escola) => (
                  <option key={escola.id} value={escola.id}>{escola.nome}</option>
                ))}
              </select>
            </div>
          )}

          {showAAP && (
            <div>
              <label className="form-label text-xs">Ator do Programa</label>
              <select
                value={filters.aapId || 'todos'}
                onChange={(e) => onFilterChange({ ...filters, aapId: e.target.value })}
                className="input-field text-sm py-2"
                disabled={loading}
              >
                <option value="todos">Todos</option>
                {aaps.map((aap) => (
                  <option key={aap.id} value={aap.id}>{aap.nome}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
