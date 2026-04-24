import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const NOTIFICATION_SECRET_KEY = Deno.env.get("NOTIFICATION_SECRET_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface PendingAction {
  id: string;
  data: string;
  tipo: string;
  escola_nome: string;
  dias_atraso: number;
  programa: string[] | null;
  aap_nome?: string;
}

interface AAPNotification {
  aap_id: string;
  aap_nome: string;
  aap_email: string;
  pendentes: PendingAction[];
}

interface N3Notification {
  user_id: string;
  nome: string;
  email: string;
  programas: string[];
  pendentes: PendingAction[];
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  let registroId: string | null = null;

  if (req.method === 'POST') {
    try {
      const body = await req.json();
      registroId = typeof body?.registroId === 'string' && body.registroId.trim()
        ? body.registroId.trim()
        : null;
    } catch (_) {
      registroId = null;
    }
  }

  // Check for secret key (for cron/automated calls) OR JWT token (for authorized user calls)
  const providedKey = req.headers.get('x-secret-key');
  const authHeader = req.headers.get('Authorization');

  let isAuthorized = false;
  let requestingUserId: string | null = null;
  let requestingRole: string | null = null;
  let requestingProgramas: string[] = [];

  // Option 1: Secret key authentication (for cron jobs)
  if (providedKey && providedKey === NOTIFICATION_SECRET_KEY) {
    isAuthorized = true;
  }

  // Option 2: JWT token authentication (for admin, gestor, or n3 users)
  if (!isAuthorized && authHeader?.startsWith('Bearer ')) {
    const token = authHeader.replace('Bearer ', '').trim();

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    if (!anonKey) {
      console.error('Unauthorized: missing SUPABASE_ANON_KEY env');
    } else {
      const authClient = createClient(supabaseUrl, anonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
        auth: { autoRefreshToken: false, persistSession: false },
      });

      const { data: userData, error: userError } = await authClient.auth.getUser();
      const userId = userData?.user?.id;

      if (userError || !userId) {
        console.error('Unauthorized: invalid JWT', userError?.message ?? 'missing user');
      } else {
        const { data: roleData, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .in('role', ['admin', 'gestor', 'n3_coordenador_programa'])
          .maybeSingle();

        if (!roleError && roleData) {
          isAuthorized = true;
          requestingUserId = userId;
          requestingRole = roleData.role;

          const { data: programasData, error: programasError } = await supabase
            .from('user_programas')
            .select('programa')
            .eq('user_id', userId);

          if (programasError) {
            console.error('Program scope check failed', programasError.message);
          } else {
            requestingProgramas = (programasData || []).map((p: any) => p.programa).filter(Boolean);
          }
        } else if (roleError) {
          console.error('Unauthorized: role check failed', roleError.message);
        }
      }
    }
  }

