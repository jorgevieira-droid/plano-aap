import { useState } from 'react';
import { Loader2, KeyRound, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { validatePassword } from '@/lib/passwordValidation';
import { PasswordRequirements } from './PasswordRequirements';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface ForcePasswordChangeDialogProps {
  open: boolean;
  onSuccess: () => void;
  userName?: string;
}

export function ForcePasswordChangeDialog({ open, onSuccess, userName }: ForcePasswordChangeDialogProps) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast.error('Preencha todos os campos');
      return;
    }
    
    const validation = validatePassword(newPassword);
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }
    
    if (newPassword !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Refresh session to ensure token is valid before updating
      const { error: refreshError } = await supabase.auth.refreshSession();
      if (refreshError) {
        console.error('Session refresh failed:', refreshError);
        toast.error('Sessão expirada. Faça login novamente.');
        return;
      }

      // Update password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      
      if (updateError) {
        const errAny = updateError as any;
        const code = errAny?.code || '';
        const msg = updateError.message || '';
        const status = updateError.status;
        
        console.error('Password update error:', { code, message: msg, status, full: errAny });

        if (code === 'same_password' || msg.includes('same_password') || msg.includes('should be different')) {
          toast.error('A nova senha deve ser diferente da senha atual.');
        } else if (code === 'weak_password' || msg.includes('weak_password') || msg.includes('at least')) {
          toast.error('A senha não atende aos requisitos do servidor. Tente uma senha mais longa ou complexa.');
        } else if (status === 422) {
          toast.error(msg || 'Erro de validação ao alterar a senha.');
        } else if (status === 403 || msg.includes('session')) {
          toast.error('Sessão expirada. Faça login novamente.');
        } else {
          toast.error(msg || 'Erro ao alterar a senha.');
        }
        return;
      }
      
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // Update must_change_password flag
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ must_change_password: false })
          .eq('id', user.id);
        
        if (profileError) {
          console.error('Error updating profile:', profileError);
        }
      }
      
      toast.success('Senha alterada com sucesso!');
      setNewPassword('');
      setConfirmPassword('');
      onSuccess();
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error?.message || 'Erro ao alterar a senha. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md" hideCloseButton>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="w-5 h-5 text-primary" />
            Alteração de Senha Obrigatória
          </DialogTitle>
          <DialogDescription className="flex items-start gap-2 pt-2">
            <AlertTriangle className="w-4 h-4 text-warning mt-0.5 shrink-0" />
            <span>
              {userName ? `Olá ${userName}! ` : ''}
              Por questões de segurança, você precisa alterar sua senha no primeiro acesso.
            </span>
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <Label htmlFor="newPassword">Nova Senha</Label>
            <div className="relative">
              <Input
                id="newPassword"
                type={showNewPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <div>
            <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="confirmPassword"
                type={showConfirmPassword ? 'text' : 'password'}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Digite a senha novamente"
                autoComplete="new-password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <PasswordRequirements password={newPassword} />
          
          <Button type="submit" disabled={isSubmitting || !validatePassword(newPassword).isValid} className="w-full">
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              'Alterar Senha'
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
