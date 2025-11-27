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
      ai_factors: {
        Row: {
          code: string
          created_at: string
          description: string | null
          factor_type: Database["public"]["Enums"]["ai_factor_type"]
          id: string
          is_active: boolean | null
          name: string
          parameters: Json | null
          performance_metrics: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          factor_type: Database["public"]["Enums"]["ai_factor_type"]
          id?: string
          is_active?: boolean | null
          name: string
          parameters?: Json | null
          performance_metrics?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          factor_type?: Database["public"]["Enums"]["ai_factor_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          performance_metrics?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_generation_logs: {
        Row: {
          created_at: string | null
          function_name: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          function_name: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          function_name?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_strategies: {
        Row: {
          code: string | null
          created_at: string
          description: string | null
          entry_rules: Json
          exit_rules: Json
          factors: string[] | null
          id: string
          name: string
          risk_parameters: Json
          status: Database["public"]["Enums"]["strategy_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          code?: string | null
          created_at?: string
          description?: string | null
          entry_rules: Json
          exit_rules: Json
          factors?: string[] | null
          id?: string
          name: string
          risk_parameters: Json
          status?: Database["public"]["Enums"]["strategy_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          code?: string | null
          created_at?: string
          description?: string | null
          entry_rules?: Json
          exit_rules?: Json
          factors?: string[] | null
          id?: string
          name?: string
          risk_parameters?: Json
          status?: Database["public"]["Enums"]["strategy_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lightning_channels: {
        Row: {
          capacity: number
          channel_id: string
          created_at: string
          id: string
          local_balance: number
          remote_balance: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          capacity: number
          channel_id: string
          created_at?: string
          id?: string
          local_balance: number
          remote_balance: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          capacity?: number
          channel_id?: string
          created_at?: string
          id?: string
          local_balance?: number
          remote_balance?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      lightning_transactions: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          destination: string | null
          id: string
          payment_hash: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency: string
          destination?: string | null
          id?: string
          payment_hash?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          destination?: string | null
          id?: string
          payment_hash?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio: {
        Row: {
          asset_name: string
          asset_symbol: string
          average_price: number
          created_at: string
          current_price: number | null
          id: string
          quantity: number
          updated_at: string
          user_id: string
        }
        Insert: {
          asset_name: string
          asset_symbol: string
          average_price: number
          created_at?: string
          current_price?: number | null
          id?: string
          quantity: number
          updated_at?: string
          user_id: string
        }
        Update: {
          asset_name?: string
          asset_symbol?: string
          average_price?: number
          created_at?: string
          current_price?: number | null
          id?: string
          quantity?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      strategy_performance: {
        Row: {
          created_at: string
          end_date: string | null
          final_capital: number | null
          id: string
          initial_capital: number
          max_drawdown: number | null
          performance_data: Json | null
          sharpe_ratio: number | null
          start_date: string
          strategy_id: string
          test_type: string
          total_return: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          final_capital?: number | null
          id?: string
          initial_capital: number
          max_drawdown?: number | null
          performance_data?: Json | null
          sharpe_ratio?: number | null
          start_date: string
          strategy_id: string
          test_type: string
          total_return?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          created_at?: string
          end_date?: string | null
          final_capital?: number | null
          id?: string
          initial_capital?: number
          max_drawdown?: number | null
          performance_data?: Json | null
          sharpe_ratio?: number | null
          start_date?: string
          strategy_id?: string
          test_type?: string
          total_return?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_strategy"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          created_at: string
          executed_at: string | null
          id: string
          price: number
          quantity: number
          status: string
          symbol: string
          total: number
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          id?: string
          price: number
          quantity: number
          status?: string
          symbol: string
          total: number
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          id?: string
          price?: number
          quantity?: number
          status?: string
          symbol?: string
          total?: number
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      watchlist: {
        Row: {
          created_at: string
          id: string
          name: string
          symbol: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          symbol: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          symbol?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      ai_factor_type: "technical" | "fundamental" | "sentiment" | "alternative"
      app_role: "admin" | "moderator" | "user"
      strategy_status:
        | "draft"
        | "backtesting"
        | "paper_trading"
        | "live"
        | "archived"
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
      ai_factor_type: ["technical", "fundamental", "sentiment", "alternative"],
      app_role: ["admin", "moderator", "user"],
      strategy_status: [
        "draft",
        "backtesting",
        "paper_trading",
        "live",
        "archived",
      ],
    },
  },
} as const
