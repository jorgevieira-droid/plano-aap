import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, MailX, CheckCircle2, AlertCircle } from 'lucide-react';

type Status = 'loading' | 'valid' | 'already_unsubscribed' | 'invalid' | 'success' | 'error';

export default function UnsubscribePage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<Status>('loading');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      return;
    }
    const validate = async () => {
      try {
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const res = await fetch(
          `${supabaseUrl}/functions/v1/handle-email-unsubscribe?token=${token}`,
          { headers: { apikey: anonKey } }
        );
        const data = await res.json();
        if (!res.ok) {
          setStatus('invalid');
        } else if (data.valid === false && data.reason === 'already_unsubscribed') {
          setStatus('already_unsubscribed');
        } else if (data.valid) {
          setStatus('valid');
        } else {
          setStatus('invalid');
        }
      } catch {
        setStatus('error');
      }
    };
    validate();
  }, [token]);

  const handleUnsubscribe = async () => {
    if (!token) return;
    setProcessing(true);
    try {
      const { error } = await supabase.functions.invoke('handle-email-unsubscribe', {
        body: { token },
      });
      if (error) throw error;
      setStatus('success');
    } catch {
      setStatus('error');
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center space-y-4">
          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto h-10 w-10 animate-spin text-primary" />
              <p className="text-muted-foreground">Validando solicitação...</p>
            </>
          )}

          {status === 'valid' && (
            <>
              <MailX className="mx-auto h-10 w-10 text-warning" />
              <h2 className="text-lg font-semibold">Cancelar Inscrição</h2>
              <p className="text-sm text-muted-foreground">
                Deseja cancelar o recebimento de e-mails do sistema?
              </p>
              <Button onClick={handleUnsubscribe} disabled={processing} className="w-full">
                {processing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Confirmar Cancelamento
              </Button>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
              <h2 className="text-lg font-semibold">Inscrição Cancelada</h2>
              <p className="text-sm text-muted-foreground">
                Você não receberá mais e-mails do sistema.
              </p>
            </>
          )}

          {status === 'already_unsubscribed' && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Já Cancelado</h2>
              <p className="text-sm text-muted-foreground">
                Sua inscrição já foi cancelada anteriormente.
              </p>
            </>
          )}

          {status === 'invalid' && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">Link Inválido</h2>
              <p className="text-sm text-muted-foreground">
                Este link de cancelamento é inválido ou expirou.
              </p>
            </>
          )}

          {status === 'error' && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
              <h2 className="text-lg font-semibold">Erro</h2>
              <p className="text-sm text-muted-foreground">
                Ocorreu um erro ao processar sua solicitação. Tente novamente.
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
