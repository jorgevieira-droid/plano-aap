import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    console.log("Starting monthly report generation...");

    // Get previous month date range
    const now = new Date();
    const firstDayPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    
    const startDate = firstDayPrevMonth.toISOString().split('T')[0];
    const endDate = lastDayPrevMonth.toISOString().split('T')[0];
    
    const monthName = firstDayPrevMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

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
    const { data: adminRoles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (!adminRoles || adminRoles.length === 0) {
      console.log("No admin users found");
      return new Response(
        JSON.stringify({ message: "Nenhum administrador encontrado" }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const adminIds = adminRoles.map(r => r.user_id);
    const { data: adminProfiles } = await supabase
      .from('profiles')
      .select('id, nome, email')
      .in('id', adminIds);

    console.log(`Sending report to ${adminProfiles?.length || 0} administrators`);

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

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Relatório Mensal - Parceiros Educacionais</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f3f4f6;">
        <div style="max-width: 650px; margin: 0 auto; padding: 20px;">
          <div style="background-color: #1e3a5f; padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Parceiros Educacionais</h1>
            <p style="color: #93c5fd; margin: 10px 0 0 0;">Relatório Mensal Executivo</p>
          </div>
          
          <div style="background-color: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h2 style="color: #1e3a5f; margin: 0; text-transform: capitalize;">${monthName}</h2>
            </div>
            
            <!-- Resumo Geral -->
            <h3 style="color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">📊 Resumo de Atividades</h3>
            
            <div style="display: flex; flex-wrap: wrap; gap: 15px; margin: 20px 0;">
              <div style="flex: 1; min-width: 120px; background-color: #eff6ff; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #1e3a5f;">${stats.totalRegistros}</div>
                <div style="color: #6b7280; font-size: 14px;">Total de Ações</div>
              </div>
              <div style="flex: 1; min-width: 120px; background-color: #ecfdf5; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #059669;">${stats.totalRealizados}</div>
                <div style="color: #6b7280; font-size: 14px;">Realizadas</div>
              </div>
              <div style="flex: 1; min-width: 120px; background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #d97706;">${stats.totalAgendados}</div>
                <div style="color: #6b7280; font-size: 14px;">Pendentes</div>
              </div>
              <div style="flex: 1; min-width: 120px; background-color: #fee2e2; padding: 20px; border-radius: 8px; text-align: center;">
                <div style="font-size: 28px; font-weight: bold; color: #dc2626;">${stats.totalCancelados}</div>
                <div style="color: #6b7280; font-size: 14px;">Canceladas</div>
              </div>
            </div>
            
            <div style="background-color: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: center;">
              <span style="color: #6b7280;">Taxa de Realização:</span>
              <span style="font-size: 24px; font-weight: bold; color: ${parseFloat(taxaRealizacao) >= 80 ? '#059669' : parseFloat(taxaRealizacao) >= 50 ? '#d97706' : '#dc2626'}; margin-left: 10px;">
                ${taxaRealizacao}%
              </span>
            </div>
            
            <!-- Avaliações -->
            <h3 style="color: #1e3a5f; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px;">⭐ Avaliações de Aula (${stats.totalAvaliacoes} avaliações)</h3>
            
            ${stats.totalAvaliacoes > 0 ? `
              <div style="margin: 20px 0;">
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #1e3a5f; margin-bottom: 5px;">Clareza dos Objetivos</div>
                  ${formatRating(stats.avgClareza)}
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #1e3a5f; margin-bottom: 5px;">Domínio do Conteúdo</div>
                  ${formatRating(stats.avgDominio)}
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #1e3a5f; margin-bottom: 5px;">Estratégias Didáticas</div>
                  ${formatRating(stats.avgDidatica)}
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #1e3a5f; margin-bottom: 5px;">Engajamento da Turma</div>
                  ${formatRating(stats.avgEngajamento)}
                </div>
                <div style="margin-bottom: 15px;">
                  <div style="font-weight: 600; color: #1e3a5f; margin-bottom: 5px;">Gestão do Tempo</div>
                  ${formatRating(stats.avgTempo)}
                </div>
              </div>
            ` : `
              <p style="color: #6b7280; text-align: center; padding: 20px;">Nenhuma avaliação de aula registrada neste período.</p>
            `}
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://parceiroseducacionais.lovable.app/relatorios" 
                 style="display: inline-block; 
                        background-color: #1e3a5f; 
                        color: white; 
                        padding: 14px 28px; 
                        text-decoration: none; 
                        border-radius: 8px; 
                        font-weight: 600;">
                Ver Relatórios Completos
              </a>
            </div>
            
            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 30px;">
              Este é um e-mail automático enviado no início de cada mês com o resumo do mês anterior.
            </p>
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
            from: "Acompanhamento AAPs <noreply@acompanhamento-aaps.org>",
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
