import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { getCorsHeaders } from '../_shared/cors.ts';
import { isValidEmail, isValidUUID, isValidPhone, isValidPassword, sanitizeString, validateUUIDArray, validateProgramas } from '../_shared/validation.ts';
import { checkRateLimit } from '../_shared/rateLimit.ts';

// Valid roles for the N1-N8 hierarchy
const ALL_ROLES = [
  'admin', 'gestor', 'n3_coordenador_programa',
  'n4_1_cped', 'n4_2_gpi', 'n5_formador',
  'n6_coord_pedagogico', 'n7_professor', 'n8_equipe_tecnica',
  // Legacy
  'aap_inicial', 'aap_portugues', 'aap_matematica',
];

const MANAGER_ROLES = ['admin', 'gestor', 'n3_coordenador_programa'];

// Role hierarchy level (lower number = higher privilege)
const ROLE_LEVEL: Record<string, number> = {
  'admin': 1,
  'gestor': 2,
  'n3_coordenador_programa': 3,
  'n4_1_cped': 4, 'n4_2_gpi': 4,
  'aap_inicial': 4, 'aap_portugues': 4, 'aap_matematica': 4,
  'n5_formador': 5,
  'n6_coord_pedagogico': 6,
  'n7_professor': 7,
  'n8_equipe_tecnica': 8,
};

const OPERATIONAL_ROLES = ['n4_1_cped', 'n4_2_gpi', 'n5_formador', 'aap_inicial', 'aap_portugues', 'aap_matematica'];

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

// Check if requester shares at least one programa with target
async function sharesPrograma(supabaseAdmin: ReturnType<typeof createClient>, requesterId: string, targetId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc('shares_programa', {
    _viewer_id: requesterId,
    _target_id: targetId,
  });
  return data === true;
}

// Check if requester shares at least one entidade with target
async function sharesEntidade(supabaseAdmin: ReturnType<typeof createClient>, requesterId: string, targetId: string): Promise<boolean> {
  const { data } = await supabaseAdmin.rpc('shares_entidade', {
    _viewer_id: requesterId,
    _target_id: targetId,
  });
  return data === true;
}

// Check if requester (N1-N5) can reset the target's password
async function canResetPassword(
  supabaseAdmin: ReturnType<typeof createClient>,
  requesterRole: string,
  requesterId: string,
  targetId: string,
): Promise<boolean> {
  // N1 admin can reset anyone
  if (requesterRole === 'admin') return true;

  // Get target role
  const targetRole = await getRequesterRole(supabaseAdmin, targetId);
  if (!targetRole) return false;

  const requesterLevel = ROLE_LEVEL[requesterRole] ?? 99;
  const targetLevel = ROLE_LEVEL[targetRole] ?? 99;

  // Cannot reset someone at the same level or higher
  if (targetLevel <= requesterLevel) return false;

  // N2/N3 managers: target must share programa
  if (requesterRole === 'gestor' || requesterRole === 'n3_coordenador_programa') {
    return sharesPrograma(supabaseAdmin, requesterId, targetId);
  }

  // N4/N5 operational: target must share entidade
  if (OPERATIONAL_ROLES.includes(requesterRole)) {
    return sharesEntidade(supabaseAdmin, requesterId, targetId);
  }

  return false;
}

