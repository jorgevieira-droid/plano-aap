import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from '../_shared/cors.ts';

const MANAGER_ROLES = ['admin', 'gestor', 'n3_coordenador_programa'];
const OPERATIONAL_ROLES = ['n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica'];
const ALL_MANAGEABLE_ROLES = [
  'n3_coordenador_programa', 'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
  'aap_inicial', 'aap_portugues', 'aap_matematica',
];

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const token = authHeader.replace('Bearer ', '');
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser(token);
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check requester role using helper functions
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: requestingUser.id });
    const { data: isManager } = await supabaseAdmin.rpc('is_manager', { _user_id: requestingUser.id });
    
    if (!isAdmin && !isManager) {
      return new Response(JSON.stringify({ error: 'Apenas administradores e gestores podem gerenciar usuários operacionais' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get requester's programs
    let requesterProgramas: string[] = [];
    if (!isAdmin) {
      const { data: programas } = await supabaseAdmin
        .from('user_programas')
        .select('programa')
        .eq('user_id', requestingUser.id);
      requesterProgramas = programas?.map(p => p.programa) || [];
      console.log('Requester programas:', requesterProgramas);
    }

    const { action, ...data } = await req.json();
    console.log('Action:', action, 'Data:', data);

    switch (action) {
      case 'create': {
        const { email, password, nome, telefone, role, escolasIds, programas } = data;
        
        if (!password || password.length < 8) {
          return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // Validate role is manageable
        if (role && !isAdmin && !ALL_MANAGEABLE_ROLES.includes(role)) {
          return new Response(JSON.stringify({ error: 'Você não pode criar usuários com este papel' }), {
            status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // If not admin, validate program scope
        if (!isAdmin) {
          const userProgramas = programas || ['escolas'];
          const hasValidPrograma = userProgramas.some((p: string) => requesterProgramas.includes(p));
          if (!hasValidPrograma) {
            return new Response(JSON.stringify({ error: 'Você só pode criar usuários para seus programas' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { nome }
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update profile
        await supabaseAdmin.from('profiles').update({ nome, telefone }).eq('id', newUser.user.id);

        // Assign role
        await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role });

        // Assign programas to user_programas
        const userProgramas = programas || (!isAdmin ? requesterProgramas : ['escolas']);
        if (userProgramas.length > 0) {
          const programaAssignments = userProgramas.map((programa: string) => ({
            user_id: newUser.user.id, programa
          }));
          await supabaseAdmin.from('user_programas').insert(programaAssignments);
          
          // Legacy compatibility
          if (role?.startsWith('aap_') || role === 'n5_formador') {
            const legacy = userProgramas.map((p: string) => ({ aap_user_id: newUser.user.id, programa: p }));
            await supabaseAdmin.from('aap_programas').insert(legacy);
          } else if (role === 'gestor') {
            const legacy = userProgramas.map((p: string) => ({ gestor_user_id: newUser.user.id, programa: p }));
            await supabaseAdmin.from('gestor_programas').insert(legacy);
          }
        }

        // Assign entidades (schools) to user_entidades
        if (escolasIds && escolasIds.length > 0) {
          let validEscolaIds = escolasIds;

          // If not admin, validate schools belong to requester's programs
          if (!isAdmin) {
            const { data: validEscolas } = await supabaseAdmin
              .from('escolas')
              .select('id, programa')
              .in('id', escolasIds);
            
            validEscolaIds = validEscolas
              ?.filter(e => e.programa?.some((p: string) => requesterProgramas.includes(p)))
              .map(e => e.id) || [];
          }
          
          if (validEscolaIds.length > 0) {
            const entidadeAssignments = validEscolaIds.map((escolaId: string) => ({
              user_id: newUser.user.id, escola_id: escolaId
            }));
            await supabaseAdmin.from('user_entidades').insert(entidadeAssignments);
            
            // Legacy compatibility
            const legacyEscolas = validEscolaIds.map((escolaId: string) => ({
              aap_user_id: newUser.user.id, escola_id: escolaId
            }));
            await supabaseAdmin.from('aap_escolas').insert(legacyEscolas);
          }
        }

        return new Response(JSON.stringify({ 
          success: true, user: { id: newUser.user.id, email: newUser.user.email } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { userId, email, password, nome, telefone, role, escolasIds, programas } = data;

        // If not admin, validate scope
        if (!isAdmin) {
          const { data: targetProgramas } = await supabaseAdmin
            .from('user_programas')
            .select('programa')
            .eq('user_id', userId);
          
          const targetProgramaList = targetProgramas?.map(p => p.programa) || [];
          const canManage = targetProgramaList.some((p: string) => requesterProgramas.includes(p));
          
          if (!canManage) {
            return new Response(JSON.stringify({ error: 'Você não pode editar usuários de outros programas' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update auth email/password
        if (email || password) {
          const updateData: Record<string, string> = {};
          if (email) updateData.email = email;
          if (password) updateData.password = password;
          
          const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(userId, updateData);
          if (updateUserError) {
            return new Response(JSON.stringify({ error: updateUserError.message }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update profile
        await supabaseAdmin.from('profiles')
          .update({ nome, telefone, email: email || undefined })
          .eq('id', userId);

        // Update role
        if (role) {
          await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
          await supabaseAdmin.from('user_roles').insert({ user_id: userId, role });
        }

        // Update programas
        if (isAdmin && programas !== undefined) {
          // Clear and re-insert user_programas
          await supabaseAdmin.from('user_programas').delete().eq('user_id', userId);
          if (programas.length > 0) {
            const assignments = programas.map((programa: string) => ({ user_id: userId, programa }));
            await supabaseAdmin.from('user_programas').insert(assignments);
          }
          
          // Legacy sync
          await supabaseAdmin.from('aap_programas').delete().eq('aap_user_id', userId);
          await supabaseAdmin.from('gestor_programas').delete().eq('gestor_user_id', userId);
          if (programas.length > 0) {
            if (role?.startsWith('aap_') || role === 'n5_formador') {
              const legacy = programas.map((p: string) => ({ aap_user_id: userId, programa: p }));
              await supabaseAdmin.from('aap_programas').insert(legacy);
            } else if (role === 'gestor') {
              const legacy = programas.map((p: string) => ({ gestor_user_id: userId, programa: p }));
              await supabaseAdmin.from('gestor_programas').insert(legacy);
            }
          }
        }

        // Update entidades (schools)
        if (escolasIds !== undefined) {
          // Clear and re-insert user_entidades
          await supabaseAdmin.from('user_entidades').delete().eq('user_id', userId);
          await supabaseAdmin.from('aap_escolas').delete().eq('aap_user_id', userId);
          
          if (escolasIds.length > 0) {
            let validEscolaIds = escolasIds;

            if (!isAdmin) {
              const { data: validEscolas } = await supabaseAdmin
                .from('escolas').select('id, programa').in('id', escolasIds);
              validEscolaIds = validEscolas
                ?.filter(e => e.programa?.some((p: string) => requesterProgramas.includes(p)))
                .map(e => e.id) || [];
            }
            
            if (validEscolaIds.length > 0) {
              const entidadeAssignments = validEscolaIds.map((escolaId: string) => ({
                user_id: userId, escola_id: escolaId
              }));
              await supabaseAdmin.from('user_entidades').insert(entidadeAssignments);
              
              // Legacy
              const legacyEscolas = validEscolaIds.map((escolaId: string) => ({
                aap_user_id: userId, escola_id: escolaId
              }));
              await supabaseAdmin.from('aap_escolas').insert(legacyEscolas);
            }
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { userId } = data;

        // If not admin, validate scope
        if (!isAdmin) {
          const { data: targetProgramas } = await supabaseAdmin
            .from('user_programas')
            .select('programa')
            .eq('user_id', userId);
          
          const targetProgramaList = targetProgramas?.map(p => p.programa) || [];
          const canManage = targetProgramaList.some((p: string) => requesterProgramas.includes(p));
          
          if (!canManage) {
            return new Response(JSON.stringify({ error: 'Você não pode excluir usuários de outros programas' }), {
              status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
        if (deleteError) {
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // List operational users (AAP/formadores and similar roles)
        const rolesToList = OPERATIONAL_ROLES;
        
        const { data: userRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role')
          .in('role', rolesToList);

        if (rolesError) {
          return new Response(JSON.stringify({ error: rolesError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let filteredUserRoles = userRoles || [];

        // If not admin, filter by program scope
        if (!isAdmin && requesterProgramas.length > 0) {
          const userIds = userRoles?.map(r => r.user_id) || [];
          
          if (userIds.length > 0) {
            const { data: userProgramasData } = await supabaseAdmin
              .from('user_programas')
              .select('user_id, programa')
              .in('user_id', userIds);
            
            const validUserIds = new Set(
              userProgramasData
                ?.filter(up => requesterProgramas.includes(up.programa))
                .map(up => up.user_id) || []
            );
            
            filteredUserRoles = userRoles?.filter(ur => validUserIds.has(ur.user_id)) || [];
          }
        }

        const userIds = filteredUserRoles.map(r => r.user_id);
        
        if (userIds.length === 0) {
          return new Response(JSON.stringify({ users: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Fetch profiles, entidades, programas in parallel
        const [profilesResult, entidadesResult, programasResult] = await Promise.all([
          supabaseAdmin.from('profiles').select('*').in('id', userIds).order('nome'),
          supabaseAdmin.from('user_entidades').select('user_id, escola_id').in('user_id', userIds),
          supabaseAdmin.from('user_programas').select('user_id, programa').in('user_id', userIds),
        ]);

        const users = filteredUserRoles.map(ur => {
          const profile = profilesResult.data?.find(p => p.id === ur.user_id);
          const escolas = entidadesResult.data
            ?.filter(e => e.user_id === ur.user_id)
            .map(e => e.escola_id) || [];
          const programas = programasResult.data
            ?.filter(p => p.user_id === ur.user_id)
            .map(p => p.programa) || [];

          return {
            id: ur.user_id,
            nome: profile?.nome || '',
            email: profile?.email || '',
            telefone: profile?.telefone || '',
            role: ur.role,
            escolasIds: escolas,
            programas,
            createdAt: profile?.created_at
          };
        }).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'));

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    const corsHeaders = getCorsHeaders(req);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ error: message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});