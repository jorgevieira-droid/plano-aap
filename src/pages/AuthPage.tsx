import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Eye, EyeOff, LogIn, UserPlus, Shield, KeyRound, ArrowLeft, Mail } from 'lucide-react';
import { validatePassword } from '@/lib/passwordValidation';
import { PasswordRequirements } from '@/components/auth/PasswordRequirements';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const [mode, setMode] = useState<'login' | 'setup' | 'forgot' | 'reset'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nome, setNome] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasAdmin, setHasAdmin] = useState<boolean | null>(null);
  const [resetEmailSent, setResetEmailSent] = useState(false);
  const {
    login,
    isAuthenticated,
    isLoading
  } = useAuth();
  const navigate = useNavigate();
  useEffect(() => {
    checkForAdmin();
    // Check if user is coming from password reset link
    const type = searchParams.get('type');
    if (type === 'recovery') {
      setMode('reset');
    }
  }, [searchParams]);
  useEffect(() => {
    if (isAuthenticated && !isLoading && mode !== 'reset') {
      navigate('/dashboard');
    }
  }, [isAuthenticated, isLoading, navigate, mode]);
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
        setHasAdmin(true);
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
  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Digite seu email');
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth?type=recovery`
      });
      if (error) {
        toast.error(error.message);
      } else {
        setResetEmailSent(true);
        toast.success('Email de recuperação enviado!');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao enviar email de recuperação');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    setIsSubmitting(true);
    try {
      const {
        error
      } = await supabase.auth.updateUser({
        password
      });
      if (error) {
        toast.error(error.message);
      } else {
        toast.success('Senha alterada com sucesso!');
        setMode('login');
        setPassword('');
        setConfirmPassword('');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Erro ao alterar senha');
    } finally {
      setIsSubmitting(false);
    }
  };
  const handleSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !nome) {
      toast.error('Preencha todos os campos');
      return;
    }
    const validation = validatePassword(password);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    setIsSubmitting(true);
    try {
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
      await new Promise(resolve => setTimeout(resolve, 1000));
      await supabase.from('profiles').update({
        nome
      }).eq('id', signUpData.user.id);
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
  const getIcon = () => {
    switch (mode) {
      case 'setup':
        return <Shield className="w-8 h-8 text-primary" />;
      case 'forgot':
        return <Mail className="w-8 h-8 text-primary" />;
      case 'reset':
        return <KeyRound className="w-8 h-8 text-primary" />;
      default:
        return <LogIn className="w-8 h-8 text-primary" />;
    }
  };
  const getTitle = () => {
    switch (mode) {
      case 'setup':
        return 'Configure o primeiro administrador';
      case 'forgot':
        return 'Recuperar senha';
      case 'reset':
        return 'Definir nova senha';
      default:
        return 'Entre com suas credenciais';
    }
  };
  return <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-4 mb-4">
              <img src="/pe-logo-vertical.png" alt="Parceiros da Educação" className="h-24" />
              <img src="/logo-bussola-vertical.png" alt="Bússola" className="h-24" />
            </div>
            <h1 className="text-xl font-bold text-foreground">Bússola</h1>
            <p className="text-muted-foreground mt-2">{getTitle()}</p>
          </div>

          {mode === 'login' && <form onSubmit={handleLogin} className="space-y-4">
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
              <button type="button" onClick={() => {
            setMode('forgot');
            setResetEmailSent(false);
          }} className="w-full text-center text-sm text-primary hover:underline">
                Esqueci minha senha
              </button>
            </form>}

          {mode === 'forgot' && <div className="space-y-4">
              {resetEmailSent ? <div className="text-center space-y-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-muted-foreground">
                    Enviamos um email para <strong>{email}</strong> com instruções para recuperar sua senha.
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Verifique sua caixa de entrada e spam.
                  </p>
                </div> : <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div>
                    <label htmlFor="email" className="form-label">
                      Email
                    </label>
                    <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} className="input-field" placeholder="seu@email.com" disabled={isSubmitting} required />
                  </div>
                  <button type="submit" disabled={isSubmitting} className="btn-primary w-full flex items-center justify-center gap-2">
                    {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                        <Mail size={18} />
                        Enviar email de recuperação
                      </>}
                  </button>
                </form>}
              <button type="button" onClick={() => {
            setMode('login');
            setResetEmailSent(false);
          }} className="w-full text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft size={14} />
                Voltar para login
              </button>
            </div>}

          {mode === 'reset' && <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label htmlFor="password" className="form-label">
                  Nova senha
                </label>
                <div className="relative">
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="Digite sua nova senha" disabled={isSubmitting} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <div>
                <label htmlFor="confirmPassword" className="form-label">
                  Confirmar nova senha
                </label>
                <div className="relative">
                  <input id="confirmPassword" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className="input-field pr-10" placeholder="Repita a senha" disabled={isSubmitting} required />
                </div>
              </div>
              <PasswordRequirements password={password} />
              <button type="submit" disabled={isSubmitting || !validatePassword(password).isValid} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                    <KeyRound size={18} />
                    Alterar senha
                  </>}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft size={14} />
                Voltar para login
              </button>
            </form>}

          {mode === 'setup' && <form onSubmit={handleSetup} className="space-y-4">
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
                  <input id="password" type={showPassword ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="input-field pr-10" placeholder="Digite sua senha" disabled={isSubmitting} required />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
              <PasswordRequirements password={password} />
              <button type="submit" disabled={isSubmitting || !validatePassword(password).isValid} className="btn-primary w-full flex items-center justify-center gap-2">
                {isSubmitting ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div> : <>
                    <Shield size={18} />
                    Criar Administrador
                  </>}
              </button>
              <button type="button" onClick={() => setMode('login')} className="w-full text-center text-sm text-muted-foreground hover:text-foreground flex items-center justify-center gap-1">
                <ArrowLeft size={14} />
                Voltar para login
              </button>
            </form>}
        </div>
      </div>
    </div>;
}