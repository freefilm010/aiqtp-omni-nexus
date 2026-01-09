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
      achievement_definitions: {
        Row: {
          category: string
          created_at: string | null
          criteria: Json
          description: string
          icon: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          criteria: Json
          description: string
          icon?: string | null
          id: string
          name: string
          points?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          criteria?: Json
          description?: string
          icon?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      admin_automation_logs: {
        Row: {
          action: string
          automation_type: string
          created_at: string
          details: Json | null
          error_message: string | null
          id: string
          status: string
        }
        Insert: {
          action: string
          automation_type: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string
        }
        Update: {
          action?: string
          automation_type?: string
          created_at?: string
          details?: Json | null
          error_message?: string | null
          id?: string
          status?: string
        }
        Relationships: []
      }
      admin_investments: {
        Row: {
          allocation_percent: number
          amount: number
          asset_symbol: string
          asset_type: string
          created_at: string
          current_value: number | null
          entry_price: number | null
          id: string
          is_stable: boolean | null
          status: string
          strategy: string
          updated_at: string
        }
        Insert: {
          allocation_percent: number
          amount: number
          asset_symbol: string
          asset_type: string
          created_at?: string
          current_value?: number | null
          entry_price?: number | null
          id?: string
          is_stable?: boolean | null
          status?: string
          strategy?: string
          updated_at?: string
        }
        Update: {
          allocation_percent?: number
          amount?: number
          asset_symbol?: string
          asset_type?: string
          created_at?: string
          current_value?: number | null
          entry_price?: number | null
          id?: string
          is_stable?: boolean | null
          status?: string
          strategy?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_revenue: {
        Row: {
          amount: number
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          processed_at: string | null
          source: string
          status: string
          type: string
        }
        Insert: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source: string
          status?: string
          type?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source?: string
          status?: string
          type?: string
        }
        Relationships: []
      }
      admin_settings: {
        Row: {
          category: string
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          category?: string
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          category?: string
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      ai_factors: {
        Row: {
          category: string | null
          code: string
          code_protected: boolean | null
          created_at: string
          description: string | null
          factor_type: Database["public"]["Enums"]["ai_factor_type"]
          id: string
          is_active: boolean | null
          name: string
          parameters: Json | null
          performance_metrics: Json | null
          sharpe_ratio: number | null
          tags: string[] | null
          total_return: number | null
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          category?: string | null
          code: string
          code_protected?: boolean | null
          created_at?: string
          description?: string | null
          factor_type: Database["public"]["Enums"]["ai_factor_type"]
          id?: string
          is_active?: boolean | null
          name: string
          parameters?: Json | null
          performance_metrics?: Json | null
          sharpe_ratio?: number | null
          tags?: string[] | null
          total_return?: number | null
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          category?: string | null
          code?: string
          code_protected?: boolean | null
          created_at?: string
          description?: string | null
          factor_type?: Database["public"]["Enums"]["ai_factor_type"]
          id?: string
          is_active?: boolean | null
          name?: string
          parameters?: Json | null
          performance_metrics?: Json | null
          sharpe_ratio?: number | null
          tags?: string[] | null
          total_return?: number | null
          updated_at?: string
          user_id?: string
          win_rate?: number | null
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
          admin_approved: boolean | null
          backtest_count: number | null
          code: string | null
          code_protected: boolean | null
          consistency_score: number | null
          created_at: string
          creator_earnings: number | null
          creator_profit_share: number | null
          description: string | null
          entry_rules: Json
          exit_rules: Json
          factors: string[] | null
          graduation_date: string | null
          id: string
          is_available_for_rent: boolean | null
          is_graduated: boolean | null
          name: string
          profitability_score: number | null
          rental_price_monthly: number | null
          risk_parameters: Json
          status: Database["public"]["Enums"]["strategy_status"]
          total_rentals: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_approved?: boolean | null
          backtest_count?: number | null
          code?: string | null
          code_protected?: boolean | null
          consistency_score?: number | null
          created_at?: string
          creator_earnings?: number | null
          creator_profit_share?: number | null
          description?: string | null
          entry_rules: Json
          exit_rules: Json
          factors?: string[] | null
          graduation_date?: string | null
          id?: string
          is_available_for_rent?: boolean | null
          is_graduated?: boolean | null
          name: string
          profitability_score?: number | null
          rental_price_monthly?: number | null
          risk_parameters: Json
          status?: Database["public"]["Enums"]["strategy_status"]
          total_rentals?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_approved?: boolean | null
          backtest_count?: number | null
          code?: string | null
          code_protected?: boolean | null
          consistency_score?: number | null
          created_at?: string
          creator_earnings?: number | null
          creator_profit_share?: number | null
          description?: string | null
          entry_rules?: Json
          exit_rules?: Json
          factors?: string[] | null
          graduation_date?: string | null
          id?: string
          is_available_for_rent?: boolean | null
          is_graduated?: boolean | null
          name?: string
          profitability_score?: number | null
          rental_price_monthly?: number | null
          risk_parameters?: Json
          status?: Database["public"]["Enums"]["strategy_status"]
          total_rentals?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      bot_training_queue: {
        Row: {
          consistency_score: number | null
          created_at: string | null
          error_message: string | null
          graduation_eligible: boolean | null
          id: string
          profitability_score: number | null
          status: string | null
          strategy_id: string | null
          test_results: Json | null
          training_completed_at: string | null
          training_started_at: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          consistency_score?: number | null
          created_at?: string | null
          error_message?: string | null
          graduation_eligible?: boolean | null
          id?: string
          profitability_score?: number | null
          status?: string | null
          strategy_id?: string | null
          test_results?: Json | null
          training_completed_at?: string | null
          training_started_at?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          consistency_score?: number | null
          created_at?: string | null
          error_message?: string | null
          graduation_eligible?: boolean | null
          id?: string
          profitability_score?: number | null
          status?: string | null
          strategy_id?: string | null
          test_results?: Json | null
          training_completed_at?: string | null
          training_started_at?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_training_queue_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_conversations: {
        Row: {
          agent_type: string
          created_at: string | null
          folder: string | null
          id: string
          is_archived: boolean | null
          is_shared: boolean | null
          message_count: number | null
          model_used: string | null
          title: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          agent_type: string
          created_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_shared?: boolean | null
          message_count?: number | null
          model_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          agent_type?: string
          created_at?: string | null
          folder?: string | null
          id?: string
          is_archived?: boolean | null
          is_shared?: boolean | null
          message_count?: number | null
          model_used?: string | null
          title?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          model_used: string | null
          role: string
          tool_executions: Json | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          model_used?: string | null
          role: string
          tool_executions?: Json | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          model_used?: string | null
          role?: string
          tool_executions?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      elite_club_members: {
        Row: {
          created_at: string | null
          id: string
          joined_at: string | null
          lifetime_earnings: number | null
          perks: Json | null
          tier: string | null
          total_strategies_graduated: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          lifetime_earnings?: number | null
          perks?: Json | null
          tier?: string | null
          total_strategies_graduated?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          joined_at?: string | null
          lifetime_earnings?: number | null
          perks?: Json | null
          tier?: string | null
          total_strategies_graduated?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      elite_club_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      graduation_tests: {
        Row: {
          consistency_score: number | null
          created_at: string | null
          id: string
          max_drawdown: number | null
          passed: boolean | null
          profitability: number | null
          sharpe_ratio: number | null
          strategy_id: string | null
          test_data: Json | null
          test_number: number
          user_id: string
          win_rate: number | null
        }
        Insert: {
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          max_drawdown?: number | null
          passed?: boolean | null
          profitability?: number | null
          sharpe_ratio?: number | null
          strategy_id?: string | null
          test_data?: Json | null
          test_number: number
          user_id: string
          win_rate?: number | null
        }
        Update: {
          consistency_score?: number | null
          created_at?: string | null
          id?: string
          max_drawdown?: number | null
          passed?: boolean | null
          profitability?: number | null
          sharpe_ratio?: number | null
          strategy_id?: string | null
          test_data?: Json | null
          test_number?: number
          user_id?: string
          win_rate?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "graduation_tests_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
        ]
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
      payment_processors: {
        Row: {
          config: Json | null
          created_at: string
          id: string
          is_configured: boolean | null
          is_enabled: boolean | null
          last_health_check: string | null
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          config?: Json | null
          created_at?: string
          id?: string
          is_configured?: boolean | null
          is_enabled?: boolean | null
          last_health_check?: string | null
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          config?: Json | null
          created_at?: string
          id?: string
          is_configured?: boolean | null
          is_enabled?: boolean | null
          last_health_check?: string | null
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      platform_investments: {
        Row: {
          asset_symbol: string
          asset_type: string
          created_at: string
          current_price: number | null
          entry_price: number
          id: string
          is_auto_managed: boolean | null
          quantity: number
          realized_pnl: number | null
          strategy: string | null
          unrealized_pnl: number | null
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          asset_symbol: string
          asset_type: string
          created_at?: string
          current_price?: number | null
          entry_price: number
          id?: string
          is_auto_managed?: boolean | null
          quantity: number
          realized_pnl?: number | null
          strategy?: string | null
          unrealized_pnl?: number | null
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          asset_symbol?: string
          asset_type?: string
          created_at?: string
          current_price?: number | null
          entry_price?: number
          id?: string
          is_auto_managed?: boolean | null
          quantity?: number
          realized_pnl?: number | null
          strategy?: string | null
          unrealized_pnl?: number | null
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_investments_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_nft_holdings: {
        Row: {
          acquired_at: string
          acquisition_price: number | null
          chain: string | null
          collection_name: string
          currency: string | null
          current_valuation: number | null
          id: string
          metadata: Json | null
          token_id: string
          token_uri: string | null
          updated_at: string
          wallet_id: string | null
        }
        Insert: {
          acquired_at?: string
          acquisition_price?: number | null
          chain?: string | null
          collection_name: string
          currency?: string | null
          current_valuation?: number | null
          id?: string
          metadata?: Json | null
          token_id: string
          token_uri?: string | null
          updated_at?: string
          wallet_id?: string | null
        }
        Update: {
          acquired_at?: string
          acquisition_price?: number | null
          chain?: string | null
          collection_name?: string
          currency?: string | null
          current_valuation?: number | null
          id?: string
          metadata?: Json | null
          token_id?: string
          token_uri?: string | null
          updated_at?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_nft_holdings_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_revenue: {
        Row: {
          amount: number
          created_at: string
          currency: string
          deal_id: string | null
          id: string
          metadata: Json | null
          processed_at: string | null
          source_category: string
          source_type: string
          status: string
          wallet_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source_category: string
          source_type: string
          status?: string
          wallet_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          deal_id?: string | null
          id?: string
          metadata?: Json | null
          processed_at?: string | null
          source_category?: string
          source_type?: string
          status?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "platform_revenue_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_wallets: {
        Row: {
          available_balance: number
          balance: number
          created_at: string
          currency: string
          id: string
          is_active: boolean | null
          locked_balance: number
          metadata: Json | null
          updated_at: string
          wallet_address: string | null
          wallet_type: string
        }
        Insert: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency: string
          id?: string
          is_active?: boolean | null
          locked_balance?: number
          metadata?: Json | null
          updated_at?: string
          wallet_address?: string | null
          wallet_type: string
        }
        Update: {
          available_balance?: number
          balance?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean | null
          locked_balance?: number
          metadata?: Json | null
          updated_at?: string
          wallet_address?: string | null
          wallet_type?: string
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
      profit_distribution_log: {
        Row: {
          amount: number
          currency: string
          executed_at: string
          from_wallet_id: string | null
          id: string
          metadata: Json | null
          revenue_id: string | null
          rule_id: string | null
          status: string
          to_wallet_id: string | null
        }
        Insert: {
          amount: number
          currency: string
          executed_at?: string
          from_wallet_id?: string | null
          id?: string
          metadata?: Json | null
          revenue_id?: string | null
          rule_id?: string | null
          status?: string
          to_wallet_id?: string | null
        }
        Update: {
          amount?: number
          currency?: string
          executed_at?: string
          from_wallet_id?: string | null
          id?: string
          metadata?: Json | null
          revenue_id?: string | null
          rule_id?: string | null
          status?: string
          to_wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profit_distribution_log_from_wallet_id_fkey"
            columns: ["from_wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_distribution_log_revenue_id_fkey"
            columns: ["revenue_id"]
            isOneToOne: false
            referencedRelation: "platform_revenue"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_distribution_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "profit_distribution_rules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profit_distribution_log_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      profit_distribution_rules: {
        Row: {
          created_at: string
          distribution_type: string
          execution_frequency: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          min_threshold: number | null
          percentage: number
          rule_name: string
          source_type: string
          target_wallet_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          distribution_type: string
          execution_frequency?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          min_threshold?: number | null
          percentage: number
          rule_name: string
          source_type: string
          target_wallet_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          distribution_type?: string
          execution_frequency?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          min_threshold?: number | null
          percentage?: number
          rule_name?: string
          source_type?: string
          target_wallet_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_distribution_rules_target_wallet_id_fkey"
            columns: ["target_wallet_id"]
            isOneToOne: false
            referencedRelation: "platform_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      qaqi_learning_data: {
        Row: {
          confidence: number | null
          created_at: string | null
          id: string
          pattern_data: Json
          pattern_type: string
          times_used: number | null
          updated_at: string | null
        }
        Insert: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          pattern_data: Json
          pattern_type: string
          times_used?: number | null
          updated_at?: string | null
        }
        Update: {
          confidence?: number | null
          created_at?: string | null
          id?: string
          pattern_data?: Json
          pattern_type?: string
          times_used?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      qaqi_performance_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string | null
        }
        Relationships: []
      }
      qtc_blocks: {
        Row: {
          block_hash: string
          block_height: number
          block_reward: number
          created_at: string
          id: string
          merkle_root: string
          previous_hash: string
          resonance_proof: Json
          total_fees: number
          transaction_count: number
          validator_id: string
        }
        Insert: {
          block_hash: string
          block_height: number
          block_reward?: number
          created_at?: string
          id?: string
          merkle_root: string
          previous_hash: string
          resonance_proof: Json
          total_fees?: number
          transaction_count?: number
          validator_id: string
        }
        Update: {
          block_hash?: string
          block_height?: number
          block_reward?: number
          created_at?: string
          id?: string
          merkle_root?: string
          previous_hash?: string
          resonance_proof?: Json
          total_fees?: number
          transaction_count?: number
          validator_id?: string
        }
        Relationships: []
      }
      qtc_ledger: {
        Row: {
          balance: number
          created_at: string
          id: string
          locked_balance: number
          nonce: number
          staked_balance: number
          updated_at: string
          wallet_address: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          locked_balance?: number
          nonce?: number
          staked_balance?: number
          updated_at?: string
          wallet_address: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          locked_balance?: number
          nonce?: number
          staked_balance?: number
          updated_at?: string
          wallet_address?: string
        }
        Relationships: []
      }
      qtc_transactions: {
        Row: {
          amount: number
          block_height: number
          confirmed_at: string | null
          created_at: string
          fee: number
          from_address: string
          id: string
          metadata: Json | null
          nonce: number
          proof_hash: string | null
          signature: string
          status: string
          to_address: string
          tx_hash: string
          tx_type: string
        }
        Insert: {
          amount: number
          block_height: number
          confirmed_at?: string | null
          created_at?: string
          fee?: number
          from_address: string
          id?: string
          metadata?: Json | null
          nonce: number
          proof_hash?: string | null
          signature: string
          status?: string
          to_address: string
          tx_hash: string
          tx_type?: string
        }
        Update: {
          amount?: number
          block_height?: number
          confirmed_at?: string | null
          created_at?: string
          fee?: number
          from_address?: string
          id?: string
          metadata?: Json | null
          nonce?: number
          proof_hash?: string | null
          signature?: string
          status?: string
          to_address?: string
          tx_hash?: string
          tx_type?: string
        }
        Relationships: []
      }
      qtc_validators: {
        Row: {
          blocks_validated: number
          created_at: string
          id: string
          is_active: boolean | null
          quantum_backend: string | null
          reputation_score: number
          stake_amount: number
          total_rewards: number
          updated_at: string
          validator_key: string
          wallet_address: string
        }
        Insert: {
          blocks_validated?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          quantum_backend?: string | null
          reputation_score?: number
          stake_amount?: number
          total_rewards?: number
          updated_at?: string
          validator_key: string
          wallet_address: string
        }
        Update: {
          blocks_validated?: number
          created_at?: string
          id?: string
          is_active?: boolean | null
          quantum_backend?: string | null
          reputation_score?: number
          stake_amount?: number
          total_rewards?: number
          updated_at?: string
          validator_key?: string
          wallet_address?: string
        }
        Relationships: [
          {
            foreignKeyName: "qtc_validators_wallet_address_fkey"
            columns: ["wallet_address"]
            isOneToOne: false
            referencedRelation: "qtc_ledger"
            referencedColumns: ["wallet_address"]
          },
        ]
      }
      quwallet_addresses: {
        Row: {
          address: string
          address_type: string
          created_at: string
          derivation_path: string | null
          id: string
          network: string
          wallet_id: string | null
        }
        Insert: {
          address: string
          address_type?: string
          created_at?: string
          derivation_path?: string | null
          id?: string
          network: string
          wallet_id?: string | null
        }
        Update: {
          address?: string
          address_type?: string
          created_at?: string
          derivation_path?: string | null
          id?: string
          network?: string
          wallet_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quwallet_addresses_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "quwallet_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      quwallet_wallets: {
        Row: {
          created_at: string
          dilithium_public_key: string
          ecdsa_public_key: string | null
          encrypted_private_keys: string
          hardware_type: string | null
          id: string
          is_active: boolean | null
          is_hardware: boolean | null
          key_derivation_salt: string
          kyber_public_key: string
          multi_sig_config: Json | null
          updated_at: string
          user_id: string
          wallet_address: string
          wallet_name: string
          wallet_type: string
        }
        Insert: {
          created_at?: string
          dilithium_public_key: string
          ecdsa_public_key?: string | null
          encrypted_private_keys: string
          hardware_type?: string | null
          id?: string
          is_active?: boolean | null
          is_hardware?: boolean | null
          key_derivation_salt: string
          kyber_public_key: string
          multi_sig_config?: Json | null
          updated_at?: string
          user_id: string
          wallet_address: string
          wallet_name: string
          wallet_type?: string
        }
        Update: {
          created_at?: string
          dilithium_public_key?: string
          ecdsa_public_key?: string | null
          encrypted_private_keys?: string
          hardware_type?: string | null
          id?: string
          is_active?: boolean | null
          is_hardware?: boolean | null
          key_derivation_salt?: string
          kyber_public_key?: string
          multi_sig_config?: Json | null
          updated_at?: string
          user_id?: string
          wallet_address?: string
          wallet_name?: string
          wallet_type?: string
        }
        Relationships: []
      }
      rental_profit_splits: {
        Row: {
          created_at: string | null
          creator_share: number
          gross_profit: number
          id: string
          period_end: string
          period_start: string
          platform_share: number
          rental_id: string | null
          renter_share: number
          status: string | null
          trade_id: string | null
        }
        Insert: {
          created_at?: string | null
          creator_share: number
          gross_profit: number
          id?: string
          period_end: string
          period_start: string
          platform_share: number
          rental_id?: string | null
          renter_share: number
          status?: string | null
          trade_id?: string | null
        }
        Update: {
          created_at?: string | null
          creator_share?: number
          gross_profit?: number
          id?: string
          period_end?: string
          period_start?: string
          platform_share?: number
          rental_id?: string | null
          renter_share?: number
          status?: string | null
          trade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rental_profit_splits_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "strategy_rentals"
            referencedColumns: ["id"]
          },
        ]
      }
      security_logs: {
        Row: {
          created_at: string
          description: string
          event_type: string
          id: string
          ip_address: string | null
          metadata: Json | null
          severity: string
        }
        Insert: {
          created_at?: string
          description: string
          event_type: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
        }
        Update: {
          created_at?: string
          description?: string
          event_type?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          severity?: string
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
      strategy_rentals: {
        Row: {
          created_at: string | null
          creator_user_id: string
          end_date: string | null
          id: string
          monthly_price: number
          renter_user_id: string
          start_date: string | null
          status: string | null
          strategy_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          creator_user_id: string
          end_date?: string | null
          id?: string
          monthly_price: number
          renter_user_id: string
          start_date?: string | null
          status?: string | null
          strategy_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          creator_user_id?: string
          end_date?: string | null
          id?: string
          monthly_price?: number
          renter_user_id?: string
          start_date?: string | null
          status?: string | null
          strategy_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "strategy_rentals_strategy_id_fkey"
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
      user_achievements: {
        Row: {
          achievement_name: string
          achievement_type: string
          created_at: string | null
          description: string | null
          id: string
          metadata: Json | null
          points: number | null
          tier: string | null
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_name: string
          achievement_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          tier?: string | null
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_name?: string
          achievement_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
          points?: number | null
          tier?: string | null
          unlocked_at?: string | null
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
      get_factor_code: { Args: { factor_id: string }; Returns: string }
      get_strategy_code: { Args: { strategy_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      process_profit_distribution: {
        Args: { p_revenue_id: string }
        Returns: undefined
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