function jsonResponse(body: object, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
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
      return jsonResponse({ error: 'Unauthorized' }, 401, corsHeaders);
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !requestingUser) {
      return jsonResponse({ error: 'Invalid token' }, 401, corsHeaders);
    }

    const requesterRole = await getRequesterRole(supabaseAdmin, requestingUser.id);

    // Rate limit: 20 requests per minute per user
    if (!checkRateLimit(`manage-users:${requestingUser.id}`, 20, 60_000)) {
      return jsonResponse({ error: 'Limite de requisições excedido. Aguarde um momento.' }, 429, corsHeaders);
    }

    const { action, ...params } = await req.json();

    // For reset-password, allow N1-N5 with scope checks
    // For all other actions, require admin
    if (action === 'reset-password') {
      const requesterLevel = ROLE_LEVEL[requesterRole ?? ''] ?? 99;
      if (requesterLevel > 5) {
        return jsonResponse({ error: 'Sem permissão para redefinir senhas' }, 403, corsHeaders);
      }
    } else {
      if (requesterRole !== 'admin') {
        return jsonResponse({ error: 'Apenas administradores podem gerenciar usuários por esta função' }, 403, corsHeaders);
      }
    }

    switch (action) {
      case 'create':
      case 'create-batch': {
        const { email, password, nome, telefone, role, mustChangePassword, programas, entidadeIds } = params;

        // Validate email
        if (!email || !isValidEmail(email)) {
          return jsonResponse({ error: 'E-mail inválido' }, 400, corsHeaders);
        }

        // Validate password
        const pwCheck = isValidPassword(password);
        if (!pwCheck.valid) {
          return jsonResponse({ error: pwCheck.error }, 400, corsHeaders);
        }

        // Validate nome
        if (!nome || typeof nome !== 'string' || nome.trim().length === 0) {
          return jsonResponse({ error: 'Nome é obrigatório' }, 400, corsHeaders);
        }
        const sanitizedNome = sanitizeString(nome, 255);

        // Validate telefone
        if (telefone && !isValidPhone(telefone)) {
          return jsonResponse({ error: 'Telefone inválido' }, 400, corsHeaders);
        }

        // Validate role
        if (role && !ALL_ROLES.includes(role)) {
          return jsonResponse({ error: 'Role inválido' }, 400, corsHeaders);
        }

        // Validate programas
        if (programas !== undefined) {
          const validProgramas = validateProgramas(programas);
          if (validProgramas === null) {
            return jsonResponse({ error: 'Programas inválidos' }, 400, corsHeaders);
          }
        }

        // Validate entidadeIds
        if (entidadeIds !== undefined) {
          const validIds = validateUUIDArray(entidadeIds);
          if (validIds === null) {
            return jsonResponse({ error: 'IDs de entidade inválidos' }, 400, corsHeaders);
          }
        }

        // Create user
        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email, password, email_confirm: true, user_metadata: { nome: sanitizedNome },
        });

        if (createError) {
          return jsonResponse({ error: createError.message }, 400, corsHeaders);
        }

        if (newUser.user) {
          // Update profile
          const updateData: Record<string, unknown> = {};
          if (telefone) updateData.telefone = sanitizeString(telefone, 20);
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

        return jsonResponse({ success: true, user: newUser.user }, 200, corsHeaders);
      }

      case 'delete': {
        const { userId } = params;

        if (!userId || !isValidUUID(userId)) {
          return jsonResponse({ error: 'User ID inválido' }, 400, corsHeaders);
        }

        if (userId === requestingUser.id) {
          return jsonResponse({ error: 'Cannot delete your own account' }, 400, corsHeaders);
        }

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

        if (deleteError) {
          return jsonResponse({ error: deleteError.message }, 400, corsHeaders);
        }

        return jsonResponse({ success: true }, 200, corsHeaders);
      }

      case 'update': {
        const { userId, email, nome, telefone } = params;

        if (!userId || !isValidUUID(userId)) {
          return jsonResponse({ error: 'User ID inválido' }, 400, corsHeaders);
        }

        if (email && !isValidEmail(email)) {
          return jsonResponse({ error: 'E-mail inválido' }, 400, corsHeaders);
        }

        if (telefone !== undefined && telefone !== null && telefone !== '' && !isValidPhone(telefone)) {
          return jsonResponse({ error: 'Telefone inválido' }, 400, corsHeaders);
        }

        // Check duplicate email
        if (email) {
          const { data: existingProfile } = await supabaseAdmin
            .from('profiles').select('id').eq('email', email).neq('id', userId).maybeSingle();
          
          if (existingProfile) {
            return jsonResponse({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }, 200, corsHeaders);
          }

          const { error: updateAuthError } = await supabaseAdmin.auth.admin.updateUserById(userId, { email });
          if (updateAuthError) {
            const errorMessage = updateAuthError.message.toLowerCase();
            if (errorMessage.includes('already') || errorMessage.includes('duplicate') || errorMessage.includes('exists') || errorMessage.includes('unique')) {
              return jsonResponse({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }, 200, corsHeaders);
            }
            return jsonResponse({ error: 'Erro ao atualizar e-mail' }, 400, corsHeaders);
          }
        }

        const updateData: Record<string, string> = {};
        if (nome) updateData.nome = sanitizeString(nome, 255);
        if (telefone !== undefined) updateData.telefone = telefone ? sanitizeString(telefone, 20) : telefone;
        if (email) updateData.email = email;

        if (Object.keys(updateData).length > 0) {
          const { error: profileError } = await supabaseAdmin.from('profiles').update(updateData).eq('id', userId);
          if (profileError) {
            const errorMessage = profileError.message?.toLowerCase() || '';
            if (errorMessage.includes('duplicate') || errorMessage.includes('unique') || errorMessage.includes('already')) {
              return jsonResponse({ success: false, error: 'Este e-mail já está em uso por outro usuário', code: 'email_exists' }, 200, corsHeaders);
            }
            return jsonResponse({ error: 'Erro ao atualizar perfil' }, 400, corsHeaders);
          }
        }

        return jsonResponse({ success: true }, 200, corsHeaders);
      }

      case 'reset-password': {
        const { userId, newPassword } = params;

        if (!userId || !isValidUUID(userId)) {
          return jsonResponse({ error: 'User ID inválido' }, 400, corsHeaders);
        }

        const pwCheck = isValidPassword(newPassword);
        if (!pwCheck.valid) {
          return jsonResponse({ error: pwCheck.error }, 400, corsHeaders);
        }

        // Verify scope: requester must be allowed to reset this target
        const allowed = await canResetPassword(supabaseAdmin, requesterRole!, requestingUser.id, userId);
        if (!allowed) {
          return jsonResponse({ error: 'Sem permissão para redefinir a senha deste usuário' }, 403, corsHeaders);
        }

        const { error: resetError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
          password: newPassword,
        });

        if (resetError) {
          return jsonResponse({ error: resetError.message }, 400, corsHeaders);
        }

        // Mark must_change_password = true so user is forced to change on next login
        await supabaseAdmin.from('profiles').update({ must_change_password: true }).eq('id', userId);

        return jsonResponse({ success: true }, 200, corsHeaders);
      }

      default:
        return jsonResponse({ error: 'Invalid action' }, 400, corsHeaders);
    }
  } catch (error) {
    console.error('Error:', error);
    const corsHeaders = getCorsHeaders(req);
    return jsonResponse({ error: 'Internal server error' }, 500, corsHeaders);
  }
});
