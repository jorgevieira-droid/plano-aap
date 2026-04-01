import { AppRole, ProgramaType } from '@/contexts/AuthContext';
import { ACAO_PERMISSION_MATRIX, AcaoTipo, normalizeAcaoTipo } from '@/config/acaoPermissions';
import { getRoleLevel } from '@/config/roleConfig';

export type SimulationOperation =
  | 'create_programacao'
  | 'manage_programacao'
  | 'save_instrument'
  | 'save_presencas'
  | 'save_avaliacoes'
  | 'delete_programacao';

interface SimulationContext {
  /** Programas vinculados ao registro/programação sendo operada */
  recordProgramas?: string[];
  /** Entidade (escola) do registro */
  recordEscolaId?: string;
  /** aap_id do registro (dono original) */
  recordAapId?: string;
  /** Tipo da ação */
  acaoTipo?: string;
}

interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

/**
 * Valida se uma operação seria permitida para o papel efetivo simulado.
 * Quando NÃO está simulando, sempre retorna allowed: true (a RLS real cuida da validação).
 */
export function checkSimulatedPermission(params: {
  effectiveRole: AppRole | undefined;
  isSimulating: boolean;
  operation: SimulationOperation;
  userId: string;
  userProgramas: ProgramaType[];
  userEntidadeIds: string[];
  context: SimulationContext;
}): PermissionResult {
  const { effectiveRole, isSimulating, operation, userId, userProgramas, userEntidadeIds, context } = params;

  // Se não está simulando, não interferir — RLS real decide
  if (!isSimulating) return { allowed: true };
  if (!effectiveRole) return { allowed: false, reason: 'Papel não definido' };

  const roleLevel = getRoleLevel(effectiveRole);
  const acaoTipo = context.acaoTipo ? normalizeAcaoTipo(context.acaoTipo) : undefined;

  // N1 admin: tudo permitido
  if (effectiveRole === 'admin') return { allowed: true };

  // Verificar permissão da matriz de ações
  if (acaoTipo && ACAO_PERMISSION_MATRIX[acaoTipo]) {
    const perm = ACAO_PERMISSION_MATRIX[acaoTipo][effectiveRole];
    if (!perm) return { allowed: false, reason: `Papel "${effectiveRole}" não tem permissão para esta ação` };

    // Verificar se pode criar/editar
    if (['create_programacao'].includes(operation) && !perm.canCreate) {
      return { allowed: false, reason: `Este perfil não pode criar ações do tipo "${acaoTipo}"` };
    }
    if (['delete_programacao'].includes(operation) && !perm.canDelete) {
      return { allowed: false, reason: `Este perfil não pode excluir ações do tipo "${acaoTipo}"` };
    }
    if (['manage_programacao', 'save_instrument', 'save_presencas', 'save_avaliacoes'].includes(operation) && !perm.canEdit && !perm.canCreate) {
      return { allowed: false, reason: `Este perfil não pode gerenciar ações do tipo "${acaoTipo}"` };
    }

    // Verificar escopo
    const scope = perm.viewScope;

    // Escopo por programa (N2, N3)
    if (scope === 'programa' && context.recordProgramas && context.recordProgramas.length > 0) {
      const hasMatchingPrograma = context.recordProgramas.some(p =>
        userProgramas.includes(p as ProgramaType)
      );
      if (!hasMatchingPrograma) {
        return {
          allowed: false,
          reason: 'Este perfil não tem acesso ao programa desta ação. Programas do usuário: ' +
            (userProgramas.length > 0 ? userProgramas.join(', ') : 'nenhum'),
        };
      }
    }

    // Escopo por entidade (N4, N5, N6, N7)
    if (scope === 'entidade' && context.recordEscolaId) {
      if (!userEntidadeIds.includes(context.recordEscolaId)) {
        return {
          allowed: false,
          reason: 'Este perfil não está vinculado à entidade desta ação',
        };
      }
    }

    // Escopo próprio (N7)
    if (scope === 'proprio' && context.recordAapId) {
      if (context.recordAapId !== userId) {
        return {
          allowed: false,
          reason: 'Este perfil só pode operar em registros próprios',
        };
      }
    }
  }

  // N8 (equipe técnica): somente leitura na maioria dos casos
  if (effectiveRole === 'n8_equipe_tecnica') {
    if (['create_programacao', 'manage_programacao', 'save_instrument', 'save_presencas', 'delete_programacao'].includes(operation)) {
      // Verificar se a matriz permite para este tipo específico
      if (acaoTipo && ACAO_PERMISSION_MATRIX[acaoTipo]) {
        const perm = ACAO_PERMISSION_MATRIX[acaoTipo][effectiveRole];
        if (!perm?.canCreate && !perm?.canEdit) {
          return { allowed: false, reason: 'Equipe Técnica não tem permissão de escrita para este tipo de ação' };
        }
      }
    }
  }

  return { allowed: true };
}
