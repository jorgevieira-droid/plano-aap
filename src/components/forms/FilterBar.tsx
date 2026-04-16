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
      
      const [escolasRes, userProgramasRes, profilesRes] = await Promise.all([
        supabase.from('escolas').select('id, nome').eq('ativa', true).order('nome'),
        supabase.from('user_programas').select('user_id'),
        supabase.from('profiles_directory').select('id, nome').order('nome')
      ]);
      
      setEscolas(escolasRes.data || []);
      
      // Filter profiles to only include users with programas linked
      const atorUserIds = [...new Set((userProgramasRes.data || []).map(r => r.user_id))];
      const atorProfiles = (profilesRes.data || [])
        .filter(p => atorUserIds.includes(p.id!))
        .sort((a, b) => (a.nome || '').localeCompare(b.nome || '', 'pt-BR', { sensitivity: 'base' }));
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
