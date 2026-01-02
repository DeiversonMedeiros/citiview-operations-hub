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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      user_roles: {
        Row: {
          cliente_id: string
          criado_em: string
          criado_por: string | null
          empresa_id: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          cliente_id: string
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          cliente_id?: string
          criado_em?: string
          criado_por?: string | null
          empresa_id?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_empresa_id_fkey"
            columns: ["empresa_id"]
            isOneToOne: false
            referencedRelation: "empresas"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      clientes: {
        Row: {
          atualizado_em: string | null
          cnpj: string | null
          codigo: string | null
          criado_em: string | null
          criado_por: string | null
          data_contrato: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string | null
          nome_fantasia: string | null
          razao_social: string | null
          status: "ativo" | "inativo" | "suspenso" | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string | null
          cnpj?: string | null
          codigo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_contrato?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string | null
          cnpj?: string | null
          codigo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          data_contrato?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
        }
        Relationships: []
      }
      empresas: {
        Row: {
          atualizado_em: string | null
          cliente_id: string | null
          cnpj: string | null
          codigo: string | null
          criado_em: string | null
          criado_por: string | null
          email: string | null
          endereco_bairro: string | null
          endereco_cep: string | null
          endereco_cidade: string | null
          endereco_complemento: string | null
          endereco_logradouro: string | null
          endereco_numero: string | null
          endereco_uf: string | null
          id: string | null
          inscricao_estadual: string | null
          inscricao_municipal: string | null
          nome_fantasia: string | null
          razao_social: string | null
          status: "ativo" | "inativo" | "suspenso" | null
          telefone: string | null
        }
        Insert: {
          atualizado_em?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          codigo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
        }
        Update: {
          atualizado_em?: string | null
          cliente_id?: string | null
          cnpj?: string | null
          codigo?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          endereco_bairro?: string | null
          endereco_cep?: string | null
          endereco_cidade?: string | null
          endereco_complemento?: string | null
          endereco_logradouro?: string | null
          endereco_numero?: string | null
          endereco_uf?: string | null
          id?: string | null
          inscricao_estadual?: string | null
          inscricao_municipal?: string | null
          nome_fantasia?: string | null
          razao_social?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
        }
        Relationships: []
      }
      perfis_usuarios: {
        Row: {
          atualizado_em: string | null
          avatar_url: string | null
          cargo: string | null
          cliente_id: string | null
          criado_em: string | null
          criado_por: string | null
          email: string | null
          empresa_id: string | null
          id: string | null
          nome_completo: string | null
          status: "ativo" | "inativo" | "suspenso" | null
          telefone: string | null
          user_id: string | null
        }
        Insert: {
          atualizado_em?: string | null
          avatar_url?: string | null
          cargo?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          nome_completo?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
          user_id?: string | null
        }
        Update: {
          atualizado_em?: string | null
          avatar_url?: string | null
          cargo?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          email?: string | null
          empresa_id?: string | null
          id?: string | null
          nome_completo?: string | null
          status?: "ativo" | "inativo" | "suspenso" | null
          telefone?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      usuarios_empresas: {
        Row: {
          ativo: boolean | null
          atualizado_em: string | null
          cliente_id: string | null
          criado_em: string | null
          criado_por: string | null
          empresa_id: string | null
          id: string | null
          is_empresa_padrao: boolean | null
          usuario_id: string | null
        }
        Insert: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          empresa_id?: string | null
          id?: string | null
          is_empresa_padrao?: boolean | null
          usuario_id?: string | null
        }
        Update: {
          ativo?: boolean | null
          atualizado_em?: string | null
          cliente_id?: string | null
          criado_em?: string | null
          criado_por?: string | null
          empresa_id?: string | null
          id?: string | null
          is_empresa_padrao?: boolean | null
          usuario_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_cliente_id: { Args: never; Returns: string }
      get_user_empresas: { Args: never; Returns: string[] }
      has_empresa_access: { Args: { p_empresa_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_cliente: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "super_admin"
        | "admin_cliente"
        | "gestor"
        | "operador"
        | "visualizador"
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
        "super_admin",
        "admin_cliente",
        "gestor",
        "operador",
        "visualizador",
      ],
    },
  },
} as const