  if (!isAuthorized) {
    return new Response(
      JSON.stringify({ success: false, error: 'Unauthorized', code: 'unauthorized' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Rate limit: 3 calls per minute (covers both cron and manual triggers)
  const rateLimitKey = providedKey ? 'notifications:cron' : `notifications:${authHeader?.slice(0, 20)}`;
  if (!checkRateLimit(rateLimitKey, 3, 60_000)) {
    return new Response(
      JSON.stringify({ error: 'Limite de requisições excedido. Aguarde um momento.' }),
      { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    console.log("Starting pending notifications check...");

    // Calculate date 2 days ago
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    const twoDaysAgoStr = twoDaysAgo.toISOString().split('T')[0];

    // Fetch all pending registros (agendados ou reagendados)
    const { data: allRegistros, error: registrosError } = await supabase
      .from('registros_acao')
      .select('id, data, tipo, escola_id, aap_id, status, reagendada_para, programa')
      .in('status', ['agendada', 'reagendada']);

    if (registrosError) {
      console.error("Error fetching registros:", registrosError);
      throw registrosError;
    }

    // Filter registros based on the correct date field
    let registros = (allRegistros || []).filter(r => {
      const relevantDate = r.status === 'reagendada' && r.reagendada_para 
        ? r.reagendada_para 
        : r.data;
      return relevantDate <= twoDaysAgoStr;
    });

    if (registroId) {
      registros = registros.filter(r => r.id === registroId);

      if (registros.length === 0) {
        return new Response(
          JSON.stringify({ success: false, code: 'not_pending', error: 'Esta ação não está mais pendente.' }),
          { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!providedKey && requestingRole !== 'admin') {
        const canAccessRegistro = registros.some((r: any) =>
          Array.isArray(r.programa) && r.programa.some((p: string) => requestingProgramas.includes(p))
        );

        if (!requestingUserId || !canAccessRegistro) {
          return new Response(
            JSON.stringify({ success: false, code: 'forbidden', error: 'Você não tem permissão para enviar esta pendência.' }),
            { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
      }
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
      const relevantDateStr = reg.status === 'reagendada' && reg.reagendada_para 
        ? reg.reagendada_para 
        : reg.data;
      const dataAgendada = new Date(relevantDateStr);
      const diasAtraso = Math.floor((today.getTime() - dataAgendada.getTime()) / (1000 * 60 * 60 * 24));
      
      const aapProfile = profileMap.get(reg.aap_id);
      if (!aapProfile) continue;

      const pendingAction: PendingAction = {
        id: reg.id,
        data: relevantDateStr,
        tipo: reg.tipo,
        escola_nome: escolaMap.get(reg.escola_id) || 'Escola não encontrada',
        dias_atraso: diasAtraso,
        programa: reg.programa,
        aap_nome: aapProfile.nome,
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

    const logoUrl = 'https://acompanhamento-aaps.lovable.app/pe-logo-branco.png';
    const emailResults = [];

    // --- Send emails to each AAP (existing behavior) ---
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
                          padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                ${p.dias_atraso} ${p.dias_atraso === 1 ? 'dia' : 'dias'}
              </span>
            </td>
          </tr>
        `).join('');

      const emailHtml = buildAAPEmailHtml(notification, pendentesHtml, logoUrl);

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Acompanhamento AAPs <noreply@mensagens.acompanhamento-aaps.org>",
            to: [notification.aap_email],
            subject: `⚠️ Você tem ${notification.pendentes.length} ${notification.pendentes.length === 1 ? 'ação pendente' : 'ações pendentes'} - Parceiros da Educação`,
            html: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();
        if (!emailResponse.ok) throw new Error(emailData.message || "Failed to send email");

        console.log(`Email sent to AAP ${notification.aap_email}:`, emailData);
        emailResults.push({ type: 'aap', user_id: aapId, email: notification.aap_email, status: "sent" });
      } catch (emailError: any) {
        console.error(`Error sending email to ${notification.aap_email}:`, emailError);
        emailResults.push({ type: 'aap', user_id: aapId, email: notification.aap_email, status: "error", error: emailError.message });
      }
    }

    // --- Send consolidated emails to N3 Coordinators ---
    if (!registroId) try {
      // Get all unique programs from delayed actions
      const allProgramas = new Set<string>();
      for (const reg of registros) {
        if (reg.programa) {
          for (const p of reg.programa) allProgramas.add(p);
        }
      }

      if (allProgramas.size > 0) {
        // Find N3 users
        const { data: n3Roles } = await supabase
          .from('user_roles')
          .select('user_id')
          .eq('role', 'n3_coordenador_programa');

        const n3UserIds = (n3Roles || []).map(r => r.user_id);

        if (n3UserIds.length > 0) {
          // Get their program assignments
          const { data: n3Programas } = await supabase
            .from('user_programas')
            .select('user_id, programa')
            .in('user_id', n3UserIds);

          // Get their profiles
          const { data: n3Profiles } = await supabase
            .from('profiles')
            .select('id, nome, email')
            .in('id', n3UserIds);

          const n3ProfileMap = new Map((n3Profiles || []).map(p => [p.id, { nome: p.nome, email: p.email }]));

          // Group programs by N3 user
          const n3ProgramMap = new Map<string, string[]>();
          for (const up of (n3Programas || [])) {
            const existing = n3ProgramMap.get(up.user_id) || [];
            existing.push(up.programa);
            n3ProgramMap.set(up.user_id, existing);
          }

          // Build N3 notifications
          const n3Notifications: N3Notification[] = [];

          for (const [userId, programas] of n3ProgramMap) {
            const profile = n3ProfileMap.get(userId);
            if (!profile) continue;

            // Filter actions that match this N3's programs
            const relevantActions: PendingAction[] = [];
            for (const reg of registros) {
              if (!reg.programa) continue;
              const hasMatch = reg.programa.some(p => programas.includes(p));
              if (!hasMatch) continue;

              const relevantDateStr = reg.status === 'reagendada' && reg.reagendada_para 
                ? reg.reagendada_para : reg.data;
              const dataAgendada = new Date(relevantDateStr);
              const diasAtraso = Math.floor((today.getTime() - dataAgendada.getTime()) / (1000 * 60 * 60 * 24));
              const aapProfile = profileMap.get(reg.aap_id);

              relevantActions.push({
                id: reg.id,
                data: relevantDateStr,
                tipo: reg.tipo,
                escola_nome: escolaMap.get(reg.escola_id) || 'Escola não encontrada',
                dias_atraso: diasAtraso,
                programa: reg.programa,
                aap_nome: aapProfile?.nome || 'Não identificado',
              });
            }

            if (relevantActions.length > 0) {
              n3Notifications.push({
                user_id: userId,
                nome: profile.nome,
                email: profile.email,
                programas,
                pendentes: relevantActions.sort((a, b) => b.dias_atraso - a.dias_atraso),
              });
            }
          }

          console.log(`Sending N3 notifications to ${n3Notifications.length} coordinators`);

          const programaLabels: Record<string, string> = {
            escolas: 'Escolas',
            regionais: 'Regionais',
            redes_municipais: 'Redes Municipais',
          };

          for (const n3 of n3Notifications) {
            // Group actions by program for the email
            const byProgram = new Map<string, PendingAction[]>();
            for (const action of n3.pendentes) {
              for (const prog of (action.programa || [])) {
                if (n3.programas.includes(prog)) {
                  const list = byProgram.get(prog) || [];
                  list.push(action);
                  byProgram.set(prog, list);
                }
              }
            }

            let programSectionsHtml = '';
            for (const [prog, actions] of byProgram) {
              const rowsHtml = actions.map(p => `
                <tr style="border-bottom: 1px solid #e5e7eb;">
                  <td style="padding: 10px; color: #374151;">${p.tipo}</td>
                  <td style="padding: 10px; color: #374151;">${p.escola_nome}</td>
                  <td style="padding: 10px; color: #374151;">${p.aap_nome || '-'}</td>
                  <td style="padding: 10px; color: #374151;">${new Date(p.data).toLocaleDateString('pt-BR')}</td>
                  <td style="padding: 10px;">
                    <span style="background-color: ${p.dias_atraso > 5 ? '#fee2e2' : '#fef3c7'}; 
                                color: ${p.dias_atraso > 5 ? '#dc2626' : '#d97706'}; 
                                padding: 4px 8px; border-radius: 4px; font-weight: 600;">
                      ${p.dias_atraso} dias
                    </span>
                  </td>
                </tr>
              `).join('');

              programSectionsHtml += `
                <h3 style="color: #1e3a5f; margin: 20px 0 10px 0;">Programa: ${programaLabels[prog] || prog}</h3>
                <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px;">
                  <thead>
                    <tr style="background-color: #f3f4f6;">
                      <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Tipo</th>
                      <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Entidade</th>
                      <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Responsável</th>
                      <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Data</th>
                      <th style="padding: 10px; text-align: left; color: #374151; font-weight: 600;">Atraso</th>
                    </tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>
              `;
            }

            const n3EmailHtml = `
              <!DOCTYPE html>
              <html>
              <head><meta charset="utf-8"><title>Pendências do Programa - Parceiros da Educação</title></head>
              <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
                <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
                  <div style="background-color: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
                    <img src="${logoUrl}" alt="Parceiros da Educação" width="180" height="auto" style="display: block; margin: 0 auto 16px auto;" />
                    <h1 style="color: white; margin: 0; font-size: 24px;">Parceiros da Educação</h1>
                    <p style="color: #93c5fd; margin: 10px 0 0 0;">Sistema de Acompanhamento de AAPs</p>
                  </div>
                  <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                    <h2 style="color: #1e3a5f; margin-top: 0;">Olá, ${n3.nome}!</h2>
                    <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; margin: 20px 0; border-radius: 0 8px 8px 0;">
                      <p style="margin: 0; color: #92400e; font-weight: 600;">
                        ⚠️ Existem ${n3.pendentes.length} ${n3.pendentes.length === 1 ? 'ação atrasada' : 'ações atrasadas'} nos programas que você coordena
                      </p>
                    </div>
                    <p style="color: #6b7280; line-height: 1.6;">
                      As ações abaixo estão pendentes há mais de 2 dias nos programas sob sua coordenação.
                    </p>
                    ${programSectionsHtml}
                    <div style="text-align: center; margin-top: 30px;">
                      <a href="https://acompanhamento-aaps.lovable.app/pendencias" 
                         style="display: inline-block; background-color: #1e3a5f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
                        Ver Pendências no Sistema
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
                  from: "Acompanhamento AAPs <noreply@mensagens.acompanhamento-aaps.org>",
                  to: [n3.email],
                  subject: `⚠️ ${n3.pendentes.length} ${n3.pendentes.length === 1 ? 'ação atrasada' : 'ações atrasadas'} nos seus programas - Parceiros da Educação`,
                  html: n3EmailHtml,
                }),
              });

              const emailData = await emailResponse.json();
              if (!emailResponse.ok) throw new Error(emailData.message || "Failed to send email");

              console.log(`N3 email sent to ${n3.email}:`, emailData);
              emailResults.push({ type: 'n3', user_id: n3.user_id, email: n3.email, status: "sent" });
            } catch (emailError: any) {
              console.error(`Error sending N3 email to ${n3.email}:`, emailError);
              emailResults.push({ type: 'n3', user_id: n3.user_id, email: n3.email, status: "error", error: emailError.message });
            }
          }
        }
      }
    } catch (n3Error: any) {
      console.error("Error processing N3 notifications:", n3Error);
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

function buildAAPEmailHtml(notification: AAPNotification, pendentesHtml: string, logoUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head><meta charset="utf-8"><title>Ações Pendentes - Parceiros da Educação</title></head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
      <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background-color: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <img src="${logoUrl}" alt="Parceiros da Educação" width="180" height="auto" style="display: block; margin: 0 auto 16px auto;" />
          <h1 style="color: white; margin: 0; font-size: 24px;">Parceiros da Educação</h1>
          <p style="color: #93c5fd; margin: 10px 0 0 0;">Sistema de Acompanhamento de AAPs</p>
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
            <tbody>${pendentesHtml}</tbody>
          </table>
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://acompanhamento-aaps.lovable.app" 
               style="display: inline-block; background-color: #1e3a5f; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: 600;">
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
}

serve(handler);
