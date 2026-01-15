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
  // New stats matching PDF
  formacoesPrevistas: number;
  formacoesRealizadas: number;
  visitasPrevistas: number;
  visitasRealizadas: number;
  acompanhamentosPrevistas: number;
  acompanhamentosRealizados: number;
  totalPresentes: number;
  totalPresencas: number;
  percentualPresenca: number;
  segmentoDistribuicao: { name: string; percentual: number }[];
  presencaPorAAP: { name: string; formacoes: number; visitas: number }[];
  presencaPorEscola: { name: string; presenca: number; totalPresencas: number }[];
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

    // Fetch registros for the month with tipo
    const { data: registros, error: registrosError } = await supabase
      .from('registros_acao')
      .select('id, status, data, tipo, segmento, aap_id, escola_id')
      .gte('data', startDate)
      .lte('data', endDate);

    if (registrosError) {
      console.error("Error fetching registros:", registrosError);
      throw registrosError;
    }

    // Fetch programacoes for the month (to get previstas)
    const { data: programacoes, error: programacoesError } = await supabase
      .from('programacoes')
      .select('id, tipo, aap_id')
      .gte('data', startDate)
      .lte('data', endDate);

    if (programacoesError) {
      console.error("Error fetching programacoes:", programacoesError);
    }

    // Fetch presencas
    const registroIds = registros?.map(r => r.id) || [];
    let presencas: { registro_acao_id: string; presente: boolean }[] = [];
    if (registroIds.length > 0) {
      const { data: presencasData } = await supabase
        .from('presencas')
        .select('registro_acao_id, presente')
        .in('registro_acao_id', registroIds);
      presencas = presencasData || [];
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

    // Fetch AAP profiles for names
    const aapIds = [...new Set([
      ...(registros?.map(r => r.aap_id) || []),
      ...(programacoes?.map(p => p.aap_id) || [])
    ])];
    
    let aapProfiles: { id: string; nome: string }[] = [];
    if (aapIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, nome')
        .in('id', aapIds);
      aapProfiles = profiles || [];
    }

    // Fetch escolas for names
    const escolaIds = [...new Set(registros?.map(r => r.escola_id) || [])];
    let escolas: { id: string; nome: string }[] = [];
    if (escolaIds.length > 0) {
      const { data: escolasData } = await supabase
        .from('escolas')
        .select('id, nome')
        .in('id', escolaIds);
      escolas = escolasData || [];
    }

    // Calculate statistics matching PDF
    const formacoesPrevistas = programacoes?.filter(p => p.tipo === 'formacao').length || 0;
    const formacoesRealizadas = registros?.filter(r => r.tipo === 'formacao' && r.status === 'realizada').length || 0;
    const visitasPrevistas = programacoes?.filter(p => p.tipo === 'visita').length || 0;
    const visitasRealizadas = registros?.filter(r => r.tipo === 'visita' && r.status === 'realizada').length || 0;
    const acompanhamentosPrevistas = programacoes?.filter(p => p.tipo === 'acompanhamento').length || 0;
    const acompanhamentosRealizados = registros?.filter(r => r.tipo === 'acompanhamento' && r.status === 'realizada').length || 0;

    // Calculate presence
    const totalPresentes = presencas.filter(p => p.presente).length;
    const totalPresencas = presencas.length;
    const percentualPresenca = totalPresencas > 0 ? (totalPresentes / totalPresencas) * 100 : 0;

    // Calculate segment distribution
    const segmentoCounts: Record<string, number> = {};
    registros?.forEach(r => {
      if (r.segmento) {
        segmentoCounts[r.segmento] = (segmentoCounts[r.segmento] || 0) + 1;
      }
    });
    const totalSegmentos = Object.values(segmentoCounts).reduce((a, b) => a + b, 0);
    const segmentoDistribuicao = Object.entries(segmentoCounts).map(([name, count]) => ({
      name,
      percentual: totalSegmentos > 0 ? Math.round((count / totalSegmentos) * 100) : 0
    })).sort((a, b) => b.percentual - a.percentual);

    // Calculate presence by AAP
    const presencaPorAAP = aapProfiles.map(aap => {
      const aapRegistros = registros?.filter(r => r.aap_id === aap.id && r.status === 'realizada') || [];
      return {
        name: aap.nome.split(' ')[0], // First name only for display
        formacoes: aapRegistros.filter(r => r.tipo === 'formacao').length,
        visitas: aapRegistros.filter(r => r.tipo === 'visita').length
      };
    }).filter(aap => aap.formacoes > 0 || aap.visitas > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

    // Calculate presence by school
    const presencaPorEscola = escolas.map(escola => {
      const escolaRegistroIds = registros?.filter(r => r.escola_id === escola.id).map(r => r.id) || [];
      const escolaPresencas = presencas.filter(p => escolaRegistroIds.includes(p.registro_acao_id));
      const presentes = escolaPresencas.filter(p => p.presente).length;
      const total = escolaPresencas.length;
      return {
        name: escola.nome,
        presenca: total > 0 ? Math.round((presentes / total) * 100) : 0,
        totalPresencas: total
      };
    }).filter(e => e.totalPresencas > 0)
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'));

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
      formacoesPrevistas,
      formacoesRealizadas,
      visitasPrevistas,
      visitasRealizadas,
      acompanhamentosPrevistas,
      acompanhamentosRealizados,
      totalPresentes,
      totalPresencas,
      percentualPresenca,
      segmentoDistribuicao,
      presencaPorAAP,
      presencaPorEscola,
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

    const logoUrl = 'https://acompanhamento-aaps.lovable.app/pe-logo-branco.png';
    
    // Generate email HTML matching PDF layout exactly
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório Mensal - Parceiros Educacionais</title>
      </head>
      <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f1f5f9;">
        <div style="max-width: 800px; margin: 0 auto; padding: 20px;">
          
          <!-- Header com Logo - Idêntico ao PDF -->
          <div style="background-color: #003875; padding: 24px 30px; border-radius: 12px 12px 0 0;">
            <table width="100%" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="80" valign="middle">
                  <img src="${logoUrl}" alt="Parceiros da Educação" width="70" height="auto" style="display: block;" />
                </td>
                <td valign="middle" style="padding-left: 20px;">
                  <div style="color: white; font-size: 20px; font-weight: bold;">Relatório de Acompanhamento - AAPs/Formadores</div>
                  <div style="color: #93c5fd; font-size: 14px; margin-top: 6px;">${monthName}</div>
                </td>
              </tr>
            </table>
          </div>
          
          <!-- Content -->
          <div style="background-color: #f8fafc; padding: 24px; border-radius: 0 0 12px 12px;">
            
            <!-- 6 Stat Cards - Layout idêntico ao PDF -->
            <table width="100%" cellpadding="0" cellspacing="8" border="0" style="margin-bottom: 24px;">
              <tr>
                <!-- Formações -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Formações</div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.formacoesRealizadas}/${stats.formacoesPrevistas}</div>
                  <div style="margin-top: 10px; background-color: #e2e8f0; border-radius: 4px; height: 6px; overflow: hidden;">
                    <div style="width: ${stats.formacoesPrevistas > 0 ? (stats.formacoesRealizadas / stats.formacoesPrevistas) * 100 : 0}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                  </div>
                </td>
                <!-- Visitas -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Visitas</div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.visitasRealizadas}/${stats.visitasPrevistas}</div>
                  <div style="margin-top: 10px; background-color: #e2e8f0; border-radius: 4px; height: 6px; overflow: hidden;">
                    <div style="width: ${stats.visitasPrevistas > 0 ? (stats.visitasRealizadas / stats.visitasPrevistas) * 100 : 0}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                  </div>
                </td>
                <!-- Acompanhamentos -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">👁 Acompanhamentos</div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.acompanhamentosRealizados}/${stats.acompanhamentosPrevistas}</div>
                  <div style="margin-top: 10px; background-color: #e2e8f0; border-radius: 4px; height: 6px; overflow: hidden;">
                    <div style="width: ${stats.acompanhamentosPrevistas > 0 ? (stats.acompanhamentosRealizados / stats.acompanhamentosPrevistas) * 100 : 0}%; background-color: #003875; height: 100%; border-radius: 4px;"></div>
                  </div>
                </td>
                <!-- Professores Formados -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Professores Formados</div>
                  <div style="font-size: 24px; font-weight: bold; color: #1e293b;">${stats.totalPresentes}</div>
                  <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">participações registradas</div>
                </td>
                <!-- Taxa de Presença -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">Taxa de Presença</div>
                  <div style="font-size: 24px; font-weight: bold; color: #16a34a;">${Math.round(stats.percentualPresenca)}%</div>
                  <div style="color: #94a3b8; font-size: 12px; margin-top: 6px;">${stats.totalPresentes} de ${stats.totalPresencas}</div>
                </td>
                <!-- % de ações por segmento -->
                <td width="16.66%" style="background-color: white; padding: 16px; border-radius: 10px; vertical-align: top; border: 1px solid #e2e8f0;">
                  <div style="color: #64748b; font-size: 13px; margin-bottom: 8px;">% de ações por segmento</div>
                  ${stats.segmentoDistribuicao.slice(0, 3).map(seg => `
                    <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
                      <span style="color: #64748b;">${seg.name}</span>
                      <span style="font-weight: 600; color: #1e293b;">${seg.percentual}%</span>
                    </div>
                  `).join('')}
                </td>
              </tr>
            </table>

            <!-- Desempenho por AAP -->
            ${stats.presencaPorAAP.length > 0 ? `
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <h3 style="color: #003875; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Desempenho por AAP</h3>
                <table width="100%" cellpadding="8" cellspacing="0" border="0" style="font-size: 13px;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="text-align: left; padding: 10px 12px; color: #64748b; font-weight: 500; border-radius: 6px 0 0 6px;">AAP</th>
                      <th style="text-align: center; padding: 10px 12px; color: #64748b; font-weight: 500;">Formações</th>
                      <th style="text-align: center; padding: 10px 12px; color: #64748b; font-weight: 500; border-radius: 0 6px 6px 0;">Visitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stats.presencaPorAAP.map((aap, index) => `
                      <tr style="background-color: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                        <td style="padding: 10px 12px; color: #1e293b;">${aap.name}</td>
                        <td style="text-align: center; padding: 10px 12px;">
                          <span style="background-color: #dbeafe; color: #1e40af; padding: 4px 12px; border-radius: 12px; font-weight: 600;">${aap.formacoes}</span>
                        </td>
                        <td style="text-align: center; padding: 10px 12px;">
                          <span style="background-color: #d1fae5; color: #059669; padding: 4px 12px; border-radius: 12px; font-weight: 600;">${aap.visitas}</span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <!-- Presença por Escola -->
            ${stats.presencaPorEscola.length > 0 ? `
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <h3 style="color: #003875; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">Presença por Escola</h3>
                <table width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size: 13px;">
                  <thead>
                    <tr style="background-color: #f1f5f9;">
                      <th style="text-align: left; padding: 10px 12px; color: #64748b; font-weight: 500; border-radius: 6px 0 0 6px;">Escola</th>
                      <th style="text-align: right; padding: 10px 12px; color: #64748b; font-weight: 500; border-radius: 0 6px 6px 0;">Presença</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${stats.presencaPorEscola.slice(0, 10).map((escola, index) => `
                      <tr style="background-color: ${index % 2 === 0 ? 'white' : '#f8fafc'};">
                        <td style="padding: 8px 12px; color: #1e293b;">${escola.name}</td>
                        <td style="text-align: right; padding: 8px 12px;">
                          <span style="font-weight: 600; color: ${escola.presenca >= 80 ? '#16a34a' : escola.presenca >= 50 ? '#d97706' : '#dc2626'};">
                            ${escola.presenca}%
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
                ${stats.presencaPorEscola.length > 10 ? `
                  <div style="text-align: center; margin-top: 12px; color: #64748b; font-size: 12px;">
                    ... e mais ${stats.presencaPorEscola.length - 10} escolas
                  </div>
                ` : ''}
              </div>
            ` : ''}
            
            <!-- Avaliações de Aula -->
            ${stats.totalAvaliacoes > 0 ? `
              <div style="background-color: white; padding: 20px; border-radius: 10px; margin-bottom: 20px; border: 1px solid #e2e8f0;">
                <h3 style="color: #003875; font-size: 16px; margin: 0 0 16px 0; font-weight: 600;">👁 Acompanhamento de Aula (${stats.totalAvaliacoes} avaliações)</h3>
                
                <table width="100%" cellpadding="0" cellspacing="8" border="0">
                  ${[
                    { name: 'Clareza dos Objetivos', value: stats.avgClareza },
                    { name: 'Domínio do Conteúdo', value: stats.avgDominio },
                    { name: 'Estratégias Didáticas', value: stats.avgDidatica },
                    { name: 'Engajamento da Turma', value: stats.avgEngajamento },
                    { name: 'Gestão do Tempo', value: stats.avgTempo }
                  ].map(item => `
                    <tr>
                      <td style="padding: 12px; background-color: #f8fafc; border-radius: 8px;">
                        <table width="100%" cellpadding="0" cellspacing="0" border="0">
                          <tr>
                            <td style="font-weight: 500; color: #334155; font-size: 14px;">${item.name}</td>
                            <td style="text-align: right; font-weight: bold; color: #003875; font-size: 14px;">${item.value.toFixed(2)}/5.00</td>
                          </tr>
                          <tr>
                            <td colspan="2" style="padding-top: 8px;">
                              <div style="background-color: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                                <div style="width: ${(item.value / 5) * 100}%; background-color: #f59e0b; height: 100%; border-radius: 4px;"></div>
                              </div>
                            </td>
                          </tr>
                        </table>
                      </td>
                    </tr>
                  `).join('')}
                </table>
              </div>
            ` : ''}
            
            <!-- CTA Button -->
            <div style="text-align: center; margin-top: 24px;">
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
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="color: #94a3b8; font-size: 12px; margin: 0;">
                Este é um e-mail automático do sistema de Acompanhamento de AAPs.
              </p>
              <p style="color: #94a3b8; font-size: 11px; margin: 8px 0 0 0;">
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
