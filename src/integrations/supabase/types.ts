export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      aap_escolas: {
        Row: {
          aap_user_id: string
          created_at: string
          escola_id: string
          id: string
        }
        Insert: {
          aap_user_id: string
          created_at?: string
          escola_id: string
          id?: string
        }
        Update: {
          aap_user_id?: string
          created_at?: string
          escola_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aap_escolas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      aap_programas: {
        Row: {
          aap_user_id: string
          created_at: string
          id: string
          programa: Database["public"]["Enums"]["programa_type"]
        }
        Insert: {
          aap_user_id: string
          created_at?: string
          id?: string
          programa: Database["public"]["Enums"]["programa_type"]
        }
        Update: {
          aap_user_id?: string
          created_at?: string
          id?: string
          programa?: Database["public"]["Enums"]["programa_type"]
        }
        Relationships: []
      }
      avaliacoes_aula: {
        Row: {
          aap_id: string
          clareza_objetivos: number
          created_at: string
          dominio_conteudo: number
          engajamento_turma: number
          escola_id: string
          estrategias_didaticas: number
          gestao_tempo: number
          id: string
          observacoes: string | null
          professor_id: string
          questoes_selecionadas: Json | null
          registro_acao_id: string
        }
        Insert: {
          aap_id: string
          clareza_objetivos?: number
          created_at?: string
          dominio_conteudo?: number
          engajamento_turma?: number
          escola_id: string
          estrategias_didaticas?: number
          gestao_tempo?: number
          id?: string
          observacoes?: string | null
          professor_id: string
          questoes_selecionadas?: Json | null
          registro_acao_id: string
        }
        Update: {
          aap_id?: string
          clareza_objetivos?: number
          created_at?: string
          dominio_conteudo?: number
          engajamento_turma?: number
          escola_id?: string
          estrategias_didaticas?: number
          gestao_tempo?: number
          id?: string
          observacoes?: string | null
          professor_id?: string
          questoes_selecionadas?: Json | null
          registro_acao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "avaliacoes_aula_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_aula_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_aula_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_aula_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "avaliacoes_aula_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      bigquery_sync_state: {
        Row: {
          last_error: string | null
          last_status: string
          last_synced_at: string
          rows_exported: number
          table_name: string
          updated_at: string
        }
        Insert: {
          last_error?: string | null
          last_status?: string
          last_synced_at?: string
          rows_exported?: number
          table_name: string
          updated_at?: string
        }
        Update: {
          last_error?: string | null
          last_status?: string
          last_synced_at?: string
          rows_exported?: number
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      consultoria_pedagogica_respostas: {
        Row: {
          aap_id: string
          acomp_devolutivas_coord: number | null
          agenda_alterada: boolean | null
          agenda_alterada_razoes: string | null
          agenda_planejada: boolean | null
          analise_dados: boolean | null
          atpcs_acomp_coord: number | null
          atpcs_ministrados: number | null
          aulas_obs_lp: number | null
          aulas_obs_mat: number | null
          aulas_obs_oe_lp: number | null
          aulas_obs_oe_mat: number | null
          aulas_obs_parceria_coord: number | null
          aulas_obs_turma_adaptada: number | null
          aulas_obs_turma_padrao: number | null
          aulas_tutoria_obs: number | null
          boas_praticas: string | null
          created_at: string | null
          devolutivas_coord_atpc: number | null
          devolutivas_model_coord: number | null
          devolutivas_professor: number | null
          encaminhamentos: string | null
          escola_id: string
          escola_voar: boolean | null
          etapa_ensino: string[] | null
          id: string
          outros_pontos: string | null
          participantes: string[] | null
          participantes_outros: string | null
          pauta_formativa: boolean | null
          pontos_preocupacao: string | null
          professores_observados: number | null
          registro_acao_id: string
        }
        Insert: {
          aap_id: string
          acomp_devolutivas_coord?: number | null
          agenda_alterada?: boolean | null
          agenda_alterada_razoes?: string | null
          agenda_planejada?: boolean | null
          analise_dados?: boolean | null
          atpcs_acomp_coord?: number | null
          atpcs_ministrados?: number | null
          aulas_obs_lp?: number | null
          aulas_obs_mat?: number | null
          aulas_obs_oe_lp?: number | null
          aulas_obs_oe_mat?: number | null
          aulas_obs_parceria_coord?: number | null
          aulas_obs_turma_adaptada?: number | null
          aulas_obs_turma_padrao?: number | null
          aulas_tutoria_obs?: number | null
          boas_praticas?: string | null
          created_at?: string | null
          devolutivas_coord_atpc?: number | null
          devolutivas_model_coord?: number | null
          devolutivas_professor?: number | null
          encaminhamentos?: string | null
          escola_id: string
          escola_voar?: boolean | null
          etapa_ensino?: string[] | null
          id?: string
          outros_pontos?: string | null
          participantes?: string[] | null
          participantes_outros?: string | null
          pauta_formativa?: boolean | null
          pontos_preocupacao?: string | null
          professores_observados?: number | null
          registro_acao_id: string
        }
        Update: {
          aap_id?: string
          acomp_devolutivas_coord?: number | null
          agenda_alterada?: boolean | null
          agenda_alterada_razoes?: string | null
          agenda_planejada?: boolean | null
          analise_dados?: boolean | null
          atpcs_acomp_coord?: number | null
          atpcs_ministrados?: number | null
          aulas_obs_lp?: number | null
          aulas_obs_mat?: number | null
          aulas_obs_oe_lp?: number | null
          aulas_obs_oe_mat?: number | null
          aulas_obs_parceria_coord?: number | null
          aulas_obs_turma_adaptada?: number | null
          aulas_obs_turma_padrao?: number | null
          aulas_tutoria_obs?: number | null
          boas_praticas?: string | null
          created_at?: string | null
          devolutivas_coord_atpc?: number | null
          devolutivas_model_coord?: number | null
          devolutivas_professor?: number | null
          encaminhamentos?: string | null
          escola_id?: string
          escola_voar?: boolean | null
          etapa_ensino?: string[] | null
          id?: string
          outros_pontos?: string | null
          participantes?: string[] | null
          participantes_outros?: string | null
          pauta_formativa?: boolean | null
          pontos_preocupacao?: string | null
          professores_observados?: number | null
          registro_acao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultoria_pedagogica_respostas_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultoria_pedagogica_respostas_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      email_send_log: {
        Row: {
          created_at: string
          error_message: string | null
          id: string
          message_id: string | null
          metadata: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email: string
          status: string
          template_name: string
        }
        Update: {
          created_at?: string
          error_message?: string | null
          id?: string
          message_id?: string | null
          metadata?: Json | null
          recipient_email?: string
          status?: string
          template_name?: string
        }
        Relationships: []
      }
      email_send_state: {
        Row: {
          auth_email_ttl_minutes: number
          batch_size: number
          id: number
          retry_after_until: string | null
          send_delay_ms: number
          transactional_email_ttl_minutes: number
          updated_at: string
        }
        Insert: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Update: {
          auth_email_ttl_minutes?: number
          batch_size?: number
          id?: number
          retry_after_until?: string | null
          send_delay_ms?: number
          transactional_email_ttl_minutes?: number
          updated_at?: string
        }
        Relationships: []
      }
      email_unsubscribe_tokens: {
        Row: {
          created_at: string
          email: string
          id: string
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          token: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      entidades_filho: {
        Row: {
          ativa: boolean
          codesc_filho: string
          created_at: string
          escola_id: string
          id: string
          nome: string
        }
        Insert: {
          ativa?: boolean
          codesc_filho: string
          created_at?: string
          escola_id: string
          id?: string
          nome: string
        }
        Update: {
          ativa?: boolean
          codesc_filho?: string
          created_at?: string
          escola_id?: string
          id?: string
          nome?: string
        }
        Relationships: [
          {
            foreignKeyName: "entidades_filho_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      escolas: {
        Row: {
          ativa: boolean
          cod_inep: string | null
          codesc: string | null
          created_at: string
          endereco: string | null
          id: string
          nome: string
          programa: Database["public"]["Enums"]["programa_type"][] | null
        }
        Insert: {
          ativa?: boolean
          cod_inep?: string | null
          codesc?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome: string
          programa?: Database["public"]["Enums"]["programa_type"][] | null
        }
        Update: {
          ativa?: boolean
          cod_inep?: string | null
          codesc?: string | null
          created_at?: string
          endereco?: string | null
          id?: string
          nome?: string
          programa?: Database["public"]["Enums"]["programa_type"][] | null
        }
        Relationships: []
      }
      form_config_settings: {
        Row: {
          form_key: string
          min_optional_questions: number
          programas: Database["public"]["Enums"]["programa_type"][]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          form_key: string
          min_optional_questions?: number
          programas?: Database["public"]["Enums"]["programa_type"][]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          form_key?: string
          min_optional_questions?: number
          programas?: Database["public"]["Enums"]["programa_type"][]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      form_field_config: {
        Row: {
          enabled: boolean
          field_key: string
          form_key: string
          required: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          enabled?: boolean
          field_key: string
          form_key: string
          required?: boolean
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          enabled?: boolean
          field_key?: string
          form_key?: string
          required?: boolean
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      gestor_programas: {
        Row: {
          created_at: string
          gestor_user_id: string
          id: string
          programa: Database["public"]["Enums"]["programa_type"]
        }
        Insert: {
          created_at?: string
          gestor_user_id: string
          id?: string
          programa: Database["public"]["Enums"]["programa_type"]
        }
        Update: {
          created_at?: string
          gestor_user_id?: string
          id?: string
          programa?: Database["public"]["Enums"]["programa_type"]
        }
        Relationships: []
      }
      instrument_fields: {
        Row: {
          created_at: string
          description: string | null
          dimension: string | null
          field_key: string
          field_type: string
          form_type: string
          id: string
          is_required: boolean
          label: string
          metadata: Json | null
          scale_labels: Json | null
          scale_max: number | null
          scale_min: number | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          description?: string | null
          dimension?: string | null
          field_key: string
          field_type?: string
          form_type: string
          id?: string
          is_required?: boolean
          label: string
          metadata?: Json | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          description?: string | null
          dimension?: string | null
          field_key?: string
          field_type?: string
          form_type?: string
          id?: string
          is_required?: boolean
          label?: string
          metadata?: Json | null
          scale_labels?: Json | null
          scale_max?: number | null
          scale_min?: number | null
          sort_order?: number
        }
        Relationships: []
      }
      instrument_responses: {
        Row: {
          aap_id: string
          created_at: string
          escola_id: string
          form_type: string
          id: string
          professor_id: string | null
          questoes_selecionadas: Json | null
          registro_acao_id: string
          responses: Json
        }
        Insert: {
          aap_id: string
          created_at?: string
          escola_id: string
          form_type: string
          id?: string
          professor_id?: string | null
          questoes_selecionadas?: Json | null
          registro_acao_id: string
          responses?: Json
        }
        Update: {
          aap_id?: string
          created_at?: string
          escola_id?: string
          form_type?: string
          id?: string
          professor_id?: string | null
          questoes_selecionadas?: Json | null
          registro_acao_id?: string
          responses?: Json
        }
        Relationships: [
          {
            foreignKeyName: "instrument_responses_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instrument_responses_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "instrument_responses_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_sync_config: {
        Row: {
          ativo: boolean
          created_at: string
          escola_padrao_id: string | null
          id: string
          notion_user_email: string
          notion_user_id: string | null
          system_user_id: string
          updated_at: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          escola_padrao_id?: string | null
          id?: string
          notion_user_email: string
          notion_user_id?: string | null
          system_user_id: string
          updated_at?: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          escola_padrao_id?: string | null
          id?: string
          notion_user_email?: string
          notion_user_id?: string | null
          system_user_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_escola_padrao"
            columns: ["escola_padrao_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_system_user"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_system_user"
            columns: ["system_user_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
        ]
      }
      notion_sync_log: {
        Row: {
          created_at: string
          erro_mensagem: string | null
          id: string
          notion_database_id: string | null
          notion_page_id: string
          operacao: string
          payload: Json | null
          registro_id: string | null
          status: string
          tabela_destino: string
        }
        Insert: {
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          notion_database_id?: string | null
          notion_page_id: string
          operacao?: string
          payload?: Json | null
          registro_id?: string | null
          status?: string
          tabela_destino: string
        }
        Update: {
          created_at?: string
          erro_mensagem?: string | null
          id?: string
          notion_database_id?: string | null
          notion_page_id?: string
          operacao?: string
          payload?: Json | null
          registro_id?: string | null
          status?: string
          tabela_destino?: string
        }
        Relationships: []
      }
      observacoes_aula_redes: {
        Row: {
          alunos_feminino: number | null
          alunos_masculino: number | null
          aspectos_fortalecer: string | null
          caderno: number | null
          combinacao_acompanhamento: string | null
          created_at: string
          data: string | null
          estrategias_sugeridas: string | null
          evidencia_criterio_1: string | null
          evidencia_criterio_2: string | null
          evidencia_criterio_3: string | null
          evidencia_criterio_4: string | null
          evidencia_criterio_5: string | null
          evidencia_criterio_6: string | null
          evidencia_criterio_7: string | null
          evidencia_criterio_8: string | null
          evidencia_criterio_9: string | null
          horario: string | null
          id: string
          material_didatico: string[] | null
          municipio: string | null
          nome_escola: string | null
          nome_professor: string | null
          nota_criterio_1: number | null
          nota_criterio_2: number | null
          nota_criterio_3: number | null
          nota_criterio_4: number | null
          nota_criterio_5: number | null
          nota_criterio_6: number | null
          nota_criterio_7: number | null
          nota_criterio_8: number | null
          nota_criterio_9: number | null
          observador: string | null
          pontos_fortes: string | null
          qtd_estudantes: number | null
          segmento: string | null
          status: string
          turma_ano: string | null
        }
        Insert: {
          alunos_feminino?: number | null
          alunos_masculino?: number | null
          aspectos_fortalecer?: string | null
          caderno?: number | null
          combinacao_acompanhamento?: string | null
          created_at?: string
          data?: string | null
          estrategias_sugeridas?: string | null
          evidencia_criterio_1?: string | null
          evidencia_criterio_2?: string | null
          evidencia_criterio_3?: string | null
          evidencia_criterio_4?: string | null
          evidencia_criterio_5?: string | null
          evidencia_criterio_6?: string | null
          evidencia_criterio_7?: string | null
          evidencia_criterio_8?: string | null
          evidencia_criterio_9?: string | null
          horario?: string | null
          id?: string
          material_didatico?: string[] | null
          municipio?: string | null
          nome_escola?: string | null
          nome_professor?: string | null
          nota_criterio_1?: number | null
          nota_criterio_2?: number | null
          nota_criterio_3?: number | null
          nota_criterio_4?: number | null
          nota_criterio_5?: number | null
          nota_criterio_6?: number | null
          nota_criterio_7?: number | null
          nota_criterio_8?: number | null
          nota_criterio_9?: number | null
          observador?: string | null
          pontos_fortes?: string | null
          qtd_estudantes?: number | null
          segmento?: string | null
          status?: string
          turma_ano?: string | null
        }
        Update: {
          alunos_feminino?: number | null
          alunos_masculino?: number | null
          aspectos_fortalecer?: string | null
          caderno?: number | null
          combinacao_acompanhamento?: string | null
          created_at?: string
          data?: string | null
          estrategias_sugeridas?: string | null
          evidencia_criterio_1?: string | null
          evidencia_criterio_2?: string | null
          evidencia_criterio_3?: string | null
          evidencia_criterio_4?: string | null
          evidencia_criterio_5?: string | null
          evidencia_criterio_6?: string | null
          evidencia_criterio_7?: string | null
          evidencia_criterio_8?: string | null
          evidencia_criterio_9?: string | null
          horario?: string | null
          id?: string
          material_didatico?: string[] | null
          municipio?: string | null
          nome_escola?: string | null
          nome_professor?: string | null
          nota_criterio_1?: number | null
          nota_criterio_2?: number | null
          nota_criterio_3?: number | null
          nota_criterio_4?: number | null
          nota_criterio_5?: number | null
          nota_criterio_6?: number | null
          nota_criterio_7?: number | null
          nota_criterio_8?: number | null
          nota_criterio_9?: number | null
          observador?: string | null
          pontos_fortes?: string | null
          qtd_estudantes?: number | null
          segmento?: string | null
          status?: string
          turma_ano?: string | null
        }
        Relationships: []
      }
      presencas: {
        Row: {
          created_at: string
          id: string
          presente: boolean
          professor_id: string
          registro_acao_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          presente?: boolean
          professor_id: string
          registro_acao_id: string
        }
        Update: {
          created_at?: string
          id?: string
          presente?: boolean
          professor_id?: string
          registro_acao_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "presencas_professor_id_fkey"
            columns: ["professor_id"]
            isOneToOne: false
            referencedRelation: "professores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "presencas_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      professores: {
        Row: {
          ano_serie: string
          ativo: boolean
          cargo: string
          componente: string
          created_at: string
          data_desativacao: string | null
          email: string | null
          escola_id: string
          id: string
          nome: string
          programa: Database["public"]["Enums"]["programa_type"][] | null
          segmento: string
          telefone: string | null
          turma_formacao: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          ano_serie: string
          ativo?: boolean
          cargo: string
          componente: string
          created_at?: string
          data_desativacao?: string | null
          email?: string | null
          escola_id: string
          id?: string
          nome: string
          programa?: Database["public"]["Enums"]["programa_type"][] | null
          segmento: string
          telefone?: string | null
          turma_formacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          ano_serie?: string
          ativo?: boolean
          cargo?: string
          componente?: string
          created_at?: string
          data_desativacao?: string | null
          email?: string | null
          escola_id?: string
          id?: string
          nome?: string
          programa?: Database["public"]["Enums"]["programa_type"][] | null
          segmento?: string
          telefone?: string | null
          turma_formacao?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professores_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          componente: string | null
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          nome: string
          segmento: string | null
          telefone: string | null
          updated_at: string
        }
        Insert: {
          componente?: string | null
          created_at?: string
          email: string
          id: string
          must_change_password?: boolean
          nome: string
          segmento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          componente?: string | null
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          segmento?: string | null
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programacoes: {
        Row: {
          aap_id: string
          ano_serie: string
          apoio_componente: string | null
          apoio_devolutiva: string | null
          apoio_escola_voar: boolean | null
          apoio_etapa: string | null
          apoio_focos: string[] | null
          apoio_obs_planejada: boolean | null
          apoio_participantes: string[] | null
          apoio_participantes_outros: string | null
          apoio_professor_id: string | null
          apoio_turma_voar: string | null
          componente: string
          created_at: string
          created_by: string | null
          data: string
          descricao: string | null
          encaminhamentos: string | null
          entidade_filho_id: string | null
          escola_id: string
          fechamento: string | null
          formacao_origem_id: string | null
          frente_trabalho: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          local: string | null
          local_encontro: string | null
          local_escolas: string[] | null
          local_outro: string | null
          motivo_cancelamento: string | null
          programa: string[] | null
          projeto: string | null
          projeto_notion: string | null
          publico_encontro: string[] | null
          publico_formacao: string | null
          segmento: string
          status: string
          tags: string[] | null
          tipo: string
          tipo_ator_presenca: string | null
          titulo: string
          turma_formacao: string | null
          updated_at: string
        }
        Insert: {
          aap_id: string
          ano_serie: string
          apoio_componente?: string | null
          apoio_devolutiva?: string | null
          apoio_escola_voar?: boolean | null
          apoio_etapa?: string | null
          apoio_focos?: string[] | null
          apoio_obs_planejada?: boolean | null
          apoio_participantes?: string[] | null
          apoio_participantes_outros?: string | null
          apoio_professor_id?: string | null
          apoio_turma_voar?: string | null
          componente: string
          created_at?: string
          created_by?: string | null
          data: string
          descricao?: string | null
          encaminhamentos?: string | null
          entidade_filho_id?: string | null
          escola_id: string
          fechamento?: string | null
          formacao_origem_id?: string | null
          frente_trabalho?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          local?: string | null
          local_encontro?: string | null
          local_escolas?: string[] | null
          local_outro?: string | null
          motivo_cancelamento?: string | null
          programa?: string[] | null
          projeto?: string | null
          projeto_notion?: string | null
          publico_encontro?: string[] | null
          publico_formacao?: string | null
          segmento: string
          status?: string
          tags?: string[] | null
          tipo: string
          tipo_ator_presenca?: string | null
          titulo: string
          turma_formacao?: string | null
          updated_at?: string
        }
        Update: {
          aap_id?: string
          ano_serie?: string
          apoio_componente?: string | null
          apoio_devolutiva?: string | null
          apoio_escola_voar?: boolean | null
          apoio_etapa?: string | null
          apoio_focos?: string[] | null
          apoio_obs_planejada?: boolean | null
          apoio_participantes?: string[] | null
          apoio_participantes_outros?: string | null
          apoio_professor_id?: string | null
          apoio_turma_voar?: string | null
          componente?: string
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          encaminhamentos?: string | null
          entidade_filho_id?: string | null
          escola_id?: string
          fechamento?: string | null
          formacao_origem_id?: string | null
          frente_trabalho?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          local?: string | null
          local_encontro?: string | null
          local_escolas?: string[] | null
          local_outro?: string | null
          motivo_cancelamento?: string | null
          programa?: string[] | null
          projeto?: string | null
          projeto_notion?: string | null
          publico_encontro?: string[] | null
          publico_formacao?: string | null
          segmento?: string
          status?: string
          tags?: string[] | null
          tipo?: string
          tipo_ator_presenca?: string | null
          titulo?: string
          turma_formacao?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "programacoes_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_entidade_filho_id_fkey"
            columns: ["entidade_filho_id"]
            isOneToOne: false
            referencedRelation: "entidades_filho"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "programacoes_formacao_origem_id_fkey"
            columns: ["formacao_origem_id"]
            isOneToOne: false
            referencedRelation: "programacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_acao: {
        Row: {
          aap_id: string
          ano_serie: string
          avancos: string | null
          componente: string
          created_at: string
          data: string
          dificuldades: string | null
          escola_id: string
          formacao_origem_id: string | null
          id: string
          is_reagendada: boolean | null
          observacoes: string | null
          programa: string[] | null
          programacao_id: string | null
          projeto: string | null
          reagendada_para: string | null
          segmento: string
          status: string
          tags: string[] | null
          tipo: string
          turma: string | null
          updated_at: string
        }
        Insert: {
          aap_id: string
          ano_serie: string
          avancos?: string | null
          componente: string
          created_at?: string
          data: string
          dificuldades?: string | null
          escola_id: string
          formacao_origem_id?: string | null
          id?: string
          is_reagendada?: boolean | null
          observacoes?: string | null
          programa?: string[] | null
          programacao_id?: string | null
          projeto?: string | null
          reagendada_para?: string | null
          segmento: string
          status?: string
          tags?: string[] | null
          tipo: string
          turma?: string | null
          updated_at?: string
        }
        Update: {
          aap_id?: string
          ano_serie?: string
          avancos?: string | null
          componente?: string
          created_at?: string
          data?: string
          dificuldades?: string | null
          escola_id?: string
          formacao_origem_id?: string | null
          id?: string
          is_reagendada?: boolean | null
          observacoes?: string | null
          programa?: string[] | null
          programacao_id?: string | null
          projeto?: string | null
          reagendada_para?: string | null
          segmento?: string
          status?: string
          tags?: string[] | null
          tipo?: string
          turma?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "registros_acao_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_acao_aap_id_fkey"
            columns: ["aap_id"]
            isOneToOne: false
            referencedRelation: "profiles_directory"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_acao_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_acao_formacao_origem_id_fkey"
            columns: ["formacao_origem_id"]
            isOneToOne: false
            referencedRelation: "programacoes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "registros_acao_programacao_id_fkey"
            columns: ["programacao_id"]
            isOneToOne: false
            referencedRelation: "programacoes"
            referencedColumns: ["id"]
          },
        ]
      }
      registros_alteracoes: {
        Row: {
          alteracao: Json
          created_at: string
          id: string
          registro_id: string
          tabela: string
          usuario_id: string
        }
        Insert: {
          alteracao: Json
          created_at?: string
          id?: string
          registro_id: string
          tabela: string
          usuario_id: string
        }
        Update: {
          alteracao?: Json
          created_at?: string
          id?: string
          registro_id?: string
          tabela?: string
          usuario_id?: string
        }
        Relationships: []
      }
      relatorios_eteg_redes: {
        Row: {
          aspectos_criticos: string | null
          created_at: string
          data: string
          encaminhamentos: string | null
          equipe: string
          horario: string | null
          id: string
          item_1: number
          item_2: number
          item_3: number
          item_4: number
          item_5: number
          item_6: number
          item_7: number
          item_8: number
          local: string | null
          mes_referencia: string
          municipio: string
          observador: string
          pontos_fortes: string | null
          relato_objetivo: string | null
          status: string
          turma_formacao: string[] | null
        }
        Insert: {
          aspectos_criticos?: string | null
          created_at?: string
          data: string
          encaminhamentos?: string | null
          equipe: string
          horario?: string | null
          id?: string
          item_1: number
          item_2: number
          item_3: number
          item_4: number
          item_5: number
          item_6: number
          item_7: number
          item_8: number
          local?: string | null
          mes_referencia: string
          municipio: string
          observador: string
          pontos_fortes?: string | null
          relato_objetivo?: string | null
          status?: string
          turma_formacao?: string[] | null
        }
        Update: {
          aspectos_criticos?: string | null
          created_at?: string
          data?: string
          encaminhamentos?: string | null
          equipe?: string
          horario?: string | null
          id?: string
          item_1?: number
          item_2?: number
          item_3?: number
          item_4?: number
          item_5?: number
          item_6?: number
          item_7?: number
          item_8?: number
          local?: string | null
          mes_referencia?: string
          municipio?: string
          observador?: string
          pontos_fortes?: string | null
          relato_objetivo?: string | null
          status?: string
          turma_formacao?: string[] | null
        }
        Relationships: []
      }
      relatorios_microciclos_recomposicao: {
        Row: {
          aap_id: string
          aspectos_fortalecer: string | null
          created_at: string
          data: string
          encaminhamentos_acordados: string | null
          encaminhamentos_prazo: string | null
          encaminhamentos_responsavel: string | null
          escola_id: string | null
          formador: string | null
          horario: string | null
          id: string
          item_1: number | null
          item_10: number | null
          item_2: number | null
          item_3: number | null
          item_4: number | null
          item_5: number | null
          item_6: number | null
          item_7: number | null
          item_8: number | null
          item_9: number | null
          local: string | null
          municipio: string | null
          plataforma_acesso: string | null
          plataforma_observacoes: string | null
          plataforma_quizzes: string | null
          ponto_focal_rede: string | null
          pontos_fortes: string | null
          proximo_encontro_data: string | null
          proximo_encontro_pauta: string | null
          registro_acao_id: string | null
          relato_objetivo: string | null
          status: string
        }
        Insert: {
          aap_id: string
          aspectos_fortalecer?: string | null
          created_at?: string
          data: string
          encaminhamentos_acordados?: string | null
          encaminhamentos_prazo?: string | null
          encaminhamentos_responsavel?: string | null
          escola_id?: string | null
          formador?: string | null
          horario?: string | null
          id?: string
          item_1?: number | null
          item_10?: number | null
          item_2?: number | null
          item_3?: number | null
          item_4?: number | null
          item_5?: number | null
          item_6?: number | null
          item_7?: number | null
          item_8?: number | null
          item_9?: number | null
          local?: string | null
          municipio?: string | null
          plataforma_acesso?: string | null
          plataforma_observacoes?: string | null
          plataforma_quizzes?: string | null
          ponto_focal_rede?: string | null
          pontos_fortes?: string | null
          proximo_encontro_data?: string | null
          proximo_encontro_pauta?: string | null
          registro_acao_id?: string | null
          relato_objetivo?: string | null
          status?: string
        }
        Update: {
          aap_id?: string
          aspectos_fortalecer?: string | null
          created_at?: string
          data?: string
          encaminhamentos_acordados?: string | null
          encaminhamentos_prazo?: string | null
          encaminhamentos_responsavel?: string | null
          escola_id?: string | null
          formador?: string | null
          horario?: string | null
          id?: string
          item_1?: number | null
          item_10?: number | null
          item_2?: number | null
          item_3?: number | null
          item_4?: number | null
          item_5?: number | null
          item_6?: number | null
          item_7?: number | null
          item_8?: number | null
          item_9?: number | null
          local?: string | null
          municipio?: string | null
          plataforma_acesso?: string | null
          plataforma_observacoes?: string | null
          plataforma_quizzes?: string | null
          ponto_focal_rede?: string | null
          pontos_fortes?: string | null
          proximo_encontro_data?: string | null
          proximo_encontro_pauta?: string | null
          registro_acao_id?: string | null
          relato_objetivo?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_microciclos_recomposicao_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "relatorios_microciclos_recomposicao_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_monit_acoes_formativas: {
        Row: {
          created_at: string
          encaminhamentos: string | null
          fechamento: string | null
          frente_trabalho: string
          id: string
          local_encontro: string
          local_escolas: string[] | null
          local_outro: string | null
          publico: string[]
          registro_acao_id: string
          status: string
        }
        Insert: {
          created_at?: string
          encaminhamentos?: string | null
          fechamento?: string | null
          frente_trabalho: string
          id?: string
          local_encontro: string
          local_escolas?: string[] | null
          local_outro?: string | null
          publico?: string[]
          registro_acao_id: string
          status?: string
        }
        Update: {
          created_at?: string
          encaminhamentos?: string | null
          fechamento?: string | null
          frente_trabalho?: string
          id?: string
          local_encontro?: string
          local_escolas?: string[] | null
          local_outro?: string | null
          publico?: string[]
          registro_acao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_monit_acoes_formativas_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_monitoramento_gestao: {
        Row: {
          created_at: string
          frente_trabalho: string
          id: string
          observacao: string | null
          pdca_aprendizados: string | null
          pdca_encaminhamentos: string | null
          pdca_material: string | null
          pdca_pontos_atencao: string | null
          pdca_temas: string | null
          publico: string[]
          registro_acao_id: string
          status: string
        }
        Insert: {
          created_at?: string
          frente_trabalho: string
          id?: string
          observacao?: string | null
          pdca_aprendizados?: string | null
          pdca_encaminhamentos?: string | null
          pdca_material?: string | null
          pdca_pontos_atencao?: string | null
          pdca_temas?: string | null
          publico?: string[]
          registro_acao_id: string
          status?: string
        }
        Update: {
          created_at?: string
          frente_trabalho?: string
          id?: string
          observacao?: string | null
          pdca_aprendizados?: string | null
          pdca_encaminhamentos?: string | null
          pdca_material?: string | null
          pdca_pontos_atencao?: string | null
          pdca_temas?: string | null
          publico?: string[]
          registro_acao_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "relatorios_monitoramento_gestao_registro_acao_id_fkey"
            columns: ["registro_acao_id"]
            isOneToOne: false
            referencedRelation: "registros_acao"
            referencedColumns: ["id"]
          },
        ]
      }
      relatorios_professor_redes: {
        Row: {
          aspectos_criticos: string | null
          componente_curricular: string
          created_at: string
          data: string
          encaminhamentos: string | null
          formador: string
          horario: string | null
          id: string
          item_1: number
          item_2: number
          item_3: number
          item_4: number
          item_5: number
          item_6: number
          item_7: number
          item_8: number
          local: string | null
          municipio: string
          pontos_fortes: string | null
          relato_objetivo: string | null
          status: string
          turma_ano: string
          turma_formacao: string[] | null
        }
        Insert: {
          aspectos_criticos?: string | null
          componente_curricular: string
          created_at?: string
          data: string
          encaminhamentos?: string | null
          formador: string
          horario?: string | null
          id?: string
          item_1: number
          item_2: number
          item_3: number
          item_4: number
          item_5: number
          item_6: number
          item_7: number
          item_8: number
          local?: string | null
          municipio: string
          pontos_fortes?: string | null
          relato_objetivo?: string | null
          status?: string
          turma_ano: string
          turma_formacao?: string[] | null
        }
        Update: {
          aspectos_criticos?: string | null
          componente_curricular?: string
          created_at?: string
          data?: string
          encaminhamentos?: string | null
          formador?: string
          horario?: string | null
          id?: string
          item_1?: number
          item_2?: number
          item_3?: number
          item_4?: number
          item_5?: number
          item_6?: number
          item_7?: number
          item_8?: number
          local?: string | null
          municipio?: string
          pontos_fortes?: string | null
          relato_objetivo?: string | null
          status?: string
          turma_ano?: string
          turma_formacao?: string[] | null
        }
        Relationships: []
      }
      suppressed_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          metadata: Json | null
          reason: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          metadata?: Json | null
          reason: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          metadata?: Json | null
          reason?: string
        }
        Relationships: []
      }
      user_access_log: {
        Row: {
          accessed_at: string
          id: string
          ip_address: string | null
          user_id: string
        }
        Insert: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          user_id: string
        }
        Update: {
          accessed_at?: string
          id?: string
          ip_address?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_entidades: {
        Row: {
          created_at: string
          escola_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          escola_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          escola_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_entidades_escola_id_fkey"
            columns: ["escola_id"]
            isOneToOne: false
            referencedRelation: "escolas"
            referencedColumns: ["id"]
          },
        ]
      }
      user_programas: {
        Row: {
          created_at: string
          id: string
          programa: Database["public"]["Enums"]["programa_type"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          programa: Database["public"]["Enums"]["programa_type"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          programa?: Database["public"]["Enums"]["programa_type"]
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      profiles_directory: {
        Row: {
          id: string | null
          nome: string | null
        }
        Insert: {
          id?: string | null
          nome?: string | null
        }
        Update: {
          id?: string | null
          nome?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      delete_email: {
        Args: { message_id: number; queue_name: string }
        Returns: boolean
      }
      enqueue_email: {
        Args: { payload: Json; queue_name: string }
        Returns: number
      }
      gestor_can_view_escola: {
        Args: { _escola_id: string; _user_id: string }
        Returns: boolean
      }
      gestor_can_view_professor: {
        Args: { _professor_id: string; _user_id: string }
        Returns: boolean
      }
      gestor_can_view_programacao: {
        Args: { _programacao_id: string; _user_id: string }
        Returns: boolean
      }
      gestor_can_view_registro: {
        Args: { _registro_id: string; _user_id: string }
        Returns: boolean
      }
      gestor_has_programa: {
        Args: { _programa: string; _user_id: string }
        Returns: boolean
      }
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_admin_or_gestor: { Args: { _user_id: string }; Returns: boolean }
      is_gestor: { Args: { _user_id: string }; Returns: boolean }
      is_local_user: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
      is_observer: { Args: { _user_id: string }; Returns: boolean }
      is_operational: { Args: { _user_id: string }; Returns: boolean }
      move_to_dlq: {
        Args: {
          dlq_name: string
          message_id: number
          payload: Json
          source_queue: string
        }
        Returns: number
      }
      read_email_batch: {
        Args: { batch_size: number; queue_name: string; vt: number }
        Returns: {
          message: Json
          msg_id: number
          read_ct: number
        }[]
      }
      setup_first_admin: { Args: { user_email: string }; Returns: boolean }
      shares_entidade: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      shares_programa: {
        Args: { _target_id: string; _viewer_id: string }
        Returns: boolean
      }
      user_has_entidade: {
        Args: { _escola_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_escola_via_programa: {
        Args: { _escola_id: string; _user_id: string }
        Returns: boolean
      }
      user_has_full_data_access: {
        Args: { _escola_id: string; _programa: string[]; _user_id: string }
        Returns: boolean
      }
      user_has_programa: {
        Args: { _programa: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "admin"
        | "aap_inicial"
        | "aap_portugues"
        | "aap_matematica"
        | "gestor"
        | "n3_coordenador_programa"
        | "n4_1_cped"
        | "n4_2_gpi"
        | "n5_formador"
        | "n6_coord_pedagogico"
        | "n7_professor"
        | "n8_equipe_tecnica"
      programa_type: "escolas" | "regionais" | "redes_municipais"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: [
        "admin",
        "aap_inicial",
        "aap_portugues",
        "aap_matematica",
        "gestor",
        "n3_coordenador_programa",
        "n4_1_cped",
        "n4_2_gpi",
        "n5_formador",
        "n6_coord_pedagogico",
        "n7_professor",
        "n8_equipe_tecnica",
      ],
      programa_type: ["escolas", "regionais", "redes_municipais"],
    },
  },
} as const
