import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface MonthlyStats {
  totalRegistros: number;
  totalRealizados: number;
  totalCancelados: number;
  totalAgendados: number;
  totalAvaliacoes: number;
  avgClareza: number;
  avgDominio: number;
  avgDidatica: number;
  avgEngajamento: number;
  avgTempo: number;
}

const handler = async (req: Request): Promise<Response> => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify user is authenticated
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Unauthorized: Missing authorization header");
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth to verify token
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
    if (!anonKey) {
      console.error("Server misconfig: Missing SUPABASE_ANON_KEY/SUPABASE_PUBLISHABLE_KEY");
      return new Response(
        JSON.stringify({ error: 'Server misconfig: missing anon key' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.slice('Bearer '.length).trim();
    if (!token || token === 'null' || token === 'undefined') {
      console.error("Unauthorized: Missing bearer token");
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Missing bearer token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log("Auth header received", { tokenLength: token.length });

    const supabaseAuth = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      console.error("Unauthorized: Invalid token", claimsError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized: Invalid token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Use service role client for admin operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user is admin
    const { data: userRole, error: roleError } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .single();

    if (roleError || !userRole || userRole.role !== 'admin') {
      console.error("Forbidden: User is not an admin", { userId, role: userRole?.role });
      return new Response(
        JSON.stringify({ error: 'Forbidden: Only administrators can send monthly reports' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin ${userId} is generating monthly report...`);

    // Parse request body for custom month/year and recipients
    let targetYear: number;
    let targetMonth: number;
    let recipientIds: string[] | undefined;
    
    try {
      const body = await req.json();
      if (body.year && body.month) {
        targetYear = body.year;
        targetMonth = body.month - 1; // JS months are 0-indexed
        console.log(`Custom month requested: ${body.month}/${body.year}`);
      } else {
        // Default to previous month
        const now = new Date();
        targetYear = now.getFullYear();
        targetMonth = now.getMonth() - 1;
        if (targetMonth < 0) {
          targetMonth = 11;
          targetYear--;
        }
      }
      
      // Check for specific recipients
      if (body.recipientIds && Array.isArray(body.recipientIds) && body.recipientIds.length > 0) {
        recipientIds = body.recipientIds;
        console.log(`Specific recipients requested: ${body.recipientIds.length} admin(s)`);
      }
    } catch {
      // No body or invalid JSON, use previous month
      const now = new Date();
      targetYear = now.getFullYear();
      targetMonth = now.getMonth() - 1;
      if (targetMonth < 0) {
        targetMonth = 11;
        targetYear--;
      }
    }

    const firstDayMonth = new Date(targetYear, targetMonth, 1);
    const lastDayMonth = new Date(targetYear, targetMonth + 1, 0);
    
    const startDate = firstDayMonth.toISOString().split('T')[0];
    const endDate = lastDayMonth.toISOString().split('T')[0];
    
    const monthName = firstDayMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

    console.log(`Generating report for ${monthName} (${startDate} to ${endDate})`);

    // Fetch registros for the month
    const { data: registros, error: registrosError } = await supabase
      .from('registros_acao')
      .select('id, status, data')
      .gte('data', startDate)
      .lte('data', endDate);

    if (registrosError) {
      console.error("Error fetching registros:", registrosError);
      throw registrosError;
    }

    // Fetch avaliacoes for the month
    const { data: avaliacoes, error: avaliacoesError } = await supabase
      .from('avaliacoes_aula')
      .select('clareza_objetivos, dominio_conteudo, estrategias_didaticas, engajamento_turma, gestao_tempo, created_at')
      .gte('created_at', `${startDate}T00:00:00`)
      .lte('created_at', `${endDate}T23:59:59`);

    if (avaliacoesError) {
      console.error("Error fetching avaliacoes:", avaliacoesError);
      throw avaliacoesError;
    }

    // Calculate statistics
    const stats: MonthlyStats = {
      totalRegistros: registros?.length || 0,
      totalRealizados: registros?.filter(r => r.status === 'realizada').length || 0,
      totalCancelados: registros?.filter(r => r.status === 'cancelada').length || 0,
      totalAgendados: registros?.filter(r => r.status === 'agendada').length || 0,
      totalAvaliacoes: avaliacoes?.length || 0,
      avgClareza: 0,
      avgDominio: 0,
      avgDidatica: 0,
      avgEngajamento: 0,
      avgTempo: 0,
    };

    if (avaliacoes && avaliacoes.length > 0) {
      stats.avgClareza = avaliacoes.reduce((sum, a) => sum + a.clareza_objetivos, 0) / avaliacoes.length;
      stats.avgDominio = avaliacoes.reduce((sum, a) => sum + a.dominio_conteudo, 0) / avaliacoes.length;
      stats.avgDidatica = avaliacoes.reduce((sum, a) => sum + a.estrategias_didaticas, 0) / avaliacoes.length;
      stats.avgEngajamento = avaliacoes.reduce((sum, a) => sum + a.engajamento_turma, 0) / avaliacoes.length;
      stats.avgTempo = avaliacoes.reduce((sum, a) => sum + a.gestao_tempo, 0) / avaliacoes.length;
    }

    // Get admin users to send the report
    let adminProfiles: { id: string; nome: string; email: string }[] = [];
    
    if (recipientIds && recipientIds.length > 0) {
      // Send to specific recipients (verify they are admins)
      const { data: validAdminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin')
        .in('user_id', recipientIds);
      
      if (validAdminRoles && validAdminRoles.length > 0) {
        const validAdminIds = validAdminRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', validAdminIds);
        adminProfiles = profiles || [];
      }
    } else {
      // Send to all admins
      const { data: adminRoles } = await supabase
        .from('user_roles')
        .select('user_id')
        .eq('role', 'admin');

      if (adminRoles && adminRoles.length > 0) {
        const adminIds = adminRoles.map(r => r.user_id);
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, nome, email')
          .in('id', adminIds);
        adminProfiles = profiles || [];
      }
    }

    if (adminProfiles.length === 0) {
      console.log("No admin users found for the specified criteria");
      return new Response(
        JSON.stringify({ message: "Nenhum administrador encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Sending report to ${adminProfiles.length} administrator(s)`);

    const taxaRealizacao = stats.totalRegistros > 0 
      ? ((stats.totalRealizados / stats.totalRegistros) * 100).toFixed(1) 
      : '0';

    const formatRating = (value: number) => {
      const percentage = (value / 5) * 100;
      return `
        <div style="display: flex; align-items: center; gap: 10px; margin-bottom: 8px;">
          <div style="width: 120px; font-size: 14px; color: #374151;">${value.toFixed(2)}/5.00</div>
          <div style="flex: 1; background-color: #e5e7eb; border-radius: 4px; height: 8px;">
            <div style="width: ${percentage}%; background-color: #1e3a5f; border-radius: 4px; height: 8px;"></div>
          </div>
        </div>
      `;
    };

    const logoUrl = 'https://acompanhamento-aaps.lovable.app/pe-logo-branco.png';
    
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Mensal - Parceiros Educacionais</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 700px; margin: 0 auto; padding: 20px;">
          
          <!-- Header com Logo - Similar ao PDF -->
          <div style="background-color: #003875; padding: 20px 30px; border-radius: 12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="80" valign="middle">
                  <img src="${logoUrl}" alt="PE Logo" width="70" height="28" style="display: block;" />
                </td>
                <td valign="middle" style="padding-left: 15px;">
                  <div style="color: white; font-size: 16px; font-weight: bold;">Relatório de Acompanhamento - AAPs/Formadores</div>
                  <div style="color: #93c5fd; font-size: 13px; margin-top: 4px;">${monthName}</div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Content -->
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            
            <!-- Summary Cards -->
            <h3 style="color: #003875; font-size: 16px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">📊 Resumo de Atividades</h3>
            
            <table width="100%" cellpadding="0" cellspacing="8" border="0" style="margin-bottom: 20px;">
              <tr>
                <td width="25%" style="background-color: #eff6ff; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #dbeafe;">
                  <div style="font-size: 32px; font-weight: bold; color: #003875;">${stats.totalRegistros}</div>
                  <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Total de Ações</div>
                </td>
                <td width="25%" style="background-color: #ecfdf5; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #d1fae5;">
                  <div style="font-size: 32px; font-weight: bold; color: #059669;">${stats.totalRealizados}</div>
                  <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Realizadas</div>
                </td>
                <td width="25%" style="background-color: #fef3c7; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #fde68a;">
                  <div style="font-size: 32px; font-weight: bold; color: #d97706;">${stats.totalAgendados}</div>
                  <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Pendentes</div>
                </td>
                <td width="25%" style="background-color: #fee2e2; padding: 16px; border-radius: 8px; text-align: center; border: 1px solid #fecaca;">
                  <div style="font-size: 32px; font-weight: bold; color: #dc2626;">${stats.totalCancelados}</div>
                  <div style="color: #6b7280; font-size: 13px; margin-top: 4px;">Canceladas</div>
                </td>
              </tr>
            </table>
            
            <!-- Taxa de Realização -->
            <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px; text-align: center; border: 1px solid #e2e8f0;">
              <span style="color: #64748b; font-size: 14px;">Taxa de Realização:</span>
              <span style="font-size: 28px; font-weight: bold; color: ${parseFloat(taxaRealizacao) >= 80 ? '#059669' : parseFloat(taxaRealizacao) >= 50 ? '#d97706' : '#dc2626'}; margin-left: 12px;">
                ${taxaRealizacao}%
              </span>
              <div style="margin-top: 10px; background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                <div style="width: ${taxaRealizacao}%; background-color: ${parseFloat(taxaRealizacao) >= 80 ? '#059669' : parseFloat(taxaRealizacao) >= 50 ? '#d97706' : '#dc2626'}; height: 100%; border-radius: 4px;"></div>
              </div>
            </div>
            
            <!-- Avaliações de Aula -->
            <h3 style="color: #003875; font-size: 16px; margin: 0 0 20px 0; padding-bottom: 10px; border-bottom: 2px solid #e5e7eb;">⭐ Avaliações de Aula (${stats.totalAvaliacoes} avaliações)</h3>
            
            ${stats.totalAvaliacoes > 0 ? `
              <table width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 6px; margin-bottom: 8px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-weight: 600; color: #003875; font-size: 14px; padding-bottom: 8px;">Clareza dos Objetivos</td>
                        <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${stats.avgClareza.toFixed(2)}/5.00</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${(stats.avgClareza / 5) * 100}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-weight: 600; color: #003875; font-size: 14px; padding-bottom: 8px;">Domínio do Conteúdo</td>
                        <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${stats.avgDominio.toFixed(2)}/5.00</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${(stats.avgDominio / 5) * 100}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-weight: 600; color: #003875; font-size: 14px; padding-bottom: 8px;">Estratégias Didáticas</td>
                        <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${stats.avgDidatica.toFixed(2)}/5.00</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${(stats.avgDidatica / 5) * 100}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-weight: 600; color: #003875; font-size: 14px; padding-bottom: 8px;">Engajamento da Turma</td>
                        <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${stats.avgEngajamento.toFixed(2)}/5.00</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${(stats.avgEngajamento / 5) * 100}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr><td style="height: 8px;"></td></tr>
                <tr>
                  <td style="padding: 12px; background-color: #f8fafc; border-radius: 6px;">
                    <table width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-weight: 600; color: #003875; font-size: 14px; padding-bottom: 8px;">Gestão do Tempo</td>
                        <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${stats.avgTempo.toFixed(2)}/5.00</td>
                      </tr>
                      <tr>
                        <td colspan="2">
                          <div style="background-color: #e5e7eb; border-radius: 4px; height: 8px; overflow: hidden;">
                            <div style="width: ${(stats.avgTempo / 5) * 100}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                          </div>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            ` : `
              <div style="text-align: center; padding: 30px; color: #6b7280; background-color: #f8fafc; border-radius: 8px;">
                Nenhuma avaliação de aula registrada neste período.
              </div>
            `}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://acompanhamento-aaps.lovable.app/relatorios" 
                 style="display: inline-block; 
                        background-color: #003875; 
                        color: white; 
                        padding: 14px 32px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600;
                        font-size: 14px;">
                Ver Relatórios Completos
              </a>
            </div>
            
            <!-- Footer -->
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                Este é um e-mail automático do sistema de Acompanhamento de AAPs.
              </p>
              <p style="color: #9ca3af; font-size: 11px; margin: 8px 0 0 0;">
                Parceiros Educacionais © ${new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    // Send emails to each admin
    const emailResults = [];
    for (const admin of adminProfiles || []) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${RESEND_API_KEY}`,
          },
          body: JSON.stringify({
            from: "Acompanhamento AAPs <noreply@mensagens.acompanhamento-aaps.org>",
            to: [admin.email],
            subject: `📊 Relatório Mensal - ${monthName} - Parceiros Educacionais`,
            html: emailHtml,
          }),
        });

        const emailData = await emailResponse.json();
        
        if (!emailResponse.ok) {
          throw new Error(emailData.message || "Failed to send email");
        }

        console.log(`Report email sent to ${admin.email}:`, emailData);
        emailResults.push({ admin_id: admin.id, email: admin.email, status: "sent", response: emailData });
      } catch (emailError: any) {
        console.error(`Error sending email to ${admin.email}:`, emailError);
        emailResults.push({ admin_id: admin.id, email: admin.email, status: "error", error: emailError.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        message: `Relatório mensal enviado`, 
        month: monthName,
        stats,
        total_admins: adminProfiles?.length || 0,
        results: emailResults 
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: any) {
    console.error("Error in send-monthly-report function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
};

serve(handler);
