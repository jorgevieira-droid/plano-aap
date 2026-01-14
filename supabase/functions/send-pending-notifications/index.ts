import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface PendingAction {
  id: string;
  data: string;
  tipo: string;
  escola_nome: string;
  dias_atraso: number;
}

interface AAPNotification {
  aap_id: string;
  aap_nome: string;
  aap_email: string;
  pendentes: PendingAction[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting pending notifications check...");

    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    // Fetch all pending registros (agendados há mais de 2 dias)
    const { data: registros, error: registrosError } = await supabase
      .from('registros_acao')
      .select('id, data, tipo, escola_id, aap_id, status')
      .eq('status', 'agendada')
      .lte('data', twoDaysAgoStr);

    if (registrosError) {
      console.error("Error fetching registros:", registrosError);
      throw registrosError;
    }

    if (!registros || registros.length === 0) {
      console.log("No pending actions found");
      return new Response(
        JSON.stringify({ message: "Nenhuma ação pendente encontrada" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Found ${registros.length} pending registros`);

    // Fetch escolas for names
    const escolaIds = [...new Set(registros.map(r => r.escola_id))];
    const { data: escolas } = await supabase
      .from('escolas')
      .select('id, nome')
      .in('id', escolaIds);

    const escolaMap = new Map(escolas?.map(e => [e.id, e.nome]) || []);

    // Fetch AAP profiles
    const aapIds = [...new Set(registros.map(r => r.aap_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .in('id', aapIds);

    const profileMap = new Map(profiles?.map(p => [p.id, { nome: p.nome, email: p.email }]) || []);

    // Group pending actions by AAP
    const today = new Date();
    const aapNotifications: Map<string, AAPNotification> = new Map();

    for (const reg of registros) {
      const dataAgendada = new Date(reg.data);
      const diasAtraso = Math.floor((today.getTime() - dataAgendada.getTime()) / (1000 * 60 * 60 * 24));
      
      const aapProfile = profileMap.get(reg.aap_id);
      if (!aapProfile) continue;

      const pendingAction: PendingAction = {
        id: reg.id,
        data: reg.data,
        tipo: reg.tipo,
        escola_nome: escolaMap.get(reg.escola_id) || 'Escola não encontrada',
        dias_atraso: diasAtraso,
      };

      if (aapNotifications.has(reg.aap_id)) {
        aapNotifications.get(reg.aap_id)!.pendentes.push(pendingAction);
      } else {
        aapNotifications.set(reg.aap_id, {
          aap_id: reg.aap_id,
          aap_nome: aapProfile.nome,
          aap_email: aapProfile.email,
          pendentes: [pendingAction],
        });
      }
    }

    console.log(`Sending notifications to ${aapNotifications.size} AAPs`);

    // Send emails to each AAP
    const emailResults = [];
    for (const [aapId, notification] of aapNotifications) {
      const pendentesHtml = notification.pendentes
        .sort((a, b) => b.dias_atraso - a.dias_atraso)
        .map(p => `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 12px; color: #374151;">${p.tipo}</td>
            <td style="padding: 12px; color: #374151;">${p.escola_nome}</td>
            <td style="padding: 12px; color: #374151;">${new Date(p.data).toLocaleDateString('pt-BR')}</td>
            <td style="padding: 12px;">
              <span style="background-color: ${p.dias_atraso > 5 ? '#fee2e2' : '#fef3c7'}; 
                          color: ${p.dias_atraso > 5 ? '#dc2626' : '#d97706'}; 
                          padding: 4px 8px; 
                          border-radius: 4px; 
                          font-weight: 600;">
                ${p.dias_atraso} ${p.dias_atraso === 1 ? 'dia' : 'dias'}
              </span>
            </td>
          </tr>
        `)
        .join('');

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <title>Ações Pendentes - Parceiros Educacionais</title>
        </head>
        <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
          <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background-color: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">Parceiros Educacionais</h1>
              <p style="color: #93c5fd; margin: 10px 0 0 0;">Sistema de Gestão</p>
            </div>
            
            <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #1e3a5f; margin-top: 0;">Olá, ${notification.aap_nome}!</h2>
              
              <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                <p style="margin: 0; color: #92400e; font-weight: 600;">
                  ⚠️ Você tem ${notification.pendentes.length} ${notification.pendentes.length === 1 ? 'ação pendente' : 'ações pendentes'} há mais de 2 dias
                </p>
              </div>
              
              <p style="color: #6b7280; line-height: 1.6;">
                As ações abaixo foram agendadas e ainda não tiveram seus registros atualizados. 
                Por favor, acesse o sistema para atualizar o status dessas atividades.
              </p>
              
              <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                <thead>
                  <tr style="background-color: #f3f4f6;">
                    <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Tipo</th>
                    <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Escola</th>
                    <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Data</th>
                    <th style="padding: 12px; text-align: left; color: #374151; font-weight: 600;">Atraso</th>
                  </tr>
                </thead>
                <tbody>
                  ${pendentesHtml}
                </tbody>
              </table>
              
              <div style="text-align: center; margin-top: 30px;">
                <a href="https://parceiroseducacionais.lovable.app" 
                   style="display: inline-block; 
                          background-color: #1e3a5f; 
                          color: white; 
                          padding: 14px 28px; 
                          text-decoration: none; 
                          border-radius: 8px; 
                          font-weight: 600;">
                  Acessar o Sistema
                </a>
              </div>
              
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
                Este é um e-mail automático. Por favor, não responda.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Acompanhamento AAPs <noreply@acompanhamento-aaps.org>",
            to: [notification.aap_email],
            subject: `⚠️ Você tem ${notification.pendentes.length} ${notification.pendentes.length === 1 ? 'ação pendente' : 'ações pendentes'} - Parceiros Educacionais`,
            html: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();
        
        if (!emailResponse.ok) {
          throw new Error(emailData.message || "Failed to send email");
        }

        console.log(`Email sent to ${notification.aap_email}:`, emailData);
        emailResults.push({ aap_id: aapId, email: notification.aap_email, status: "sent", response: emailData });
      } catch (emailError: any) {
        console.error(`Error sending email to ${notification.aap_email}:`, emailError);
        emailResults.push({ aap_id: aapId, email: notification.aap_email, status: "error", error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Notificações processadas`, 
        total_aaps: aapNotifications.size,
        total_pendentes: registros.length,
        results: emailResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-pending-notifications function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
