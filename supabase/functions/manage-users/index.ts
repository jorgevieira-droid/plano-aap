import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';

// Valid roles for the N1-N8 hierarchy
const ALL_ROLES = [
  'admin', 'gestor', 'n3_coordenador_programa',
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
  // Legacy
  'aap_inicial', 'aap_portugues', 'aap_matematica',
];

const MANAGER_ROLES = ['admin', 'gestor', 'n3_coordenador_programa'];

async function getRequesterRole(supabaseAdmin: ReturnType<typeof createClient>, userId: string) {
  const { data } = await supabaseAdmin
    .from('user_roles')
    .select('role')
    .eq('user_id', userId)
    .maybeSingle();
  return data?.role || null;
}

async function getRequesterProgramas(supabaseAdmin: ReturnType<typeof createClient>, userId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('user_programas')
    .select('programa')
    .eq('user_id', userId);
  return data?.map(p => p.programa) || [];
}

// Roles that a manager (N2/N3) can manage - they cannot manage N1 or other N2/N3
function canManagerManageRole(requesterRole: string, targetRole: string): boolean {
  if (requesterRole === 'admin') return true;
  if (requesterRole === 'gestor') return targetRole !== 'admin' && targetRole !== 'gestor';
  if (requesterRole === 'n3_coordenador_programa') return !MANAGER_ROLES.includes(targetRole);
  return false;
}

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    // Verify requesting user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const requesterRole = await getRequesterRole(supabaseAdmin, requestingUser.id);
    
    // Only admins can use this endpoint (manage-users is for admin user management)
    if (requesterRole !== 'admin') {
      return new Response(JSON.stringify({ error: 'Apenas administradores podem gerenciar usuários por esta função' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { action, ...params } = await req.json();

    switch (action) {
      case 'create':
      case 'create-batch': {
        const { email, password, nome, telefone, role, mustChangePassword, programas, entidadeIds } = params;

        if (!email || !password || !nome) {
          return new Response(JSON.stringify({ error: 'Email, password and name are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (password.length < 8) {
          return new Response(JSON.stringify({ error: 'A senha deve ter pelo menos 8 caracteres' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (role && !ALL_ROLES.includes(role)) {
          return new Response(JSON.stringify({ error: `Role inválido: ${role}` }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { nome },
        });

        if (createError) {
          return new Response(JSON.stringify({ error: createError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (newUser.user) {
          // Update profile
          const updateData: Record<string, unknown> = {};
          if (telefone) updateData.telefone = telefone;
          if (mustChangePassword === true) updateData.must_change_password = true;
          if (Object.keys(updateData).length > 0) {
            await supabaseAdmin.from('profiles').update(updateData).eq('id', newUser.user.id);
          }

          // Assign role
          if (role) {
            await supabaseAdmin.from('user_roles').insert({ user_id: newUser.user.id, role });
          }

          // Assign programas to unified user_programas
          if (programas && Array.isArray(programas) && programas.length > 0) {
            const programasToInsert = programas.map((p: string) => ({
              user_id: newUser.user!.id,
              programa: p,
            }));
            await supabaseAdmin.from('user_programas').insert(programasToInsert);
            
            // Also insert into legacy tables for compatibility
            if (role?.startsWith('aap_') || role === 'n5_formador') {
              const legacyProgramas = programas.map((p: string) => ({ aap_user_id: newUser.user!.id, programa: p }));
              await supabaseAdmin.from('aap_programas').insert(legacyProgramas);
            } else if (role === 'gestor') {
              const legacyProgramas = programas.map((p: string) => ({ gestor_user_id: newUser.user!.id, programa: p }));
              await supabaseAdmin.from('gestor_programas').insert(legacyProgramas);
            }
          }

          // Assign entidades to unified user_entidades
          if (entidadeIds && Array.isArray(entidadeIds) && entidadeIds.length > 0) {
            const entidadesToInsert = entidadeIds.map((escolaId: string) => ({
              user_id: newUser.user!.id,
              escola_id: escolaId,
            }));
            await supabaseAdmin.from('user_entidades').insert(entidadesToInsert);
            
            // Also insert into legacy aap_escolas for compatibility
            if (role?.startsWith('aap_') || role === 'n5_formador' || role === 'n4_1_cped' || role === 'n4_2_gpi') {
              const legacyEscolas = entidadeIds.map((escolaId: string) => ({ aap_user_id: newUser.user!.id, escola_id: escolaId }));
              await supabaseAdmin.from('aap_escolas').insert(legacyEscolas);
            }
          }
        }

        return new Response(JSON.stringify({ success: true, user: newUser.user }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'delete': {
        const { userId } = params;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        if (userId === requestingUser.id) {
          return new Response(JSON.stringify({ error: 'Cannot delete your own account' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
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

      case 'update': {
        const { userId, email, nome, telefone } = params;

        if (!userId) {
          return new Response(JSON.stringify({ error: 'User ID is required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Check duplicate email
        if (email) {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles').select('id').eq('email', email).neq('id', userId).maybeSingle();
          
          if (existingProfile) {
            return new Response(JSON.stringify({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }), {
              status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }

          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
          if (updateAuthError) {
            const errorMessage = updateAuthError.message.toLowerCase();
            if (errorMessage.includes('already') || errorMessage.includes('duplicate') || errorMessage.includes('exists') || errorMessage.includes('unique')) {
              return new Response(JSON.stringify({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            return new Response(JSON.stringify({ error: 'Erro ao atualizar e-mail: ' + updateAuthError.message }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        const updateData: Record<string, string> = {};
        if (nome) updateData.nome = nome;
        if (telefone !== undefined) updateData.telefone = telefone;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
          const { error: profileError } = await supabaseAdmin.from('profiles').update(updateData).eq('id', userId);
          if (profileError) {
            const errorMessage = profileError.message?.toLowerCase() || '';
            if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorMessage.includes('already')) {
              return new Response(JSON.stringify({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }), {
                status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
              });
            }
            return new Response(JSON.stringify({ error: 'Erro ao atualizar perfil: ' + profileError.message }), {
              status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'reset-password': {
        const { userId, newPassword } = params;

        if (!userId || !newPassword) {
          return new Response(JSON.stringify({ error: 'User ID and new password are required' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (resetError) {
          return new Response(JSON.stringify({ error: resetError.message }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('Error:', error);
    const corsHeaders = getCorsHeaders(req);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});