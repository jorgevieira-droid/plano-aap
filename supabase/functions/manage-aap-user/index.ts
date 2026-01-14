import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Get the authorization header to verify the requesting user is admin or gestor
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify the requesting user
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } }
    });
    
    const { data: { user: requestingUser }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !requestingUser) {
      console.error('Auth error:', authError);
      return new Response(JSON.stringify({ error: 'Não autorizado' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Check if requesting user is admin or gestor
    const { data: isAdmin } = await supabaseAdmin.rpc('is_admin', { _user_id: requestingUser.id });
    const { data: isGestor } = await supabaseAdmin.rpc('is_gestor', { _user_id: requestingUser.id });
    
    if (!isAdmin && !isGestor) {
      console.log('User is not admin or gestor:', requestingUser.id);
      return new Response(JSON.stringify({ error: 'Apenas administradores e gestores podem gerenciar AAPs' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get gestor's programs if user is gestor
    let gestorProgramas: string[] = [];
    if (isGestor && !isAdmin) {
      const { data: programas } = await supabaseAdmin
        .from('gestor_programas')
        .select('programa')
        .eq('gestor_user_id', requestingUser.id);
      
      gestorProgramas = programas?.map(p => p.programa) || [];
      console.log('Gestor programas:', gestorProgramas);
    }

    const { action, ...data } = await req.json();
    console.log('Action:', action, 'Data:', data);

    switch (action) {
      case 'create': {
        const { email, password, nome, telefone, role, escolasIds, programas } = data;
        
        // Validate password length
        if (!password || password.length < 8) {
          return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        
        // If gestor, validate that the AAP's programas match gestor's programas
        if (isGestor && !isAdmin) {
          const aapProgramas = programas || ['escolas'];
          const hasValidPrograma = aapProgramas.some((p: string) => gestorProgramas.includes(p));
          if (!hasValidPrograma) {
            return new Response(JSON.stringify({ error: 'Você só pode criar AAPs para seu programa' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }
        
        // Create user with admin client
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email,
          password,
          email_confirm: true,
          user_metadata: { nome }
        });

        if (createError) {
          console.error('Create user error:', createError);
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Update profile with additional data
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ nome, telefone })
          .eq('id', newUser.user.id);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Assign role
        const { error: roleError } = await supabaseAdmin
          .from('user_roles')
          .insert({ user_id: newUser.user.id, role });

        if (roleError) {
          console.error('Role assignment error:', roleError);
        }

        // Assign AAP programas
        const aapProgramas = programas || (isGestor && !isAdmin ? gestorProgramas : ['escolas']);
        if (aapProgramas.length > 0) {
          const programaAssignments = aapProgramas.map((programa: string) => ({
            aap_user_id: newUser.user.id,
            programa
          }));
          
          const { error: programasError } = await supabaseAdmin
            .from('aap_programas')
            .insert(programaAssignments);

          if (programasError) {
            console.error('Programas assignment error:', programasError);
          }
        }

        // Assign schools
        if (escolasIds && escolasIds.length > 0) {
          // If gestor, validate that schools belong to their programa
          if (isGestor && !isAdmin) {
            const { data: validEscolas } = await supabaseAdmin
              .from('escolas')
              .select('id, programa')
              .in('id', escolasIds);
            
            const validEscolaIds = validEscolas
              ?.filter(e => e.programa?.some((p: string) => gestorProgramas.includes(p)))
              .map(e => e.id) || [];
            
            if (validEscolaIds.length !== escolasIds.length) {
              console.log('Some schools filtered out for gestor');
            }
            
            if (validEscolaIds.length > 0) {
              const escolaAssignments = validEscolaIds.map((escolaId: string) => ({
                aap_user_id: newUser.user.id,
                escola_id: escolaId
              }));
              
              await supabaseAdmin.from('aap_escolas').insert(escolaAssignments);
            }
          } else {
            const escolaAssignments = escolasIds.map((escolaId: string) => ({
              aap_user_id: newUser.user.id,
              escola_id: escolaId
            }));
            
            const { error: escolasError } = await supabaseAdmin
              .from('aap_escolas')
              .insert(escolaAssignments);

            if (escolasError) {
              console.error('Escolas assignment error:', escolasError);
            }
          }
        }

        return new Response(JSON.stringify({ 
          success: true, 
          user: { id: newUser.user.id, email: newUser.user.email } 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'update': {
        const { userId, email, password, nome, telefone, role, escolasIds, programas } = data;

        // If gestor, validate they can manage this AAP
        if (isGestor && !isAdmin) {
          const { data: aapProgramas } = await supabaseAdmin
            .from('aap_programas')
            .select('programa')
            .eq('aap_user_id', userId);
          
          const aapProgramaList = aapProgramas?.map(p => p.programa) || [];
          const canManage = aapProgramaList.some((p: string) => gestorProgramas.includes(p));
          
          if (!canManage) {
            return new Response(JSON.stringify({ error: 'Você não pode editar AAPs de outros programas' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update user email/password if provided
        if (email || password) {
          const updateData: any = {};
          if (email) updateData.email = email;
          if (password) updateData.password = password;
          
          const { error: updateUserError } = await supabaseAdmin.auth.admin.updateUserById(
            userId,
            updateData
          );

          if (updateUserError) {
            console.error('Update user error:', updateUserError);
            return new Response(JSON.stringify({ error: updateUserError.message }), {
              status: 400,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        // Update profile
        const { error: profileError } = await supabaseAdmin
          .from('profiles')
          .update({ nome, telefone, email: email || undefined })
          .eq('id', userId);

        if (profileError) {
          console.error('Profile update error:', profileError);
        }

        // Update role
        if (role) {
          await supabaseAdmin.from('user_roles').delete().eq('user_id', userId);
          await supabaseAdmin.from('user_roles').insert({ user_id: userId, role });
        }

        // Update AAP programas (only if admin or if programas provided)
        if (isAdmin && programas !== undefined) {
          await supabaseAdmin.from('aap_programas').delete().eq('aap_user_id', userId);
          
          if (programas.length > 0) {
            const programaAssignments = programas.map((programa: string) => ({
              aap_user_id: userId,
              programa
            }));
            await supabaseAdmin.from('aap_programas').insert(programaAssignments);
          }
        }

        // Update school assignments
        if (escolasIds !== undefined) {
          await supabaseAdmin.from('aap_escolas').delete().eq('aap_user_id', userId);
          
          if (escolasIds.length > 0) {
            // If gestor, validate schools
            if (isGestor && !isAdmin) {
              const { data: validEscolas } = await supabaseAdmin
                .from('escolas')
                .select('id, programa')
                .in('id', escolasIds);
              
              const validEscolaIds = validEscolas
                ?.filter(e => e.programa?.some((p: string) => gestorProgramas.includes(p)))
                .map(e => e.id) || [];
              
              if (validEscolaIds.length > 0) {
                const escolaAssignments = validEscolaIds.map((escolaId: string) => ({
                  aap_user_id: userId,
                  escola_id: escolaId
                }));
                await supabaseAdmin.from('aap_escolas').insert(escolaAssignments);
              }
            } else {
              const escolaAssignments = escolasIds.map((escolaId: string) => ({
                aap_user_id: userId,
                escola_id: escolaId
              }));
              await supabaseAdmin.from('aap_escolas').insert(escolaAssignments);
            }
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { userId } = data;

        // If gestor, validate they can delete this AAP
        if (isGestor && !isAdmin) {
          const { data: aapProgramas } = await supabaseAdmin
            .from('aap_programas')
            .select('programa')
            .eq('aap_user_id', userId);
          
          const aapProgramaList = aapProgramas?.map(p => p.programa) || [];
          const canManage = aapProgramaList.some((p: string) => gestorProgramas.includes(p));
          
          if (!canManage) {
            return new Response(JSON.stringify({ error: 'Você não pode excluir AAPs de outros programas' }), {
              status: 403,
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          console.error('Delete user error:', deleteError);
          return new Response(JSON.stringify({ error: deleteError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'list': {
        // Get all AAP users (aap_ roles only, exclude admin and gestor)
        const { data: userRoles, error: rolesError } = await supabaseAdmin
          .from('user_roles')
          .select('user_id, role')
          .in('role', ['aap_inicial', 'aap_portugues', 'aap_matematica']);

        if (rolesError) {
          console.error('Roles fetch error:', rolesError);
          return new Response(JSON.stringify({ error: rolesError.message }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        let filteredUserRoles = userRoles || [];

        // If gestor, filter AAPs by programa
        if (isGestor && !isAdmin && gestorProgramas.length > 0) {
          const userIds = userRoles?.map(r => r.user_id) || [];
          
          if (userIds.length > 0) {
            // Get AAPs that have matching programas
            const { data: aapProgramas } = await supabaseAdmin
              .from('aap_programas')
              .select('aap_user_id, programa')
              .in('aap_user_id', userIds);
            
            const validUserIds = new Set(
              aapProgramas
                ?.filter(ap => gestorProgramas.includes(ap.programa))
                .map(ap => ap.aap_user_id) || []
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

        // Get profiles for these users
        const { data: profiles, error: profilesError } = await supabaseAdmin
          .from('profiles')
          .select('*')
          .in('id', userIds);

        if (profilesError) {
          console.error('Profiles fetch error:', profilesError);
        }

        // Get escola assignments
        const { data: escolaAssignments, error: escolasError } = await supabaseAdmin
          .from('aap_escolas')
          .select('aap_user_id, escola_id')
          .in('aap_user_id', userIds);

        if (escolasError) {
          console.error('Escolas fetch error:', escolasError);
        }

        // Get programa assignments
        const { data: programaAssignments, error: programasError } = await supabaseAdmin
          .from('aap_programas')
          .select('aap_user_id, programa')
          .in('aap_user_id', userIds);

        if (programasError) {
          console.error('Programas fetch error:', programasError);
        }

        // Combine data
        const users = filteredUserRoles.map(ur => {
          const profile = profiles?.find(p => p.id === ur.user_id);
          const escolas = escolaAssignments
            ?.filter(ea => ea.aap_user_id === ur.user_id)
            .map(ea => ea.escola_id) || [];
          const programas = programaAssignments
            ?.filter(pa => pa.aap_user_id === ur.user_id)
            .map(pa => pa.programa) || [];

          return {
            id: ur.user_id,
            nome: profile?.nome || '',
            email: profile?.email || '',
            telefone: profile?.telefone || '',
            role: ur.role,
            escolasIds: escolas,
            programas: programas,
            createdAt: profile?.created_at
          };
        }) || [];

        return new Response(JSON.stringify({ users }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Ação inválida' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Edge function error:', error);
    const message = error instanceof Error ? error.message : 'Erro interno do servidor';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
