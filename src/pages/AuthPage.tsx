import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Shield } from 'lucide-react';
export default function AuthPage() {
  const [mode, setMode] = useState<'login' | 'setup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const {
    login,
    isAuthenticated,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    checkForAdmin();
  }, []);
  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate]);
  const checkForAdmin = async () => {
    try {
      const {
        count,
        error
      } = await supabase.from('user_roles').select('*', {
        count: 'exact',
        head: true
      }).eq('role', 'admin');
      if (error) {
        console.error('Error checking admin:', error);
        setHasAdmin(true); // Assume exists on error
        return;
      }
      setHasAdmin((count ?? 0) > 0);
    } catch (error) {
      console.error('Error:', error);
      setHasAdmin(true);
    }
  };
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Preencha todos os campos');
      return;
    }
    setIsSubmitting(true);
    const {
      error
    } = await login(email, password);
    if (error) {
      toast.error(error);
    } else {
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    }
    setIsSubmitting(false);
  };
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }
    setIsSubmitting(true);
    try {
      // Create the user account
      const {
        data: signUpData,
        error: signUpError
      } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            nome
          }
        }
      });
      if (signUpError) {
        toast.error(signUpError.message);
        setIsSubmitting(false);
        return;
      }
      if (!signUpData.user) {
        toast.error('Erro ao criar usuário');
        setIsSubmitting(false);
        return;
      }

      // Wait a moment for the trigger to create the profile
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update profile with name
      await supabase.from('profiles').update({
        nome
      }).eq('id', signUpData.user.id);

      // Make this user an admin (using the setup function)
      const {
        data: setupResult,
        error: setupError
      } = await supabase.rpc('setup_first_admin', {
        user_email: email
      });
      if (setupError) {
        console.error('Setup admin error:', setupError);
        toast.error('Erro ao configurar administrador');
        setIsSubmitting(false);
        return;
      }
      if (!setupResult) {
        toast.error('Já existe um administrador cadastrado');
        setMode('login');
        setIsSubmitting(false);
        return;
      }
      toast.success('Administrador configurado com sucesso! Faça login.');
      setMode('login');
      setPassword('');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao criar conta');
    } finally {
      setIsSubmitting(false);
    }
  };
  if (isLoading || hasAdmin === null) {
    return <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>;
  }
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              {mode === 'setup' ? <Shield className="w-8 h-8 text-primary" /> : <LogIn className="w-8 h-8 text-primary" />}
            </div>
            <h1 className="text-2xl font-bold text-foreground">Programa Escolas
Acompanhamento AAPs 
  
          </h1>
            <p className="text-muted-foreground mt-2">
              {mode === 'setup' ? 'Configure o primeiro administrador' : 'Entre com suas credenciais'}
            </p>
          </div>

          {mode === 'login' ? <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" disabled={isSubmitting} />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="••••••••" disabled={isSubmitting} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                    <LogIn size={18} />
                    Entrar
                  </>}
              </button>

              {!hasAdmin && <button type="button" onClick={() => setMode('setup')} className="w-full text-center text-sm text-primary hover:underline mt-4">
                  <UserPlus size={14} className="inline mr-1" />
                  Configurar primeiro administrador
                </button>}
            </form> : <form onSubmit={handleSetup} className="space-y-4">
              <div>
                <label htmlFor="nome" className="form-label">
                  Nome completo
                </label>
                <input id="nome" type="text" value={nome} onChange={e => setNome(e.target.value)} className="input-field" placeholder="Seu nome" disabled={isSubmitting} required />
              </div>

              <div>
                <label htmlFor="email" className="form-label">
                  Email
                </label>
                <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" disabled={isSubmitting} required />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Senha
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="Mínimo 6 caracteres" disabled={isSubmitting} minLength={6} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                    <Shield size={18} />
                    Criar Administrador
                  </>}
              </button>

              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground mt-4">
                Voltar para login
              </button>
            </form>}
        </div>
      </div>
    </div>;
}