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
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          form_key: string
          min_optional_questions?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          form_key?: string
          min_optional_questions?: number
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
          updated_at: string
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
          updated_at?: string
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
          updated_at?: string
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
          created_at: string
          email: string
          id: string
          must_change_password: boolean
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          must_change_password?: boolean
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          must_change_password?: boolean
          nome?: string
          telefone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      programacoes: {
        Row: {
          aap_id: string
          ano_serie: string
          componente: string
          created_at: string
          created_by: string | null
          data: string
          descricao: string | null
          escola_id: string
          formacao_origem_id: string | null
          horario_fim: string
          horario_inicio: string
          id: string
          motivo_cancelamento: string | null
          programa: string[] | null
          segmento: string
          status: string
          tags: string[] | null
          tipo: string
          titulo: string
          updated_at: string
        }
        Insert: {
          aap_id: string
          ano_serie: string
          componente: string
          created_at?: string
          created_by?: string | null
          data: string
          descricao?: string | null
          escola_id: string
          formacao_origem_id?: string | null
          horario_fim: string
          horario_inicio: string
          id?: string
          motivo_cancelamento?: string | null
          programa?: string[] | null
          segmento: string
          status?: string
          tags?: string[] | null
          tipo: string
          titulo: string
          updated_at?: string
        }
        Update: {
          aap_id?: string
          ano_serie?: string
          componente?: string
          created_at?: string
          created_by?: string | null
          data?: string
          descricao?: string | null
          escola_id?: string
          formacao_origem_id?: string | null
          horario_fim?: string
          horario_inicio?: string
          id?: string
          motivo_cancelamento?: string | null
          programa?: string[] | null
          segmento?: string
          status?: string
          tags?: string[] | null
          tipo?: string
          titulo?: string
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
            foreignKeyName: "programacoes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
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
      [_ in never]: never
    }
    Functions: {
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
      setup_first_admin: { Args: { user_email: string }; Returns: boolean }
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
