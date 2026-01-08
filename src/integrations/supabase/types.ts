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
          nome: string
          telefone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          nome: string
          telefone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
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
          horario_fim: string
          horario_inicio: string
          id: string
          motivo_cancelamento: string | null
          programa: string[] | null
          segmento: string
          status: string
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
          horario_fim: string
          horario_inicio: string
          id?: string
          motivo_cancelamento?: string | null
          programa?: string[] | null
          segmento: string
          status?: string
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
          horario_fim?: string
          horario_inicio?: string
          id?: string
          motivo_cancelamento?: string | null
          programa?: string[] | null
          segmento?: string
          status?: string
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
          id: string
          observacoes: string | null
          programa: string[] | null
          programacao_id: string | null
          segmento: string
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
          id?: string
          observacoes?: string | null
          programa?: string[] | null
          programacao_id?: string | null
          segmento: string
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
          id?: string
          observacoes?: string | null
          programa?: string[] | null
          programacao_id?: string | null
          segmento?: string
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
            foreignKeyName: "registros_acao_programacao_id_fkey"
            columns: ["programacao_id"]
            isOneToOne: false
            referencedRelation: "programacoes"
            referencedColumns: ["id"]
          },
        ]
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
      setup_first_admin: { Args: { user_email: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "admin"
        | "aap_inicial"
        | "aap_portugues"
        | "aap_matematica"
        | "gestor"
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
      ],
      programa_type: ["escolas", "regionais", "redes_municipais"],
    },
  },
} as const
