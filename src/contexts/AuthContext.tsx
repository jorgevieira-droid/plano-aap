import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 
  | 'admin' 
  | 'gestor' 
  | 'n3_coordenador_programa'
  | 'n4_1_cped'
  | 'n4_2_gpi'
  | 'n5_formador'
  | 'n6_coord_pedagogico'
  | 'n7_professor'
  | 'n8_equipe_tecnica'
  // Legacy roles (kept for compatibility)
  | 'aap_inicial' 
  | 'aap_portugues' 
  | 'aap_matematica';

export type ProgramaType = 'escolas' | 'regionais' | 'redes_municipais';

export interface UserProfile {
  id: string;
  nome: string;
  email: string;
  telefone?: string;
  role: AppRole;
  programas?: ProgramaType[];
  entidadeIds?: string[];
  mustChangePassword?: boolean;
  segmento?: string | null;
  componente?: string | null;
}

// Role tier helpers
const MANAGER_ROLES: AppRole[] = ['admin', 'gestor', 'n3_coordenador_programa'];
const OPERATIONAL_ROLES: AppRole[] = ['n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica'];
const LOCAL_ROLES: AppRole[] = ['n6_coord_pedagogico', 'n7_professor'];
const OBSERVER_ROLES: AppRole[] = ['n8_equipe_tecnica'];

export type RoleTier = 'admin' | 'manager' | 'operational' | 'local' | 'observer';

function getRoleTier(role: AppRole | undefined): RoleTier {
  if (!role) return 'local';
  if (role === 'admin') return 'admin';
  if (MANAGER_ROLES.includes(role)) return 'manager';
  if (OPERATIONAL_ROLES.includes(role)) return 'operational';
  if (LOCAL_ROLES.includes(role)) return 'local';
  if (OBSERVER_ROLES.includes(role)) return 'observer';
  return 'local';
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  // Legacy booleans (kept for compatibility)
  isAdmin: boolean;
  isGestor: boolean;
  isAAP: boolean;
  isAdminOrGestor: boolean;
  // New role tier helpers
  roleTier: RoleTier;
  isManager: boolean;
  isOperational: boolean;
  isLocal: boolean;
  isObserver: boolean;
  hasRole: (role: AppRole) => boolean;
  mustChangePassword: boolean;
  refreshProfile: () => Promise<void>;
  // Role simulation (admin only)
  isRealAdmin: boolean;
  isSimulating: boolean;
  simulatedRole: AppRole | null;
  setSimulatedRole: (role: AppRole | null) => void;
  simulatedPrograma: ProgramaType | null;
  setSimulatedPrograma: (programa: ProgramaType | null) => void;
  effectiveProgramas: ProgramaType[] | undefined;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [simulatedRole, setSimulatedRoleState] = useState<AppRole | null>(null);
  const [simulatedPrograma, setSimulatedPrograma] = useState<ProgramaType | null>(null);

  const setSimulatedRole = useCallback((role: AppRole | null) => {
    setSimulatedRoleState(role);
    if (role === null) setSimulatedPrograma(null);
  }, []);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      // Fetch profile, role, programas and entidades in parallel
      const [profileResult, roleResult, programasResult, entidadesResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId).maybeSingle(),
        supabase.from('user_programas').select('programa').eq('user_id', userId),
        supabase.from('user_entidades').select('escola_id').eq('user_id', userId),
      ]);

      if (profileResult.error) {
        console.error('Error fetching profile:', profileResult.error);
        return null;
      }

      const programas = programasResult.data?.map(p => p.programa as ProgramaType) || [];
      const entidadeIds = entidadesResult.data?.map(e => e.escola_id) || [];

      if (profileResult.data) {
        return {
          id: profileResult.data.id,
          nome: profileResult.data.nome,
          email: profileResult.data.email,
          telefone: profileResult.data.telefone || undefined,
          role: (roleResult.data?.role as AppRole) || 'n7_professor',
          programas: programas.length > 0 ? programas : undefined,
          entidadeIds: entidadeIds.length > 0 ? entidadeIds : undefined,
          mustChangePassword: profileResult.data.must_change_password || false,
          segmento: (profileResult.data as any).segmento || null,
          componente: (profileResult.data as any).componente || null,
        };
      }

      return null;
    } catch (error) {
      console.error('Error in fetchProfile:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          setTimeout(() => {
            fetchProfile(session.user.id).then(setProfile);
          }, 0);

          // Log access on sign in
          if (event === 'SIGNED_IN') {
            supabase.from('user_access_log').insert({ user_id: session.user.id }).then(({ error }) => {
              if (error) console.error('Error logging access:', error);
            });
          }
        } else {
          setProfile(null);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchProfile(session.user.id).then((profileData) => {
          setProfile(profileData);
          setIsLoading(false);
        });
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error: error.message };
      return { error: null };
    } catch (error) {
      console.error('Login error:', error);
      return { error: 'Erro ao fazer login' };
    }
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const profileData = await fetchProfile(user.id);
      setProfile(profileData);
    }
  }, [user, fetchProfile]);

  // Real role from profile
  const isRealAdmin = profile?.role === 'admin';
  const isSimulating = isRealAdmin && simulatedRole !== null;

  // Effective role: simulated if active, otherwise real
  const effectiveRole = isSimulating ? simulatedRole! : profile?.role;
  const roleTier = getRoleTier(effectiveRole);
  const isAdmin = effectiveRole === 'admin';
  const isGestor = effectiveRole === 'gestor';
  const isAAP = OPERATIONAL_ROLES.includes(effectiveRole as AppRole);
  const isAdminOrGestor = isAdmin || isGestor;
  const isManager = roleTier === 'admin' || roleTier === 'manager';
  const isOperational = roleTier === 'operational';
  const isLocal = roleTier === 'local';
  const isObserver = roleTier === 'observer';
  const mustChangePassword = profile?.mustChangePassword || false;

  const hasRole = useCallback((role: AppRole) => effectiveRole === role, [effectiveRole]);

  return (
    <AuthContext.Provider value={{ 
      user, session, profile,
      isAuthenticated: !!user, 
      isLoading,
      login, logout,
      isAdmin, isGestor, isAAP, isAdminOrGestor,
      roleTier, isManager, isOperational, isLocal, isObserver, hasRole,
      mustChangePassword, refreshProfile,
      isRealAdmin, isSimulating, simulatedRole, setSimulatedRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}