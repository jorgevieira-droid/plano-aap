-- Índices para filtros/ordenações mais frequentes
CREATE INDEX IF NOT EXISTS idx_registros_acao_status_data ON public.registros_acao (status, data);
CREATE INDEX IF NOT EXISTS idx_registros_acao_escola_id ON public.registros_acao (escola_id);
CREATE INDEX IF NOT EXISTS idx_registros_acao_aap_id ON public.registros_acao (aap_id);
CREATE INDEX IF NOT EXISTS idx_registros_acao_tipo ON public.registros_acao (tipo);
CREATE INDEX IF NOT EXISTS idx_registros_acao_data ON public.registros_acao (data);

CREATE INDEX IF NOT EXISTS idx_programacoes_data ON public.programacoes (data);
CREATE INDEX IF NOT EXISTS idx_programacoes_escola_id ON public.programacoes (escola_id);
CREATE INDEX IF NOT EXISTS idx_programacoes_aap_id ON public.programacoes (aap_id);
CREATE INDEX IF NOT EXISTS idx_programacoes_status ON public.programacoes (status);

CREATE INDEX IF NOT EXISTS idx_instrument_responses_form_type_created ON public.instrument_responses (form_type, created_at);
CREATE INDEX IF NOT EXISTS idx_instrument_responses_registro_acao_id ON public.instrument_responses (registro_acao_id);
CREATE INDEX IF NOT EXISTS idx_instrument_responses_escola_id ON public.instrument_responses (escola_id);
CREATE INDEX IF NOT EXISTS idx_instrument_responses_aap_id ON public.instrument_responses (aap_id);

-- Índices para as funções auxiliares de permissão (RLS)
CREATE INDEX IF NOT EXISTS idx_user_entidades_user_escola ON public.user_entidades (user_id, escola_id);
CREATE INDEX IF NOT EXISTS idx_user_programas_user_programa ON public.user_programas (user_id, programa);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_role ON public.user_roles (user_id, role);
CREATE INDEX IF NOT EXISTS idx_gestor_programas_user_programa ON public.gestor_programas (gestor_user_id, programa);

-- Permite reaproveitamento do resultado das funções auxiliares dentro da mesma consulta
ALTER FUNCTION public.is_admin(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_gestor(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_admin_or_gestor(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_manager(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_operational(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_local_user(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.is_observer(uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.has_role(uuid, public.app_role) STABLE PARALLEL SAFE;
ALTER FUNCTION public.user_has_entidade(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.user_has_programa(uuid, text) STABLE PARALLEL SAFE;
ALTER FUNCTION public.user_has_escola_via_programa(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.user_has_full_data_access(uuid, uuid, text[]) STABLE PARALLEL SAFE;
ALTER FUNCTION public.shares_programa(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.shares_entidade(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.gestor_has_programa(uuid, text) STABLE PARALLEL SAFE;
ALTER FUNCTION public.gestor_can_view_escola(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.gestor_can_view_professor(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.gestor_can_view_programacao(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.gestor_can_view_registro(uuid, uuid) STABLE PARALLEL SAFE;
ALTER FUNCTION public.user_can_view_redes_municipio(uuid, text) STABLE PARALLEL SAFE;