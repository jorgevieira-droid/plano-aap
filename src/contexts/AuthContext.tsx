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
  isManager: boolean;      // N1, N2, N3
  isOperational: boolean;  // N4.1, N4.2, N5, legacy AAPs
  isLocal: boolean;        // N6, N7
  isObserver: boolean;     // N8
  hasRole: (role: AppRole) => boolean;
  mustChangePassword: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const roleTier = getRoleTier(profile?.role);
  const isAdmin = profile?.role === 'admin';
  const isGestor = profile?.role === 'gestor';
  const isAAP = OPERATIONAL_ROLES.includes(profile?.role as AppRole);
  const isAdminOrGestor = isAdmin || isGestor;
  const isManager = roleTier === 'admin' || roleTier === 'manager';
  const isOperational = roleTier === 'operational';
  const isLocal = roleTier === 'local';
  const isObserver = roleTier === 'observer';
  const mustChangePassword = profile?.mustChangePassword || false;

  const hasRole = useCallback((role: AppRole) => profile?.role === role, [profile?.role]);

  return (
    <AuthContext.Provider value={{ 
      user, session, profile,
      isAuthenticated: !!user, 
      isLoading,
      login, logout,
      isAdmin, isGestor, isAAP, isAdminOrGestor,
      roleTier, isManager, isOperational, isLocal, isObserver, hasRole,
      mustChangePassword, refreshProfile,
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