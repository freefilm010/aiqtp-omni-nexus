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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      account_key_vault: {
        Row: {
          account_id: string
          api_key_encrypted: string
          created_at: string | null
          id: string
        }
        Insert: {
          account_id: string
          api_key_encrypted: string
          created_at?: string | null
          id?: string
        }
        Update: {
          account_id?: string
          api_key_encrypted?: string
          created_at?: string | null
          id?: string
        }
        Relationships: []
      }
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
      ad_placements: {
        Row: {
          ad_content: Json | null
          advertiser_name: string | null
          click_count: number | null
          cpm_rate: number | null
          created_at: string | null
          ends_at: string | null
          id: string
          impression_count: number | null
          is_active: boolean | null
          slot_name: string
          starts_at: string | null
        }
        Insert: {
          ad_content?: Json | null
          advertiser_name?: string | null
          click_count?: number | null
          cpm_rate?: number | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          impression_count?: number | null
          is_active?: boolean | null
          slot_name: string
          starts_at?: string | null
        }
        Update: {
          ad_content?: Json | null
          advertiser_name?: string | null
          click_count?: number | null
          cpm_rate?: number | null
          created_at?: string | null
          ends_at?: string | null
          id?: string
          impression_count?: number | null
          is_active?: boolean | null
          slot_name?: string
          starts_at?: string | null
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
      ai_signals: {
        Row: {
          category: string | null
          confidence: number
          created_at: string
          expires_at: string | null
          id: string
          is_active: boolean | null
          price_at_signal: number | null
          reason: string
          signal_type: string
          source: string
          stop_loss: number | null
          strength: string
          symbol: string
          target_price: number | null
          triggered_at: string
        }
        Insert: {
          category?: string | null
          confidence: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          price_at_signal?: number | null
          reason: string
          signal_type: string
          source?: string
          stop_loss?: number | null
          strength: string
          symbol: string
          target_price?: number | null
          triggered_at?: string
        }
        Update: {
          category?: string | null
          confidence?: number
          created_at?: string
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          price_at_signal?: number | null
          reason?: string
          signal_type?: string
          source?: string
          stop_loss?: number | null
          strength?: string
          symbol?: string
          target_price?: number | null
          triggered_at?: string
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
      auto_invest_ai_logs: {
        Row: {
          allocations_proposed: Json | null
          analysis_type: string
          confidence_score: number | null
          created_at: string
          engine_id: string
          executed: boolean
          id: string
          market_regime: string | null
          model_used: string | null
          raw_response: string | null
          recommendations: Json | null
          signals_used: Json | null
        }
        Insert: {
          allocations_proposed?: Json | null
          analysis_type: string
          confidence_score?: number | null
          created_at?: string
          engine_id: string
          executed?: boolean
          id?: string
          market_regime?: string | null
          model_used?: string | null
          raw_response?: string | null
          recommendations?: Json | null
          signals_used?: Json | null
        }
        Update: {
          allocations_proposed?: Json | null
          analysis_type?: string
          confidence_score?: number | null
          created_at?: string
          engine_id?: string
          executed?: boolean
          id?: string
          market_regime?: string | null
          model_used?: string | null
          raw_response?: string | null
          recommendations?: Json | null
          signals_used?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_invest_ai_logs_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "auto_invest_engine"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_invest_allocations: {
        Row: {
          ai_reasoning: string | null
          ai_score: number | null
          ai_signal: string | null
          allocation_type: string
          asset_class: string
          asset_name: string
          asset_symbol: string
          created_at: string
          current_percent: number
          current_price: number | null
          engine_id: string
          entry_price: number | null
          id: string
          is_active: boolean
          pnl_percent: number
          pnl_usd: number
          quantity: number
          stop_loss_percent: number | null
          take_profit_percent: number | null
          target_percent: number
          updated_at: string
          value_usd: number
        }
        Insert: {
          ai_reasoning?: string | null
          ai_score?: number | null
          ai_signal?: string | null
          allocation_type?: string
          asset_class?: string
          asset_name: string
          asset_symbol: string
          created_at?: string
          current_percent?: number
          current_price?: number | null
          engine_id: string
          entry_price?: number | null
          id?: string
          is_active?: boolean
          pnl_percent?: number
          pnl_usd?: number
          quantity?: number
          stop_loss_percent?: number | null
          take_profit_percent?: number | null
          target_percent?: number
          updated_at?: string
          value_usd?: number
        }
        Update: {
          ai_reasoning?: string | null
          ai_score?: number | null
          ai_signal?: string | null
          allocation_type?: string
          asset_class?: string
          asset_name?: string
          asset_symbol?: string
          created_at?: string
          current_percent?: number
          current_price?: number | null
          engine_id?: string
          entry_price?: number | null
          id?: string
          is_active?: boolean
          pnl_percent?: number
          pnl_usd?: number
          quantity?: number
          stop_loss_percent?: number | null
          take_profit_percent?: number | null
          target_percent?: number
          updated_at?: string
          value_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "auto_invest_allocations_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "auto_invest_engine"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_invest_engine: {
        Row: {
          ai_confidence_score: number | null
          ai_market_regime: string | null
          created_at: string
          cycle_count: number
          engine_name: string
          growth_target_percent: number
          id: string
          last_ai_analysis_at: string | null
          last_rebalance_at: string | null
          rebalance_threshold: number
          reinvest_percent: number
          stable_target_percent: number
          status: string
          strategy: string
          total_capital: number
          total_deployed: number
          total_profit: number
          total_reinvested: number
          updated_at: string
        }
        Insert: {
          ai_confidence_score?: number | null
          ai_market_regime?: string | null
          created_at?: string
          cycle_count?: number
          engine_name?: string
          growth_target_percent?: number
          id?: string
          last_ai_analysis_at?: string | null
          last_rebalance_at?: string | null
          rebalance_threshold?: number
          reinvest_percent?: number
          stable_target_percent?: number
          status?: string
          strategy?: string
          total_capital?: number
          total_deployed?: number
          total_profit?: number
          total_reinvested?: number
          updated_at?: string
        }
        Update: {
          ai_confidence_score?: number | null
          ai_market_regime?: string | null
          created_at?: string
          cycle_count?: number
          engine_name?: string
          growth_target_percent?: number
          id?: string
          last_ai_analysis_at?: string | null
          last_rebalance_at?: string | null
          rebalance_threshold?: number
          reinvest_percent?: number
          stable_target_percent?: number
          status?: string
          strategy?: string
          total_capital?: number
          total_deployed?: number
          total_profit?: number
          total_reinvested?: number
          updated_at?: string
        }
        Relationships: []
      }
      auto_invest_transactions: {
        Row: {
          ai_confidence: number | null
          ai_reason: string | null
          ai_triggered: boolean
          allocation_id: string | null
          amount_usd: number
          asset_symbol: string | null
          created_at: string
          engine_id: string
          fee_usd: number
          id: string
          market_regime: string | null
          pnl_usd: number | null
          price: number | null
          quantity: number | null
          side: string | null
          status: string
          transaction_type: string
        }
        Insert: {
          ai_confidence?: number | null
          ai_reason?: string | null
          ai_triggered?: boolean
          allocation_id?: string | null
          amount_usd?: number
          asset_symbol?: string | null
          created_at?: string
          engine_id: string
          fee_usd?: number
          id?: string
          market_regime?: string | null
          pnl_usd?: number | null
          price?: number | null
          quantity?: number | null
          side?: string | null
          status?: string
          transaction_type: string
        }
        Update: {
          ai_confidence?: number | null
          ai_reason?: string | null
          ai_triggered?: boolean
          allocation_id?: string | null
          amount_usd?: number
          asset_symbol?: string | null
          created_at?: string
          engine_id?: string
          fee_usd?: number
          id?: string
          market_regime?: string | null
          pnl_usd?: number | null
          price?: number | null
          quantity?: number | null
          side?: string | null
          status?: string
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_invest_transactions_allocation_id_fkey"
            columns: ["allocation_id"]
            isOneToOne: false
            referencedRelation: "auto_invest_allocations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auto_invest_transactions_engine_id_fkey"
            columns: ["engine_id"]
            isOneToOne: false
            referencedRelation: "auto_invest_engine"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_nft_generations: {
        Row: {
          attributes: Json | null
          buyer_address: string | null
          chain: string | null
          created_at: string | null
          currency: string | null
          description: string | null
          generated_at: string | null
          id: string
          image_url: string | null
          list_price: number | null
          mint_status: string | null
          minted_at: string | null
          name: string
          prompt: string
          royalty_percent: number | null
          sale_price: number | null
          sold_at: string | null
          user_id: string | null
        }
        Insert: {
          attributes?: Json | null
          buyer_address?: string | null
          chain?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          generated_at?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          mint_status?: string | null
          minted_at?: string | null
          name: string
          prompt: string
          royalty_percent?: number | null
          sale_price?: number | null
          sold_at?: string | null
          user_id?: string | null
        }
        Update: {
          attributes?: Json | null
          buyer_address?: string | null
          chain?: string | null
          created_at?: string | null
          currency?: string | null
          description?: string | null
          generated_at?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          mint_status?: string | null
          minted_at?: string | null
          name?: string
          prompt?: string
          royalty_percent?: number | null
          sale_price?: number | null
          sold_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      automation_templates: {
        Row: {
          action_config: Json | null
          action_type: string
          category: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          is_system: boolean | null
          last_run_at: string | null
          name: string
          run_count: number | null
          schedule: string | null
          subcategory: string | null
          trigger_config: Json | null
          trigger_type: string
          updated_at: string | null
          user_id: string | null
          webhook_url: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type: string
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_run_at?: string | null
          name: string
          run_count?: number | null
          schedule?: string | null
          subcategory?: string | null
          trigger_config?: Json | null
          trigger_type: string
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          is_system?: boolean | null
          last_run_at?: string | null
          name?: string
          run_count?: number | null
          schedule?: string | null
          subcategory?: string | null
          trigger_config?: Json | null
          trigger_type?: string
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      backtest_results: {
        Row: {
          avg_trade_duration: string | null
          created_at: string
          end_date: string
          final_capital: number | null
          id: string
          initial_capital: number
          losing_trades: number | null
          max_drawdown: number | null
          profit_factor: number | null
          results_data: Json | null
          sharpe_ratio: number | null
          start_date: string
          strategy_id: string | null
          symbol: string
          timeframe: string
          total_return: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
          winning_trades: number | null
        }
        Insert: {
          avg_trade_duration?: string | null
          created_at?: string
          end_date: string
          final_capital?: number | null
          id?: string
          initial_capital?: number
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          results_data?: Json | null
          sharpe_ratio?: number | null
          start_date: string
          strategy_id?: string | null
          symbol: string
          timeframe: string
          total_return?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Update: {
          avg_trade_duration?: string | null
          created_at?: string
          end_date?: string
          final_capital?: number | null
          id?: string
          initial_capital?: number
          losing_trades?: number | null
          max_drawdown?: number | null
          profit_factor?: number | null
          results_data?: Json | null
          sharpe_ratio?: number | null
          start_date?: string
          strategy_id?: string | null
          symbol?: string
          timeframe?: string
          total_return?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
          winning_trades?: number | null
        }
        Relationships: []
      }
      bot_clones: {
        Row: {
          clone_name: string | null
          clone_operator_id: string
          configuration: Json | null
          created_at: string
          id: string
          is_active: boolean | null
          master_strategy_id: string
          performance_metrics: Json | null
          rental_id: string | null
          renter_user_id: string
          total_fees_generated: number | null
          total_profit: number | null
          total_trades: number | null
          updated_at: string
        }
        Insert: {
          clone_name?: string | null
          clone_operator_id: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          master_strategy_id: string
          performance_metrics?: Json | null
          rental_id?: string | null
          renter_user_id: string
          total_fees_generated?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string
        }
        Update: {
          clone_name?: string | null
          clone_operator_id?: string
          configuration?: Json | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          master_strategy_id?: string
          performance_metrics?: Json | null
          rental_id?: string | null
          renter_user_id?: string
          total_fees_generated?: number | null
          total_profit?: number | null
          total_trades?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bot_clones_clone_operator_id_fkey"
            columns: ["clone_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_clones_master_strategy_id_fkey"
            columns: ["master_strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_clones_master_strategy_id_fkey"
            columns: ["master_strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bot_clones_rental_id_fkey"
            columns: ["rental_id"]
            isOneToOne: false
            referencedRelation: "strategy_rentals"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "bot_training_queue_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      broadcast_content: {
        Row: {
          audio_url: string | null
          body: string
          category: string | null
          content_type: string
          created_at: string | null
          id: string
          is_published: boolean | null
          priority: number | null
          published_at: string | null
          scheduled_at: string | null
          source: string | null
          title: string
          visual_data: Json | null
        }
        Insert: {
          audio_url?: string | null
          body: string
          category?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: number | null
          published_at?: string | null
          scheduled_at?: string | null
          source?: string | null
          title: string
          visual_data?: Json | null
        }
        Update: {
          audio_url?: string | null
          body?: string
          category?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          is_published?: boolean | null
          priority?: number | null
          published_at?: string | null
          scheduled_at?: string | null
          source?: string | null
          title?: string
          visual_data?: Json | null
        }
        Relationships: []
      }
      capitol_community_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          likes_count: number | null
          parent_comment_id: string | null
          post_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          likes_count?: number | null
          parent_comment_id?: string | null
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capitol_community_comments_parent_comment_id_fkey"
            columns: ["parent_comment_id"]
            isOneToOne: false
            referencedRelation: "capitol_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capitol_community_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "capitol_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      capitol_community_likes: {
        Row: {
          comment_id: string | null
          created_at: string
          id: string
          post_id: string | null
          user_id: string
        }
        Insert: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id: string
        }
        Update: {
          comment_id?: string | null
          created_at?: string
          id?: string
          post_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "capitol_community_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "capitol_community_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "capitol_community_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "capitol_community_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      capitol_community_posts: {
        Row: {
          chart_url: string | null
          comments_count: number | null
          content: string
          created_at: string
          id: string
          image_url: string | null
          is_pinned: boolean | null
          likes_count: number | null
          post_type: string
          tags: string[] | null
          ticker: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          chart_url?: string | null
          comments_count?: number | null
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string
          tags?: string[] | null
          ticker?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          chart_url?: string | null
          comments_count?: number | null
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_pinned?: boolean | null
          likes_count?: number | null
          post_type?: string
          tags?: string[] | null
          ticker?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      community_poll_options: {
        Row: {
          id: string
          option_text: string
          poll_id: string
          sort_order: number | null
          vote_count: number | null
        }
        Insert: {
          id?: string
          option_text: string
          poll_id: string
          sort_order?: number | null
          vote_count?: number | null
        }
        Update: {
          id?: string
          option_text?: string
          poll_id?: string
          sort_order?: number | null
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_options_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_poll_votes: {
        Row: {
          created_at: string | null
          id: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          option_id: string
          poll_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          option_id?: string
          poll_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "community_poll_votes_option_id_fkey"
            columns: ["option_id"]
            isOneToOne: false
            referencedRelation: "community_poll_options"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "community_poll_votes_poll_id_fkey"
            columns: ["poll_id"]
            isOneToOne: false
            referencedRelation: "community_polls"
            referencedColumns: ["id"]
          },
        ]
      }
      community_polls: {
        Row: {
          created_at: string | null
          description: string | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          poll_type: string
          ticker: string | null
          title: string
          total_votes: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          poll_type?: string
          ticker?: string | null
          title: string
          total_votes?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          poll_type?: string
          ticker?: string | null
          title?: string
          total_votes?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      community_predictions: {
        Row: {
          accuracy_score: number | null
          confidence: number | null
          created_at: string | null
          direction: string
          id: string
          outcome: string | null
          outcome_resolved_at: string | null
          prediction_type: string
          reasoning: string | null
          target_date: string | null
          target_price: number | null
          ticker: string
          upvotes: number | null
          user_id: string
        }
        Insert: {
          accuracy_score?: number | null
          confidence?: number | null
          created_at?: string | null
          direction?: string
          id?: string
          outcome?: string | null
          outcome_resolved_at?: string | null
          prediction_type?: string
          reasoning?: string | null
          target_date?: string | null
          target_price?: number | null
          ticker: string
          upvotes?: number | null
          user_id: string
        }
        Update: {
          accuracy_score?: number | null
          confidence?: number | null
          created_at?: string | null
          direction?: string
          id?: string
          outcome?: string | null
          outcome_resolved_at?: string | null
          prediction_type?: string
          reasoning?: string | null
          target_date?: string | null
          target_price?: number | null
          ticker?: string
          upvotes?: number | null
          user_id?: string
        }
        Relationships: []
      }
      congress_featured_issuers: {
        Row: {
          created_at: string
          current_price: number | null
          id: string
          issuer_name: string
          logo_url: string | null
          price_change_pct: number | null
          ticker: string
          total_trades: number | null
        }
        Insert: {
          created_at?: string
          current_price?: number | null
          id?: string
          issuer_name: string
          logo_url?: string | null
          price_change_pct?: number | null
          ticker: string
          total_trades?: number | null
        }
        Update: {
          created_at?: string
          current_price?: number | null
          id?: string
          issuer_name?: string
          logo_url?: string | null
          price_change_pct?: number | null
          ticker?: string
          total_trades?: number | null
        }
        Relationships: []
      }
      congress_politicians: {
        Row: {
          avatar_url: string | null
          chamber: string
          created_at: string
          full_name: string
          id: string
          is_featured: boolean | null
          party: string
          state: string | null
          total_filings: number | null
          total_issuers: number | null
          total_trades: number | null
          total_volume: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          chamber?: string
          created_at?: string
          full_name: string
          id?: string
          is_featured?: boolean | null
          party?: string
          state?: string | null
          total_filings?: number | null
          total_issuers?: number | null
          total_trades?: number | null
          total_volume?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          chamber?: string
          created_at?: string
          full_name?: string
          id?: string
          is_featured?: boolean | null
          party?: string
          state?: string | null
          total_filings?: number | null
          total_issuers?: number | null
          total_trades?: number | null
          total_volume?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      congress_trades: {
        Row: {
          amount_range: string | null
          asset_type: string | null
          chamber: string | null
          created_at: string
          disclosure_date: string | null
          id: string
          issuer_name: string
          party: string | null
          politician_id: string | null
          politician_name: string
          state: string | null
          ticker: string
          trade_date: string
          trade_type: string
        }
        Insert: {
          amount_range?: string | null
          asset_type?: string | null
          chamber?: string | null
          created_at?: string
          disclosure_date?: string | null
          id?: string
          issuer_name: string
          party?: string | null
          politician_id?: string | null
          politician_name: string
          state?: string | null
          ticker: string
          trade_date?: string
          trade_type?: string
        }
        Update: {
          amount_range?: string | null
          asset_type?: string | null
          chamber?: string | null
          created_at?: string
          disclosure_date?: string | null
          id?: string
          issuer_name?: string
          party?: string | null
          politician_id?: string | null
          politician_name?: string
          state?: string | null
          ticker?: string
          trade_date?: string
          trade_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "congress_trades_politician_id_fkey"
            columns: ["politician_id"]
            isOneToOne: false
            referencedRelation: "congress_politicians"
            referencedColumns: ["id"]
          },
        ]
      }
      connected_accounts: {
        Row: {
          account_name: string
          account_type: string
          balance: number | null
          change_24h: number | null
          created_at: string
          id: string
          last_sync_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_name: string
          account_type: string
          balance?: number | null
          change_24h?: number | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_name?: string
          account_type?: string
          balance?: number | null
          change_24h?: number | null
          created_at?: string
          id?: string
          last_sync_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      consensus_signals: {
        Row: {
          agent_votes: Json
          consensus_score: number
          created_at: string
          direction: string
          executed: boolean
          id: string
          pair: string
          pnl: number | null
        }
        Insert: {
          agent_votes?: Json
          consensus_score?: number
          created_at?: string
          direction: string
          executed?: boolean
          id?: string
          pair: string
          pnl?: number | null
        }
        Update: {
          agent_votes?: Json
          consensus_score?: number
          created_at?: string
          direction?: string
          executed?: boolean
          id?: string
          pair?: string
          pnl?: number | null
        }
        Relationships: []
      }
      contest_entries: {
        Row: {
          contest_id: string
          current_score: number
          id: string
          is_winner: boolean
          joined_at: string
          prize_awarded: boolean
          rank: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_id: string
          current_score?: number
          id?: string
          is_winner?: boolean
          joined_at?: string
          prize_awarded?: boolean
          rank?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string
          current_score?: number
          id?: string
          is_winner?: boolean
          joined_at?: string
          prize_awarded?: boolean
          rank?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_entries_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "stat_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      contest_participants: {
        Row: {
          contest_id: string | null
          created_at: string
          entry_data: Json | null
          id: string
          prize_paid: boolean | null
          prize_won: number | null
          rank: number | null
          score: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contest_id?: string | null
          created_at?: string
          entry_data?: Json | null
          id?: string
          prize_paid?: boolean | null
          prize_won?: number | null
          rank?: number | null
          score?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contest_id?: string | null
          created_at?: string
          entry_data?: Json | null
          id?: string
          prize_paid?: boolean | null
          prize_won?: number | null
          rank?: number | null
          score?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contest_participants_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "token_contests"
            referencedColumns: ["id"]
          },
        ]
      }
      copy_trading_leaders: {
        Row: {
          aum: number | null
          avatar: string | null
          copiers_count: number | null
          created_at: string
          display_name: string
          id: string
          is_active: boolean | null
          is_hot: boolean | null
          is_verified: boolean | null
          max_drawdown: number | null
          pnl_30d: number | null
          pnl_all_time: number | null
          risk_score: number | null
          sharpe_ratio: number | null
          strategy_description: string | null
          tier: string
          updated_at: string
          user_id: string
          win_rate: number | null
        }
        Insert: {
          aum?: number | null
          avatar?: string | null
          copiers_count?: number | null
          created_at?: string
          display_name: string
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          is_verified?: boolean | null
          max_drawdown?: number | null
          pnl_30d?: number | null
          pnl_all_time?: number | null
          risk_score?: number | null
          sharpe_ratio?: number | null
          strategy_description?: string | null
          tier?: string
          updated_at?: string
          user_id: string
          win_rate?: number | null
        }
        Update: {
          aum?: number | null
          avatar?: string | null
          copiers_count?: number | null
          created_at?: string
          display_name?: string
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          is_verified?: boolean | null
          max_drawdown?: number | null
          pnl_30d?: number | null
          pnl_all_time?: number | null
          risk_score?: number | null
          sharpe_ratio?: number | null
          strategy_description?: string | null
          tier?: string
          updated_at?: string
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      course_ratings: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ratings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "education_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_feedback: {
        Row: {
          admin_notes: string | null
          created_at: string
          feedback_type: string
          id: string
          is_read: boolean | null
          message: string
          rating: number | null
          route_hash: string
          subject: string | null
          submission_token: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_read?: boolean | null
          message: string
          rating?: number | null
          route_hash?: string
          subject?: string | null
          submission_token?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          feedback_type?: string
          id?: string
          is_read?: boolean | null
          message?: string
          rating?: number | null
          route_hash?: string
          subject?: string | null
          submission_token?: string
        }
        Relationships: []
      }
      data_aggregator_bots: {
        Row: {
          admin_approved: boolean | null
          aggregation_rules: Json | null
          bot_type: string
          code: string | null
          code_protected: boolean | null
          collection_frequency: string | null
          created_at: string | null
          creator_profit_share: number | null
          data_category: string
          description: string | null
          graduation_date: string | null
          id: string
          is_active: boolean | null
          is_graduated: boolean | null
          last_collection_at: string | null
          name: string
          output_format: string | null
          quality_score: number | null
          reliability_score: number | null
          sources: Json | null
          total_data_sold: number | null
          total_earnings: number | null
          total_records_collected: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_approved?: boolean | null
          aggregation_rules?: Json | null
          bot_type?: string
          code?: string | null
          code_protected?: boolean | null
          collection_frequency?: string | null
          created_at?: string | null
          creator_profit_share?: number | null
          data_category: string
          description?: string | null
          graduation_date?: string | null
          id?: string
          is_active?: boolean | null
          is_graduated?: boolean | null
          last_collection_at?: string | null
          name: string
          output_format?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          sources?: Json | null
          total_data_sold?: number | null
          total_earnings?: number | null
          total_records_collected?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_approved?: boolean | null
          aggregation_rules?: Json | null
          bot_type?: string
          code?: string | null
          code_protected?: boolean | null
          collection_frequency?: string | null
          created_at?: string | null
          creator_profit_share?: number | null
          data_category?: string
          description?: string | null
          graduation_date?: string | null
          id?: string
          is_active?: boolean | null
          is_graduated?: boolean | null
          last_collection_at?: string | null
          name?: string
          output_format?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          sources?: Json | null
          total_data_sold?: number | null
          total_earnings?: number | null
          total_records_collected?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_bot_marketplace: {
        Row: {
          bot_id: string | null
          featured: boolean | null
          id: string
          is_available: boolean | null
          listed_at: string | null
          rental_price_monthly: number | null
          total_rentals: number | null
          total_revenue: number | null
        }
        Insert: {
          bot_id?: string | null
          featured?: boolean | null
          id?: string
          is_available?: boolean | null
          listed_at?: string | null
          rental_price_monthly?: number | null
          total_rentals?: number | null
          total_revenue?: number | null
        }
        Update: {
          bot_id?: string | null
          featured?: boolean | null
          id?: string
          is_available?: boolean | null
          listed_at?: string | null
          rental_price_monthly?: number | null
          total_rentals?: number | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "data_bot_marketplace_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_bot_marketplace_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_bot_rentals: {
        Row: {
          bot_id: string | null
          created_at: string | null
          id: string
          monthly_price: number
          rental_end: string | null
          rental_start: string | null
          renter_user_id: string
          status: string | null
        }
        Insert: {
          bot_id?: string | null
          created_at?: string | null
          id?: string
          monthly_price: number
          rental_end?: string | null
          rental_start?: string | null
          renter_user_id: string
          status?: string | null
        }
        Update: {
          bot_id?: string | null
          created_at?: string | null
          id?: string
          monthly_price?: number
          rental_end?: string | null
          rental_start?: string | null
          renter_user_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_bot_rentals_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_bot_rentals_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_collection_jobs: {
        Row: {
          bot_id: string | null
          completed_at: string | null
          created_at: string | null
          data_size_bytes: number | null
          error_message: string | null
          id: string
          records_collected: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          bot_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data_size_bytes?: number | null
          error_message?: string | null
          id?: string
          records_collected?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          bot_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          data_size_bytes?: number | null
          error_message?: string | null
          id?: string
          records_collected?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_collection_jobs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_collection_jobs_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots_public"
            referencedColumns: ["id"]
          },
        ]
      }
      data_exports: {
        Row: {
          buyer_info: Json | null
          created_at: string | null
          data_category: string
          export_type: string
          file_url: string | null
          id: string
          price_usd: number | null
          record_count: number | null
          status: string | null
        }
        Insert: {
          buyer_info?: Json | null
          created_at?: string | null
          data_category: string
          export_type: string
          file_url?: string | null
          id?: string
          price_usd?: number | null
          record_count?: number | null
          status?: string | null
        }
        Update: {
          buyer_info?: Json | null
          created_at?: string | null
          data_category?: string
          export_type?: string
          file_url?: string | null
          id?: string
          price_usd?: number | null
          record_count?: number | null
          status?: string | null
        }
        Relationships: []
      }
      data_mining_rewards: {
        Row: {
          amount_mined: number
          bot_id: string | null
          created_at: string | null
          id: string
          mining_source: string | null
          parent_boost_earned: number
          parent_token_id: string | null
          token_id: string | null
          user_id: string
        }
        Insert: {
          amount_mined?: number
          bot_id?: string | null
          created_at?: string | null
          id?: string
          mining_source?: string | null
          parent_boost_earned?: number
          parent_token_id?: string | null
          token_id?: string | null
          user_id: string
        }
        Update: {
          amount_mined?: number
          bot_id?: string | null
          created_at?: string | null
          id?: string
          mining_source?: string | null
          parent_boost_earned?: number
          parent_token_id?: string | null
          token_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "data_mining_rewards_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_mining_rewards_bot_id_fkey"
            columns: ["bot_id"]
            isOneToOne: false
            referencedRelation: "data_aggregator_bots_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_mining_rewards_parent_token_id_fkey"
            columns: ["parent_token_id"]
            isOneToOne: false
            referencedRelation: "data_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_mining_rewards_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "data_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      data_products: {
        Row: {
          category: string
          compliance_tags: string[] | null
          contains_pii: boolean | null
          created_at: string | null
          currency: string | null
          data_type: string
          description: string | null
          format: string | null
          id: string
          is_active: boolean | null
          is_anonymized: boolean | null
          name: string
          price: number
          sample_size: number | null
          total_revenue: number | null
          total_sales: number | null
          update_frequency: string | null
          updated_at: string | null
        }
        Insert: {
          category: string
          compliance_tags?: string[] | null
          contains_pii?: boolean | null
          created_at?: string | null
          currency?: string | null
          data_type: string
          description?: string | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymized?: boolean | null
          name: string
          price: number
          sample_size?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          update_frequency?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string
          compliance_tags?: string[] | null
          contains_pii?: boolean | null
          created_at?: string | null
          currency?: string | null
          data_type?: string
          description?: string | null
          format?: string | null
          id?: string
          is_active?: boolean | null
          is_anonymized?: boolean | null
          name?: string
          price?: number
          sample_size?: number | null
          total_revenue?: number | null
          total_sales?: number | null
          update_frequency?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      data_sales: {
        Row: {
          amount: number
          buyer_name: string | null
          buyer_type: string | null
          created_at: string | null
          currency: string | null
          delivered_at: string | null
          delivery_method: string | null
          id: string
          product_id: string | null
        }
        Insert: {
          amount: number
          buyer_name?: string | null
          buyer_type?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          id?: string
          product_id?: string | null
        }
        Update: {
          amount?: number
          buyer_name?: string | null
          buyer_type?: string | null
          created_at?: string | null
          currency?: string | null
          delivered_at?: string | null
          delivery_method?: string | null
          id?: string
          product_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_sales_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "data_products"
            referencedColumns: ["id"]
          },
        ]
      }
      data_token_boosts: {
        Row: {
          boost_amount: number
          boost_type: string | null
          child_token_id: string | null
          created_at: string | null
          id: string
          miners_contributing: number | null
          parent_token_id: string | null
        }
        Insert: {
          boost_amount: number
          boost_type?: string | null
          child_token_id?: string | null
          created_at?: string | null
          id?: string
          miners_contributing?: number | null
          parent_token_id?: string | null
        }
        Update: {
          boost_amount?: number
          boost_type?: string | null
          child_token_id?: string | null
          created_at?: string | null
          id?: string
          miners_contributing?: number | null
          parent_token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_token_boosts_child_token_id_fkey"
            columns: ["child_token_id"]
            isOneToOne: false
            referencedRelation: "data_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "data_token_boosts_parent_token_id_fkey"
            columns: ["parent_token_id"]
            isOneToOne: false
            referencedRelation: "data_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      data_token_holdings: {
        Row: {
          balance: number | null
          created_at: string | null
          earned_from_bots: number | null
          earned_from_data_sales: number | null
          id: string
          staked_balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          created_at?: string | null
          earned_from_bots?: number | null
          earned_from_data_sales?: number | null
          id?: string
          staked_balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          created_at?: string | null
          earned_from_bots?: number | null
          earned_from_data_sales?: number | null
          id?: string
          staked_balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      data_tokens: {
        Row: {
          boost_multiplier: number | null
          circulating_supply: number | null
          created_at: string | null
          data_category: string | null
          description: string | null
          emission_rate: number | null
          id: string
          is_active: boolean | null
          market_cap: number | null
          miners_count: number | null
          mining_power: number | null
          name: string
          parent_token_id: string | null
          price_usd: number | null
          symbol: string
          token_type: string | null
          total_mined: number | null
          total_supply: number | null
          use_cases: Json | null
        }
        Insert: {
          boost_multiplier?: number | null
          circulating_supply?: number | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          emission_rate?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          miners_count?: number | null
          mining_power?: number | null
          name?: string
          parent_token_id?: string | null
          price_usd?: number | null
          symbol?: string
          token_type?: string | null
          total_mined?: number | null
          total_supply?: number | null
          use_cases?: Json | null
        }
        Update: {
          boost_multiplier?: number | null
          circulating_supply?: number | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          emission_rate?: number | null
          id?: string
          is_active?: boolean | null
          market_cap?: number | null
          miners_count?: number | null
          mining_power?: number | null
          name?: string
          parent_token_id?: string | null
          price_usd?: number | null
          symbol?: string
          token_type?: string | null
          total_mined?: number | null
          total_supply?: number | null
          use_cases?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "data_tokens_parent_token_id_fkey"
            columns: ["parent_token_id"]
            isOneToOne: false
            referencedRelation: "data_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      dex_pairs: {
        Row: {
          base_symbol: string
          base_token_address: string
          base_token_coingecko_id: string | null
          chain: string
          created_at: string | null
          dex_name: string
          fee_percent: number | null
          id: string
          is_verified: boolean | null
          liquidity_usd: number | null
          pair_address: string
          price: number | null
          price_change_24h: number | null
          price_usd: number | null
          quote_symbol: string
          quote_token_address: string
          quote_token_coingecko_id: string | null
          updated_at: string | null
          volume_24h: number | null
        }
        Insert: {
          base_symbol: string
          base_token_address: string
          base_token_coingecko_id?: string | null
          chain?: string
          created_at?: string | null
          dex_name: string
          fee_percent?: number | null
          id?: string
          is_verified?: boolean | null
          liquidity_usd?: number | null
          pair_address: string
          price?: number | null
          price_change_24h?: number | null
          price_usd?: number | null
          quote_symbol: string
          quote_token_address: string
          quote_token_coingecko_id?: string | null
          updated_at?: string | null
          volume_24h?: number | null
        }
        Update: {
          base_symbol?: string
          base_token_address?: string
          base_token_coingecko_id?: string | null
          chain?: string
          created_at?: string | null
          dex_name?: string
          fee_percent?: number | null
          id?: string
          is_verified?: boolean | null
          liquidity_usd?: number | null
          pair_address?: string
          price?: number | null
          price_change_24h?: number | null
          price_usd?: number | null
          quote_symbol?: string
          quote_token_address?: string
          quote_token_coingecko_id?: string | null
          updated_at?: string | null
          volume_24h?: number | null
        }
        Relationships: []
      }
      dex_tokens: {
        Row: {
          address: string
          buy_tax: number | null
          chain: string
          created_at: string
          holders: number | null
          id: string
          is_honeypot: boolean | null
          is_verified: boolean | null
          launch_time: string | null
          liquidity: number | null
          market_cap: number | null
          name: string
          price: number | null
          price_change_1h: number | null
          price_change_24h: number | null
          score: number | null
          sell_tax: number | null
          symbol: string
          trending: boolean | null
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          address: string
          buy_tax?: number | null
          chain?: string
          created_at?: string
          holders?: number | null
          id?: string
          is_honeypot?: boolean | null
          is_verified?: boolean | null
          launch_time?: string | null
          liquidity?: number | null
          market_cap?: number | null
          name: string
          price?: number | null
          price_change_1h?: number | null
          price_change_24h?: number | null
          score?: number | null
          sell_tax?: number | null
          symbol: string
          trending?: boolean | null
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          address?: string
          buy_tax?: number | null
          chain?: string
          created_at?: string
          holders?: number | null
          id?: string
          is_honeypot?: boolean | null
          is_verified?: boolean | null
          launch_time?: string | null
          liquidity?: number | null
          market_cap?: number | null
          name?: string
          price?: number | null
          price_change_1h?: number | null
          price_change_24h?: number | null
          score?: number | null
          sell_tax?: number | null
          symbol?: string
          trending?: boolean | null
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      economic_calendar_events: {
        Row: {
          actual: string | null
          asset: string | null
          created_at: string
          event_time: string
          event_type: string
          forecast: string | null
          id: string
          impact: string
          is_active: boolean | null
          is_live: boolean | null
          previous: string | null
          title: string
        }
        Insert: {
          actual?: string | null
          asset?: string | null
          created_at?: string
          event_time: string
          event_type: string
          forecast?: string | null
          id?: string
          impact: string
          is_active?: boolean | null
          is_live?: boolean | null
          previous?: string | null
          title: string
        }
        Update: {
          actual?: string | null
          asset?: string | null
          created_at?: string
          event_time?: string
          event_type?: string
          forecast?: string | null
          id?: string
          impact?: string
          is_active?: boolean | null
          is_live?: boolean | null
          previous?: string | null
          title?: string
        }
        Relationships: []
      }
      education_articles: {
        Row: {
          category: string
          content: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean | null
          read_time_minutes: number | null
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          read_time_minutes?: number | null
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          content?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean | null
          read_time_minutes?: number | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      education_courses: {
        Row: {
          category: string
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          is_active: boolean | null
          is_premium: boolean | null
          lessons_count: number
          level: string
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          lessons_count?: number
          level: string
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          is_active?: boolean | null
          is_premium?: boolean | null
          lessons_count?: number
          level?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
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
      exchange_balances: {
        Row: {
          available_balance: number | null
          created_at: string
          currency: string
          id: string
          locked_balance: number | null
          total_deposited: number | null
          total_withdrawn: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_balance?: number | null
          created_at?: string
          currency: string
          id?: string
          locked_balance?: number | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_balance?: number | null
          created_at?: string
          currency?: string
          id?: string
          locked_balance?: number | null
          total_deposited?: number | null
          total_withdrawn?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      exchange_liquidity_pools: {
        Row: {
          auto_market_make: boolean | null
          base_token_reserve: number
          created_at: string
          fee_percent: number | null
          id: string
          is_active: boolean | null
          pair_id: string
          quote_reserve: number
          spread_percent: number | null
          total_liquidity: number | null
          updated_at: string
        }
        Insert: {
          auto_market_make?: boolean | null
          base_token_reserve?: number
          created_at?: string
          fee_percent?: number | null
          id?: string
          is_active?: boolean | null
          pair_id: string
          quote_reserve?: number
          spread_percent?: number | null
          total_liquidity?: number | null
          updated_at?: string
        }
        Update: {
          auto_market_make?: boolean | null
          base_token_reserve?: number
          created_at?: string
          fee_percent?: number | null
          id?: string
          is_active?: boolean | null
          pair_id?: string
          quote_reserve?: number
          spread_percent?: number | null
          total_liquidity?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_liquidity_pools_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: true
            referencedRelation: "exchange_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_orders: {
        Row: {
          created_at: string
          filled_at: string | null
          filled_quantity: number | null
          id: string
          order_type: string
          pair_id: string
          price: number | null
          quantity: number
          remaining_quantity: number | null
          side: string
          status: string | null
          stop_price: number | null
          time_in_force: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type: string
          pair_id: string
          price?: number | null
          quantity: number
          remaining_quantity?: number | null
          side: string
          status?: string | null
          stop_price?: number | null
          time_in_force?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          filled_at?: string | null
          filled_quantity?: number | null
          id?: string
          order_type?: string
          pair_id?: string
          price?: number | null
          quantity?: number
          remaining_quantity?: number | null
          side?: string
          status?: string | null
          stop_price?: number | null
          time_in_force?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "exchange_orders_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "exchange_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_pairs: {
        Row: {
          ask_price: number | null
          base_token_id: string | null
          bid_price: number | null
          created_at: string
          id: string
          is_active: boolean | null
          last_price: number | null
          maker_fee_percent: number | null
          max_order_size: number | null
          min_order_size: number | null
          pair_symbol: string
          price_precision: number | null
          quantity_precision: number | null
          quote_currency: string
          spread_percent: number | null
          taker_fee_percent: number | null
          trades_24h: number | null
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          ask_price?: number | null
          base_token_id?: string | null
          bid_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_price?: number | null
          maker_fee_percent?: number | null
          max_order_size?: number | null
          min_order_size?: number | null
          pair_symbol: string
          price_precision?: number | null
          quantity_precision?: number | null
          quote_currency: string
          spread_percent?: number | null
          taker_fee_percent?: number | null
          trades_24h?: number | null
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          ask_price?: number | null
          base_token_id?: string | null
          bid_price?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          last_price?: number | null
          maker_fee_percent?: number | null
          max_order_size?: number | null
          min_order_size?: number | null
          pair_symbol?: string
          price_precision?: number | null
          quantity_precision?: number | null
          quote_currency?: string
          spread_percent?: number | null
          taker_fee_percent?: number | null
          trades_24h?: number | null
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "exchange_pairs_base_token_id_fkey"
            columns: ["base_token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      exchange_trades: {
        Row: {
          buy_order_id: string | null
          buyer_fee: number | null
          buyer_user_id: string
          created_at: string
          id: string
          is_maker_buy: boolean | null
          pair_id: string
          price: number
          quantity: number
          sell_order_id: string | null
          seller_fee: number | null
          seller_user_id: string
          total: number
        }
        Insert: {
          buy_order_id?: string | null
          buyer_fee?: number | null
          buyer_user_id: string
          created_at?: string
          id?: string
          is_maker_buy?: boolean | null
          pair_id: string
          price: number
          quantity: number
          sell_order_id?: string | null
          seller_fee?: number | null
          seller_user_id: string
          total: number
        }
        Update: {
          buy_order_id?: string | null
          buyer_fee?: number | null
          buyer_user_id?: string
          created_at?: string
          id?: string
          is_maker_buy?: boolean | null
          pair_id?: string
          price?: number
          quantity?: number
          sell_order_id?: string | null
          seller_fee?: number | null
          seller_user_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "exchange_trades_buy_order_id_fkey"
            columns: ["buy_order_id"]
            isOneToOne: false
            referencedRelation: "exchange_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_trades_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "exchange_pairs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exchange_trades_sell_order_id_fkey"
            columns: ["sell_order_id"]
            isOneToOne: false
            referencedRelation: "exchange_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      faucet_claims: {
        Row: {
          amount: number
          chain: string
          created_at: string
          id: string
          ip_hash: string | null
          status: string | null
          token_id: string | null
          tx_hash: string | null
          user_id: string
          wallet_address: string | null
        }
        Insert: {
          amount: number
          chain?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          status?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id: string
          wallet_address?: string | null
        }
        Update: {
          amount?: number
          chain?: string
          created_at?: string
          id?: string
          ip_hash?: string | null
          status?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id?: string
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faucet_claims_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      fee_discount_tiers: {
        Row: {
          created_at: string | null
          extra_perks: Json | null
          fee_discount_percent: number
          futures_voucher_monthly: number | null
          id: string
          is_active: boolean | null
          min_holding: number
          tier_name: string
          token_symbol: string
        }
        Insert: {
          created_at?: string | null
          extra_perks?: Json | null
          fee_discount_percent: number
          futures_voucher_monthly?: number | null
          id?: string
          is_active?: boolean | null
          min_holding: number
          tier_name: string
          token_symbol?: string
        }
        Update: {
          created_at?: string | null
          extra_perks?: Json | null
          fee_discount_percent?: number
          futures_voucher_monthly?: number | null
          id?: string
          is_active?: boolean | null
          min_holding?: number
          tier_name?: string
          token_symbol?: string
        }
        Relationships: []
      }
      fee_vouchers: {
        Row: {
          created_at: string | null
          discount_percent: number | null
          expires_at: string
          id: string
          is_used: boolean | null
          source: string | null
          token_paid: string | null
          used_at: string | null
          used_on_transaction_id: string | null
          user_id: string
          valid_from: string | null
          value_usd: number
          voucher_type: string
        }
        Insert: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at: string
          id?: string
          is_used?: boolean | null
          source?: string | null
          token_paid?: string | null
          used_at?: string | null
          used_on_transaction_id?: string | null
          user_id: string
          valid_from?: string | null
          value_usd?: number
          voucher_type?: string
        }
        Update: {
          created_at?: string | null
          discount_percent?: number | null
          expires_at?: string
          id?: string
          is_used?: boolean | null
          source?: string | null
          token_paid?: string | null
          used_at?: string | null
          used_on_transaction_id?: string | null
          user_id?: string
          valid_from?: string | null
          value_usd?: number
          voucher_type?: string
        }
        Relationships: []
      }
      forensic_transactions: {
        Row: {
          amount: number
          block_number: number | null
          chain: string | null
          created_at: string
          flag_reason: string | null
          flagged: boolean | null
          from_address: string
          id: string
          timestamp: string
          to_address: string
          tx_hash: string
        }
        Insert: {
          amount: number
          block_number?: number | null
          chain?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean | null
          from_address: string
          id?: string
          timestamp?: string
          to_address: string
          tx_hash: string
        }
        Update: {
          amount?: number
          block_number?: number | null
          chain?: string | null
          created_at?: string
          flag_reason?: string | null
          flagged?: boolean | null
          from_address?: string
          id?: string
          timestamp?: string
          to_address?: string
          tx_hash?: string
        }
        Relationships: []
      }
      giveaway_campaigns: {
        Row: {
          created_at: string
          description: string | null
          ends_at: string | null
          funded_amount: number
          funding_status: string
          id: string
          name: string
          rules_url: string | null
          slug: string
          starts_at: string | null
          status: string
          total_prize_pool: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          funded_amount?: number
          funding_status?: string
          id?: string
          name: string
          rules_url?: string | null
          slug: string
          starts_at?: string | null
          status?: string
          total_prize_pool?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          ends_at?: string | null
          funded_amount?: number
          funding_status?: string
          id?: string
          name?: string
          rules_url?: string | null
          slug?: string
          starts_at?: string | null
          status?: string
          total_prize_pool?: number
          updated_at?: string
        }
        Relationships: []
      }
      giveaway_entries: {
        Row: {
          campaign_id: string
          created_at: string
          current_tier: string
          id: string
          is_winner: boolean
          prize_awarded_at: string | null
          prize_id: string | null
          referral_code: string
          updated_at: string
          user_id: string
          verified_referral_count: number
        }
        Insert: {
          campaign_id: string
          created_at?: string
          current_tier?: string
          id?: string
          is_winner?: boolean
          prize_awarded_at?: string | null
          prize_id?: string | null
          referral_code: string
          updated_at?: string
          user_id: string
          verified_referral_count?: number
        }
        Update: {
          campaign_id?: string
          created_at?: string
          current_tier?: string
          id?: string
          is_winner?: boolean
          prize_awarded_at?: string | null
          prize_id?: string | null
          referral_code?: string
          updated_at?: string
          user_id?: string
          verified_referral_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_entries_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "giveaway_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "giveaway_entries_prize_id_fkey"
            columns: ["prize_id"]
            isOneToOne: false
            referencedRelation: "giveaway_prizes"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_prizes: {
        Row: {
          awarded_count: number
          campaign_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          min_referrals: number
          name: string
          prize_type: string
          quantity: number
          sort_order: number
          tier: string
          value_usd: number
        }
        Insert: {
          awarded_count?: number
          campaign_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_referrals?: number
          name: string
          prize_type?: string
          quantity?: number
          sort_order?: number
          tier: string
          value_usd?: number
        }
        Update: {
          awarded_count?: number
          campaign_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          min_referrals?: number
          name?: string
          prize_type?: string
          quantity?: number
          sort_order?: number
          tier?: string
          value_usd?: number
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_prizes_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "giveaway_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      giveaway_referrals: {
        Row: {
          campaign_id: string
          created_at: string
          id: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status: string
          verified_at: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          referral_code: string
          referred_id: string
          referrer_id: string
          status?: string
          verified_at?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          referral_code?: string
          referred_id?: string
          referrer_id?: string
          status?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "giveaway_referrals_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "giveaway_campaigns"
            referencedColumns: ["id"]
          },
        ]
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
          {
            foreignKeyName: "graduation_tests_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      heatmap_data: {
        Row: {
          change_24h: number | null
          id: string
          market_cap: number | null
          name: string
          price: number
          sector: string | null
          symbol: string
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          change_24h?: number | null
          id?: string
          market_cap?: number | null
          name: string
          price?: number
          sector?: string | null
          symbol: string
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          change_24h?: number | null
          id?: string
          market_cap?: number | null
          name?: string
          price?: number
          sector?: string | null
          symbol?: string
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      influencer_partners: {
        Row: {
          commission_rate: number | null
          contract_terms: Json | null
          created_at: string
          email: string | null
          follower_count: number | null
          handle: string
          id: string
          name: string
          onboarded_at: string | null
          platform: string
          referral_code: string | null
          status: string | null
          tier: string | null
          tokens_allocated: Json | null
          total_earnings: number | null
          total_referrals: number | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          commission_rate?: number | null
          contract_terms?: Json | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          handle: string
          id?: string
          name: string
          onboarded_at?: string | null
          platform: string
          referral_code?: string | null
          status?: string | null
          tier?: string | null
          tokens_allocated?: Json | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          commission_rate?: number | null
          contract_terms?: Json | null
          created_at?: string
          email?: string | null
          follower_count?: number | null
          handle?: string
          id?: string
          name?: string
          onboarded_at?: string | null
          platform?: string
          referral_code?: string | null
          status?: string | null
          tier?: string | null
          tokens_allocated?: Json | null
          total_earnings?: number | null
          total_referrals?: number | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      influencer_referrals: {
        Row: {
          commission_earned: number | null
          created_at: string
          first_trade_completed: boolean | null
          id: string
          influencer_id: string | null
          referral_code: string
          referred_user_id: string
          signup_completed: boolean | null
          tokens_gifted: Json | null
        }
        Insert: {
          commission_earned?: number | null
          created_at?: string
          first_trade_completed?: boolean | null
          id?: string
          influencer_id?: string | null
          referral_code: string
          referred_user_id: string
          signup_completed?: boolean | null
          tokens_gifted?: Json | null
        }
        Update: {
          commission_earned?: number | null
          created_at?: string
          first_trade_completed?: boolean | null
          id?: string
          influencer_id?: string | null
          referral_code?: string
          referred_user_id?: string
          signup_completed?: boolean | null
          tokens_gifted?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_referrals_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencer_partners"
            referencedColumns: ["id"]
          },
        ]
      }
      insider_trades: {
        Row: {
          company: string
          created_at: string
          id: string
          insider_name: string
          insider_title: string
          ownership_percent: number | null
          price: number
          shares: number
          source: string | null
          symbol: string
          trade_date: string
          trade_type: string
          value: number
        }
        Insert: {
          company: string
          created_at?: string
          id?: string
          insider_name: string
          insider_title: string
          ownership_percent?: number | null
          price?: number
          shares?: number
          source?: string | null
          symbol: string
          trade_date?: string
          trade_type: string
          value?: number
        }
        Update: {
          company?: string
          created_at?: string
          id?: string
          insider_name?: string
          insider_title?: string
          ownership_percent?: number | null
          price?: number
          shares?: number
          source?: string | null
          symbol?: string
          trade_date?: string
          trade_type?: string
          value?: number
        }
        Relationships: []
      }
      institutional_filings: {
        Row: {
          aum_billions: number
          created_at: string
          exited_positions: string[] | null
          filing_date: string
          id: string
          institution: string
          new_positions: string[] | null
          quarter_end: string | null
          top_holdings: Json
        }
        Insert: {
          aum_billions?: number
          created_at?: string
          exited_positions?: string[] | null
          filing_date?: string
          id?: string
          institution: string
          new_positions?: string[] | null
          quarter_end?: string | null
          top_holdings?: Json
        }
        Update: {
          aum_billions?: number
          created_at?: string
          exited_positions?: string[] | null
          filing_date?: string
          id?: string
          institution?: string
          new_positions?: string[] | null
          quarter_end?: string | null
          top_holdings?: Json
        }
        Relationships: []
      }
      investment_portfolio: {
        Row: {
          asset_name: string
          asset_type: string
          created_at: string
          current_percent: number | null
          current_price: number | null
          entry_price: number | null
          id: string
          pnl_percent: number | null
          symbol: string
          target_percent: number
          updated_at: string
          value_usd: number | null
        }
        Insert: {
          asset_name: string
          asset_type: string
          created_at?: string
          current_percent?: number | null
          current_price?: number | null
          entry_price?: number | null
          id?: string
          pnl_percent?: number | null
          symbol: string
          target_percent: number
          updated_at?: string
          value_usd?: number | null
        }
        Update: {
          asset_name?: string
          asset_type?: string
          created_at?: string
          current_percent?: number | null
          current_price?: number | null
          entry_price?: number | null
          id?: string
          pnl_percent?: number | null
          symbol?: string
          target_percent?: number
          updated_at?: string
          value_usd?: number | null
        }
        Relationships: []
      }
      leaderboard_entries: {
        Row: {
          avatar_url: string | null
          badge: string | null
          category: string
          display_name: string | null
          highlight_stat: string | null
          id: string
          period_start: string
          period_type: string
          rank: number
          score: number
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          badge?: string | null
          category: string
          display_name?: string | null
          highlight_stat?: string | null
          id?: string
          period_start: string
          period_type: string
          rank: number
          score?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          badge?: string | null
          category?: string
          display_name?: string | null
          highlight_stat?: string | null
          id?: string
          period_start?: string
          period_type?: string
          rank?: number
          score?: number
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
      live_strategies: {
        Row: {
          catchphrase: string | null
          code_name: string | null
          created_at: string
          drawdown: number
          id: string
          last_trade_at: string | null
          name: string
          open_positions: number
          pairs: string[]
          persona_id: string | null
          personality: string | null
          primary_color: string | null
          profit: number
          profit_percent: number
          status: string
          strategy_id: string | null
          trades: number
          updated_at: string
          uptime_seconds: number
          user_id: string
          win_rate: number
        }
        Insert: {
          catchphrase?: string | null
          code_name?: string | null
          created_at?: string
          drawdown?: number
          id?: string
          last_trade_at?: string | null
          name: string
          open_positions?: number
          pairs?: string[]
          persona_id?: string | null
          personality?: string | null
          primary_color?: string | null
          profit?: number
          profit_percent?: number
          status?: string
          strategy_id?: string | null
          trades?: number
          updated_at?: string
          uptime_seconds?: number
          user_id: string
          win_rate?: number
        }
        Update: {
          catchphrase?: string | null
          code_name?: string | null
          created_at?: string
          drawdown?: number
          id?: string
          last_trade_at?: string | null
          name?: string
          open_positions?: number
          pairs?: string[]
          persona_id?: string | null
          personality?: string | null
          primary_color?: string | null
          profit?: number
          profit_percent?: number
          status?: string
          strategy_id?: string | null
          trades?: number
          updated_at?: string
          uptime_seconds?: number
          user_id?: string
          win_rate?: number
        }
        Relationships: [
          {
            foreignKeyName: "live_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_strategies_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      market_alerts: {
        Row: {
          actionable: boolean
          bookmarked: boolean
          category: string
          created_at: string
          description: string
          id: string
          link: string | null
          metrics: Json | null
          read: boolean
          severity: string
          source: string
          symbol: string | null
          title: string
          user_id: string | null
        }
        Insert: {
          actionable?: boolean
          bookmarked?: boolean
          category?: string
          created_at?: string
          description: string
          id?: string
          link?: string | null
          metrics?: Json | null
          read?: boolean
          severity?: string
          source?: string
          symbol?: string | null
          title: string
          user_id?: string | null
        }
        Update: {
          actionable?: boolean
          bookmarked?: boolean
          category?: string
          created_at?: string
          description?: string
          id?: string
          link?: string | null
          metrics?: Json | null
          read?: boolean
          severity?: string
          source?: string
          symbol?: string | null
          title?: string
          user_id?: string | null
        }
        Relationships: []
      }
      market_coins: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          large_url: string | null
          market_cap_rank: number | null
          name: string
          platforms: Json | null
          symbol: string
          thumb_url: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id: string
          is_active?: boolean | null
          large_url?: string | null
          market_cap_rank?: number | null
          name: string
          platforms?: Json | null
          symbol: string
          thumb_url?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          large_url?: string | null
          market_cap_rank?: number | null
          name?: string
          platforms?: Json | null
          symbol?: string
          thumb_url?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      market_ohlcv: {
        Row: {
          close: number
          close_time: string | null
          coin_id: string
          created_at: string | null
          high: number
          id: string
          low: number
          open: number
          open_time: string
          timeframe: string
          volume: number | null
        }
        Insert: {
          close: number
          close_time?: string | null
          coin_id: string
          created_at?: string | null
          high: number
          id?: string
          low: number
          open: number
          open_time: string
          timeframe: string
          volume?: number | null
        }
        Update: {
          close?: number
          close_time?: string | null
          coin_id?: string
          created_at?: string | null
          high?: number
          id?: string
          low?: number
          open?: number
          open_time?: string
          timeframe?: string
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_ohlcv_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: false
            referencedRelation: "market_coins"
            referencedColumns: ["id"]
          },
        ]
      }
      market_ohlcv_cache: {
        Row: {
          close: number
          created_at: string
          high: number
          id: string
          low: number
          open: number
          open_time: string
          symbol: string
          timeframe: string
          volume: number | null
        }
        Insert: {
          close: number
          created_at?: string
          high: number
          id?: string
          low: number
          open: number
          open_time: string
          symbol: string
          timeframe: string
          volume?: number | null
        }
        Update: {
          close?: number
          created_at?: string
          high?: number
          id?: string
          low?: number
          open?: number
          open_time?: string
          symbol?: string
          timeframe?: string
          volume?: number | null
        }
        Relationships: []
      }
      market_prices: {
        Row: {
          ath: number | null
          ath_change_percentage: number | null
          ath_date: string | null
          atl: number | null
          atl_change_percentage: number | null
          atl_date: string | null
          circulating_supply: number | null
          coin_id: string
          fully_diluted_valuation: number | null
          high_24h: number | null
          id: string
          last_updated: string | null
          low_24h: number | null
          market_cap: number | null
          market_cap_change_24h: number | null
          market_cap_rank: number | null
          max_supply: number | null
          price_btc: number | null
          price_change_24h: number | null
          price_change_percentage_24h: number | null
          price_change_percentage_30d: number | null
          price_change_percentage_7d: number | null
          price_eth: number | null
          price_usd: number
          total_supply: number | null
          total_volume: number | null
        }
        Insert: {
          ath?: number | null
          ath_change_percentage?: number | null
          ath_date?: string | null
          atl?: number | null
          atl_change_percentage?: number | null
          atl_date?: string | null
          circulating_supply?: number | null
          coin_id: string
          fully_diluted_valuation?: number | null
          high_24h?: number | null
          id?: string
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          market_cap_change_24h?: number | null
          market_cap_rank?: number | null
          max_supply?: number | null
          price_btc?: number | null
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          price_change_percentage_30d?: number | null
          price_change_percentage_7d?: number | null
          price_eth?: number | null
          price_usd: number
          total_supply?: number | null
          total_volume?: number | null
        }
        Update: {
          ath?: number | null
          ath_change_percentage?: number | null
          ath_date?: string | null
          atl?: number | null
          atl_change_percentage?: number | null
          atl_date?: string | null
          circulating_supply?: number | null
          coin_id?: string
          fully_diluted_valuation?: number | null
          high_24h?: number | null
          id?: string
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          market_cap_change_24h?: number | null
          market_cap_rank?: number | null
          max_supply?: number | null
          price_btc?: number | null
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          price_change_percentage_30d?: number | null
          price_change_percentage_7d?: number | null
          price_eth?: number | null
          price_usd?: number
          total_supply?: number | null
          total_volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "market_prices_coin_id_fkey"
            columns: ["coin_id"]
            isOneToOne: true
            referencedRelation: "market_coins"
            referencedColumns: ["id"]
          },
        ]
      }
      market_screener_assets: {
        Row: {
          change_24h: number | null
          change_7d: number | null
          created_at: string
          id: string
          macd_signal: string | null
          market_cap: number | null
          name: string
          price: number
          price_score: number | null
          rsi: number | null
          symbol: string
          updated_at: string
          volume_24h: number | null
          volume_change: number | null
        }
        Insert: {
          change_24h?: number | null
          change_7d?: number | null
          created_at?: string
          id?: string
          macd_signal?: string | null
          market_cap?: number | null
          name: string
          price: number
          price_score?: number | null
          rsi?: number | null
          symbol: string
          updated_at?: string
          volume_24h?: number | null
          volume_change?: number | null
        }
        Update: {
          change_24h?: number | null
          change_7d?: number | null
          created_at?: string
          id?: string
          macd_signal?: string | null
          market_cap?: number | null
          name?: string
          price?: number
          price_score?: number | null
          rsi?: number | null
          symbol?: string
          updated_at?: string
          volume_24h?: number | null
          volume_change?: number | null
        }
        Relationships: []
      }
      market_sync_logs: {
        Row: {
          completed_at: string | null
          error_message: string | null
          id: string
          records_synced: number | null
          started_at: string | null
          status: string | null
          sync_type: string
        }
        Insert: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type: string
        }
        Update: {
          completed_at?: string | null
          error_message?: string | null
          id?: string
          records_synced?: number | null
          started_at?: string | null
          status?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      marketplace_category_fees: {
        Row: {
          category: string
          created_at: string | null
          display_name: string
          finder_fee_percent: number
          id: string
          is_active: boolean | null
          min_deal_size: number | null
          pass_through_fee_percent: number
          updated_at: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          display_name: string
          finder_fee_percent?: number
          id?: string
          is_active?: boolean | null
          min_deal_size?: number | null
          pass_through_fee_percent?: number
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          display_name?: string
          finder_fee_percent?: number
          id?: string
          is_active?: boolean | null
          min_deal_size?: number | null
          pass_through_fee_percent?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_deals: {
        Row: {
          buyer_user_id: string | null
          category: string
          created_at: string | null
          currency: string | null
          description: string | null
          external_url: string | null
          finder_fee_amount: number | null
          id: string
          listing_price: number | null
          metadata: Json | null
          pass_through_fee_amount: number | null
          seller_user_id: string | null
          status: string | null
          title: string
          total_platform_fee: number | null
          updated_at: string | null
        }
        Insert: {
          buyer_user_id?: string | null
          category: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_url?: string | null
          finder_fee_amount?: number | null
          id?: string
          listing_price?: number | null
          metadata?: Json | null
          pass_through_fee_amount?: number | null
          seller_user_id?: string | null
          status?: string | null
          title: string
          total_platform_fee?: number | null
          updated_at?: string | null
        }
        Update: {
          buyer_user_id?: string | null
          category?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          external_url?: string | null
          finder_fee_amount?: number | null
          id?: string
          listing_price?: number | null
          metadata?: Json | null
          pass_through_fee_amount?: number | null
          seller_user_id?: string | null
          status?: string | null
          title?: string
          total_platform_fee?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      marketplace_suggestions: {
        Row: {
          category: string
          comments: number
          created_at: string | null
          description: string
          id: string
          is_hot: boolean | null
          status: string
          title: string
          updated_at: string | null
          user_id: string
          votes: number
        }
        Insert: {
          category?: string
          comments?: number
          created_at?: string | null
          description: string
          id?: string
          is_hot?: boolean | null
          status?: string
          title: string
          updated_at?: string | null
          user_id: string
          votes?: number
        }
        Update: {
          category?: string
          comments?: number
          created_at?: string | null
          description?: string
          id?: string
          is_hot?: boolean | null
          status?: string
          title?: string
          updated_at?: string | null
          user_id?: string
          votes?: number
        }
        Relationships: []
      }
      ml_models: {
        Row: {
          accuracy: number
          config: Json
          confusion_matrix: Json
          created_at: string
          feature_importance: Json
          id: string
          model_type: string
          name: string
          status: string
          training_metrics: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          accuracy?: number
          config?: Json
          confusion_matrix?: Json
          created_at?: string
          feature_importance?: Json
          id?: string
          model_type: string
          name: string
          status?: string
          training_metrics?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          accuracy?: number
          config?: Json
          confusion_matrix?: Json
          created_at?: string
          feature_importance?: Json
          id?: string
          model_type?: string
          name?: string
          status?: string
          training_metrics?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      nft_generation_queue: {
        Row: {
          base_price: number | null
          batch_name: string | null
          chain: string | null
          completed_at: string | null
          completed_count: number | null
          created_at: string | null
          id: string
          started_at: string | null
          status: string | null
          style: string | null
          theme: string | null
          total_count: number | null
          user_id: string | null
        }
        Insert: {
          base_price?: number | null
          batch_name?: string | null
          chain?: string | null
          completed_at?: string | null
          completed_count?: number | null
          created_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          style?: string | null
          theme?: string | null
          total_count?: number | null
          user_id?: string | null
        }
        Update: {
          base_price?: number | null
          batch_name?: string | null
          chain?: string | null
          completed_at?: string | null
          completed_count?: number | null
          created_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          style?: string | null
          theme?: string | null
          total_count?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      operator_territories: {
        Row: {
          active_operators: number | null
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          name: string
          territory_type: string
          total_expenses: number | null
          total_revenue: number | null
          updated_at: string
        }
        Insert: {
          active_operators?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name: string
          territory_type: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Update: {
          active_operators?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          name?: string
          territory_type?: string
          total_expenses?: number | null
          total_revenue?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      operator_transactions: {
        Row: {
          amount: number
          created_at: string
          currency: string
          description: string | null
          from_operator_id: string | null
          from_wallet_id: string | null
          id: string
          metadata: Json | null
          reference_id: string | null
          reference_type: string | null
          status: string | null
          to_operator_id: string | null
          to_wallet_id: string | null
          transaction_type: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency: string
          description?: string | null
          from_operator_id?: string | null
          from_wallet_id?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          to_operator_id?: string | null
          to_wallet_id?: string | null
          transaction_type: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          description?: string | null
          from_operator_id?: string | null
          from_wallet_id?: string | null
          id?: string
          metadata?: Json | null
          reference_id?: string | null
          reference_type?: string | null
          status?: string | null
          to_operator_id?: string | null
          to_wallet_id?: string | null
          transaction_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_transactions_from_operator_id_fkey"
            columns: ["from_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_transactions_from_wallet_id_fkey"
            columns: ["from_wallet_id"]
            isOneToOne: false
            referencedRelation: "operator_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_transactions_to_operator_id_fkey"
            columns: ["to_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_transactions_to_wallet_id_fkey"
            columns: ["to_wallet_id"]
            isOneToOne: false
            referencedRelation: "operator_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_wallets: {
        Row: {
          available_balance: number | null
          balance: number | null
          created_at: string
          currency: string
          id: string
          last_transaction_at: string | null
          locked_balance: number | null
          operator_id: string
          total_deposited: number | null
          total_fees_collected: number | null
          total_fees_paid: number | null
          total_withdrawn: number | null
          updated_at: string
        }
        Insert: {
          available_balance?: number | null
          balance?: number | null
          created_at?: string
          currency: string
          id?: string
          last_transaction_at?: string | null
          locked_balance?: number | null
          operator_id: string
          total_deposited?: number | null
          total_fees_collected?: number | null
          total_fees_paid?: number | null
          total_withdrawn?: number | null
          updated_at?: string
        }
        Update: {
          available_balance?: number | null
          balance?: number | null
          created_at?: string
          currency?: string
          id?: string
          last_transaction_at?: string | null
          locked_balance?: number | null
          operator_id?: string
          total_deposited?: number | null
          total_fees_collected?: number | null
          total_fees_paid?: number | null
          total_withdrawn?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_wallets_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          commission_rate: number | null
          created_at: string
          description: string | null
          id: string
          is_admin_owned: boolean | null
          is_clone: boolean | null
          linked_influencer_id: string | null
          linked_rental_id: string | null
          linked_strategy_id: string | null
          name: string
          operator_type: string
          owner_user_id: string | null
          parent_operator_id: string | null
          performance_metrics: Json | null
          reinvestment_rate: number | null
          status: string | null
          territory_id: string | null
          updated_at: string
        }
        Insert: {
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_admin_owned?: boolean | null
          is_clone?: boolean | null
          linked_influencer_id?: string | null
          linked_rental_id?: string | null
          linked_strategy_id?: string | null
          name: string
          operator_type: string
          owner_user_id?: string | null
          parent_operator_id?: string | null
          performance_metrics?: Json | null
          reinvestment_rate?: number | null
          status?: string | null
          territory_id?: string | null
          updated_at?: string
        }
        Update: {
          commission_rate?: number | null
          created_at?: string
          description?: string | null
          id?: string
          is_admin_owned?: boolean | null
          is_clone?: boolean | null
          linked_influencer_id?: string | null
          linked_rental_id?: string | null
          linked_strategy_id?: string | null
          name?: string
          operator_type?: string
          owner_user_id?: string | null
          parent_operator_id?: string | null
          performance_metrics?: Json | null
          reinvestment_rate?: number | null
          status?: string | null
          territory_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operators_linked_influencer_id_fkey"
            columns: ["linked_influencer_id"]
            isOneToOne: false
            referencedRelation: "influencer_partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_linked_rental_id_fkey"
            columns: ["linked_rental_id"]
            isOneToOne: false
            referencedRelation: "strategy_rentals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_linked_strategy_id_fkey"
            columns: ["linked_strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_linked_strategy_id_fkey"
            columns: ["linked_strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_parent_operator_id_fkey"
            columns: ["parent_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operators_territory_id_fkey"
            columns: ["territory_id"]
            isOneToOne: false
            referencedRelation: "operator_territories"
            referencedColumns: ["id"]
          },
        ]
      }
      paper_portfolio: {
        Row: {
          avg_price: number
          created_at: string
          id: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avg_price?: number
          created_at?: string
          id?: string
          quantity?: number
          symbol: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avg_price?: number
          created_at?: string
          id?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      paper_trades: {
        Row: {
          created_at: string
          executed_at: string | null
          filled_price: number | null
          filled_quantity: number | null
          id: string
          order_type: string
          price: number | null
          quantity: number
          side: string
          status: string
          stop_price: number | null
          symbol: string
          time_in_force: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          executed_at?: string | null
          filled_price?: number | null
          filled_quantity?: number | null
          id: string
          order_type: string
          price?: number | null
          quantity: number
          side: string
          status?: string
          stop_price?: number | null
          symbol: string
          time_in_force?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          executed_at?: string | null
          filled_price?: number | null
          filled_quantity?: number | null
          id?: string
          order_type?: string
          price?: number | null
          quantity?: number
          side?: string
          status?: string
          stop_price?: number | null
          symbol?: string
          time_in_force?: string | null
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
      platform_activity_log: {
        Row: {
          activity_type: string
          category: string
          created_at: string
          description: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          category?: string
          created_at?: string
          description: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          category?: string
          created_at?: string
          description?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
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
      platform_tokens: {
        Row: {
          chain: string
          circulating_supply: number
          contract_address: string | null
          created_at: string
          decimals: number
          faucet_pool: number
          id: string
          is_active: boolean | null
          is_native: boolean | null
          logo_url: string | null
          name: string
          symbol: string
          total_supply: number
          treasury_supply: number
          updated_at: string
        }
        Insert: {
          chain: string
          circulating_supply?: number
          contract_address?: string | null
          created_at?: string
          decimals?: number
          faucet_pool?: number
          id?: string
          is_active?: boolean | null
          is_native?: boolean | null
          logo_url?: string | null
          name: string
          symbol: string
          total_supply?: number
          treasury_supply?: number
          updated_at?: string
        }
        Update: {
          chain?: string
          circulating_supply?: number
          contract_address?: string | null
          created_at?: string
          decimals?: number
          faucet_pool?: number
          id?: string
          is_active?: boolean | null
          is_native?: boolean | null
          logo_url?: string | null
          name?: string
          symbol?: string
          total_supply?: number
          treasury_supply?: number
          updated_at?: string
        }
        Relationships: []
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
      portfolio_holdings: {
        Row: {
          account_id: string | null
          allocation_percent: number | null
          change_24h: number | null
          created_at: string
          id: string
          name: string
          quantity: number
          symbol: string
          updated_at: string
          user_id: string
          value_usd: number | null
        }
        Insert: {
          account_id?: string | null
          allocation_percent?: number | null
          change_24h?: number | null
          created_at?: string
          id?: string
          name: string
          quantity?: number
          symbol: string
          updated_at?: string
          user_id: string
          value_usd?: number | null
        }
        Update: {
          account_id?: string | null
          allocation_percent?: number | null
          change_24h?: number | null
          created_at?: string
          id?: string
          name?: string
          quantity?: number
          symbol?: string
          updated_at?: string
          user_id?: string
          value_usd?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolio_holdings_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "connected_accounts_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_performance: {
        Row: {
          id: string
          is_positive: boolean | null
          metric_name: string
          metric_value: number
          updated_at: string
        }
        Insert: {
          id?: string
          is_positive?: boolean | null
          metric_name: string
          metric_value: number
          updated_at?: string
        }
        Update: {
          id?: string
          is_positive?: boolean | null
          metric_name?: string
          metric_value?: number
          updated_at?: string
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
          controlled_by: string | null
          created_at: string
          id: string
          locked_balance: number
          nonce: number
          staked_balance: number
          updated_at: string
          wallet_address: string
          wallet_type: string | null
        }
        Insert: {
          balance?: number
          controlled_by?: string | null
          created_at?: string
          id?: string
          locked_balance?: number
          nonce?: number
          staked_balance?: number
          updated_at?: string
          wallet_address: string
          wallet_type?: string | null
        }
        Update: {
          balance?: number
          controlled_by?: string | null
          created_at?: string
          id?: string
          locked_balance?: number
          nonce?: number
          staked_balance?: number
          updated_at?: string
          wallet_address?: string
          wallet_type?: string | null
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
      qtc_treasury_config: {
        Row: {
          config_key: string
          config_value: Json
          id: string
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          id?: string
          updated_at?: string | null
          updated_by?: string | null
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
      quantum_backends: {
        Row: {
          avg_job_time: string | null
          id: string
          name: string
          provider: string | null
          qubits: number
          queue_length: number
          status: string
          updated_at: string
        }
        Insert: {
          avg_job_time?: string | null
          id: string
          name: string
          provider?: string | null
          qubits?: number
          queue_length?: number
          status?: string
          updated_at?: string
        }
        Update: {
          avg_job_time?: string | null
          id?: string
          name?: string
          provider?: string | null
          qubits?: number
          queue_length?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      quantum_jobs: {
        Row: {
          backend: string
          completed_at: string | null
          created_at: string
          id: string
          name: string
          qubits: number
          result: Json | null
          shots: number
          status: string
          user_id: string
        }
        Insert: {
          backend: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name: string
          qubits?: number
          result?: Json | null
          shots?: number
          status?: string
          user_id: string
        }
        Update: {
          backend?: string
          completed_at?: string | null
          created_at?: string
          id?: string
          name?: string
          qubits?: number
          result?: Json | null
          shots?: number
          status?: string
          user_id?: string
        }
        Relationships: []
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
          {
            foreignKeyName: "quwallet_addresses_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "quwallet_wallets_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      quwallet_wallets: {
        Row: {
          created_at: string
          dilithium_public_key: string
          ecdsa_public_key: string | null
          hardware_type: string | null
          id: string
          is_active: boolean | null
          is_admin_controlled: boolean | null
          is_hardware: boolean | null
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
          hardware_type?: string | null
          id?: string
          is_active?: boolean | null
          is_admin_controlled?: boolean | null
          is_hardware?: boolean | null
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
          hardware_type?: string | null
          id?: string
          is_active?: boolean | null
          is_admin_controlled?: boolean | null
          is_hardware?: boolean | null
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
      rate_limit_extensions: {
        Row: {
          amount_charged: number
          calls_used: number
          currency: string
          expires_at: string
          extra_calls: number
          function_name: string
          id: string
          purchased_at: string
          status: string
          surcharge_percent: number
          user_id: string
        }
        Insert: {
          amount_charged?: number
          calls_used?: number
          currency?: string
          expires_at?: string
          extra_calls?: number
          function_name: string
          id?: string
          purchased_at?: string
          status?: string
          surcharge_percent?: number
          user_id: string
        }
        Update: {
          amount_charged?: number
          calls_used?: number
          currency?: string
          expires_at?: string
          extra_calls?: number
          function_name?: string
          id?: string
          purchased_at?: string
          status?: string
          surcharge_percent?: number
          user_id?: string
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
      reward_redemptions: {
        Row: {
          amount_paid: number
          budget_year: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          payment_method: string
          reward_id: string
          shipping_address: Json | null
          status: string
          tracking_number: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_paid?: number
          budget_year?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method: string
          reward_id: string
          shipping_address?: Json | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_paid?: number
          budget_year?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          payment_method?: string
          reward_id?: string
          shipping_address?: Json | null
          status?: string
          tracking_number?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reward_redemptions_reward_id_fkey"
            columns: ["reward_id"]
            isOneToOne: false
            referencedRelation: "rewards_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      rewards_budget: {
        Row: {
          created_at: string
          fiscal_year: number
          id: string
          is_locked: boolean
          max_rewards_budget: number | null
          max_rewards_percent: number
          remaining_budget: number | null
          total_allocated: number
          total_distributed: number
          total_platform_profit: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          fiscal_year: number
          id?: string
          is_locked?: boolean
          max_rewards_budget?: number | null
          max_rewards_percent?: number
          remaining_budget?: number | null
          total_allocated?: number
          total_distributed?: number
          total_platform_profit?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          fiscal_year?: number
          id?: string
          is_locked?: boolean
          max_rewards_budget?: number | null
          max_rewards_percent?: number
          remaining_budget?: number | null
          total_allocated?: number
          total_distributed?: number
          total_platform_profit?: number
          updated_at?: string
        }
        Relationships: []
      }
      rewards_catalog: {
        Row: {
          available_from: string | null
          available_until: string | null
          category: string
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          is_seasonal: boolean
          name: string
          points_price: number | null
          qtc_price: number | null
          redeemed_count: number
          sort_order: number
          stock_quantity: number | null
          subcategory: string | null
          tier_required: string | null
          value_usd: number
        }
        Insert: {
          available_from?: string | null
          available_until?: string | null
          category: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_seasonal?: boolean
          name: string
          points_price?: number | null
          qtc_price?: number | null
          redeemed_count?: number
          sort_order?: number
          stock_quantity?: number | null
          subcategory?: string | null
          tier_required?: string | null
          value_usd?: number
        }
        Update: {
          available_from?: string | null
          available_until?: string | null
          category?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_seasonal?: boolean
          name?: string
          points_price?: number | null
          qtc_price?: number | null
          redeemed_count?: number
          sort_order?: number
          stock_quantity?: number | null
          subcategory?: string | null
          tier_required?: string | null
          value_usd?: number
        }
        Relationships: []
      }
      satellite_services: {
        Row: {
          affiliate_code: string | null
          api_url: string | null
          category: string
          created_at: string | null
          description: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_crypto_native: boolean | null
          is_usa_compatible: boolean | null
          logo_url: string | null
          name: string
          requires_api_key: boolean | null
          revenue_model: string | null
          revenue_share_percent: number | null
          sort_order: number | null
          subcategory: string | null
          supported_chains: string[] | null
          updated_at: string | null
          website_url: string | null
          websocket_url: string | null
        }
        Insert: {
          affiliate_code?: string | null
          api_url?: string | null
          category: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_crypto_native?: boolean | null
          is_usa_compatible?: boolean | null
          logo_url?: string | null
          name: string
          requires_api_key?: boolean | null
          revenue_model?: string | null
          revenue_share_percent?: number | null
          sort_order?: number | null
          subcategory?: string | null
          supported_chains?: string[] | null
          updated_at?: string | null
          website_url?: string | null
          websocket_url?: string | null
        }
        Update: {
          affiliate_code?: string | null
          api_url?: string | null
          category?: string
          created_at?: string | null
          description?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_crypto_native?: boolean | null
          is_usa_compatible?: boolean | null
          logo_url?: string | null
          name?: string
          requires_api_key?: boolean | null
          revenue_model?: string | null
          revenue_share_percent?: number | null
          sort_order?: number | null
          subcategory?: string | null
          supported_chains?: string[] | null
          updated_at?: string | null
          website_url?: string | null
          websocket_url?: string | null
        }
        Relationships: []
      }
      saved_payment_methods: {
        Row: {
          bank_name: string | null
          card_brand: string | null
          created_at: string
          exp_month: number | null
          exp_year: number | null
          id: string
          is_default: boolean | null
          last_four: string | null
          metadata: Json | null
          method_type: string
          nickname: string
          stripe_customer_id: string | null
          stripe_payment_method_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bank_name?: string | null
          card_brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          method_type?: string
          nickname: string
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          bank_name?: string | null
          card_brand?: string | null
          created_at?: string
          exp_month?: number | null
          exp_year?: number | null
          id?: string
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          method_type?: string
          nickname?: string
          stripe_customer_id?: string | null
          stripe_payment_method_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      screener_results: {
        Row: {
          ai_score: number | null
          asset_type: string
          category: string | null
          change_24h: number | null
          confidence: number
          created_at: string
          current_price: number | null
          id: string
          is_active: boolean | null
          is_hot: boolean | null
          name: string
          patterns: string[] | null
          price_target: number | null
          signal: string
          symbol: string
          triggers: string[] | null
          updated_at: string
          volume_24h: number | null
        }
        Insert: {
          ai_score?: number | null
          asset_type: string
          category?: string | null
          change_24h?: number | null
          confidence: number
          created_at?: string
          current_price?: number | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          name: string
          patterns?: string[] | null
          price_target?: number | null
          signal: string
          symbol: string
          triggers?: string[] | null
          updated_at?: string
          volume_24h?: number | null
        }
        Update: {
          ai_score?: number | null
          asset_type?: string
          category?: string | null
          change_24h?: number | null
          confidence?: number
          created_at?: string
          current_price?: number | null
          id?: string
          is_active?: boolean | null
          is_hot?: boolean | null
          name?: string
          patterns?: string[] | null
          price_target?: number | null
          signal?: string
          symbol?: string
          triggers?: string[] | null
          updated_at?: string
          volume_24h?: number | null
        }
        Relationships: []
      }
      script_runs: {
        Row: {
          completed_at: string | null
          created_at: string
          error_message: string | null
          id: string
          profit_factor: number | null
          script_code: string
          script_name: string
          sharpe_ratio: number | null
          started_at: string | null
          status: string | null
          symbol: string | null
          timeframe: string | null
          total_return: number | null
          total_trades: number | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          profit_factor?: number | null
          script_code: string
          script_name: string
          sharpe_ratio?: number | null
          started_at?: string | null
          status?: string | null
          symbol?: string | null
          timeframe?: string | null
          total_return?: number | null
          total_trades?: number | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          profit_factor?: number | null
          script_code?: string
          script_name?: string
          sharpe_ratio?: number | null
          started_at?: string | null
          status?: string | null
          symbol?: string | null
          timeframe?: string | null
          total_return?: number | null
          total_trades?: number | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      security_audit_log: {
        Row: {
          created_at: string
          details: Json | null
          event_type: string
          id: string
          ip_address: unknown
          severity: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          details?: Json | null
          event_type: string
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          details?: Json | null
          event_type?: string
          id?: string
          ip_address?: unknown
          severity?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
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
      smart_money_flows: {
        Row: {
          asset: string
          change_24h: number | null
          created_at: string
          id: string
          inflow_millions: number
          institutional_bias: string | null
          net_flow_millions: number
          outflow_millions: number
          price: number | null
          updated_at: string
          whale_activity: string | null
        }
        Insert: {
          asset: string
          change_24h?: number | null
          created_at?: string
          id?: string
          inflow_millions?: number
          institutional_bias?: string | null
          net_flow_millions?: number
          outflow_millions?: number
          price?: number | null
          updated_at?: string
          whale_activity?: string | null
        }
        Update: {
          asset?: string
          change_24h?: number | null
          created_at?: string
          id?: string
          inflow_millions?: number
          institutional_bias?: string | null
          net_flow_millions?: number
          outflow_millions?: number
          price?: number | null
          updated_at?: string
          whale_activity?: string | null
        }
        Relationships: []
      }
      solana_token_balances: {
        Row: {
          balance: number | null
          id: string
          last_updated: string | null
          token_id: string
          value_usd: number | null
          wallet_id: string
        }
        Insert: {
          balance?: number | null
          id?: string
          last_updated?: string | null
          token_id: string
          value_usd?: number | null
          wallet_id: string
        }
        Update: {
          balance?: number | null
          id?: string
          last_updated?: string | null
          token_id?: string
          value_usd?: number | null
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "solana_token_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "solana_tokens"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solana_token_balances_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "solana_wallets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "solana_token_balances_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "solana_wallets_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      solana_tokens: {
        Row: {
          coingecko_id: string | null
          created_at: string | null
          daily_volume: number | null
          decimals: number | null
          holder_count: number | null
          id: string
          is_platform_token: boolean | null
          is_verified: boolean | null
          liquidity_usd: number | null
          logo_uri: string | null
          mint_address: string
          name: string
          price_change_24h: number | null
          price_usd: number | null
          symbol: string
          total_supply: number | null
          updated_at: string | null
        }
        Insert: {
          coingecko_id?: string | null
          created_at?: string | null
          daily_volume?: number | null
          decimals?: number | null
          holder_count?: number | null
          id?: string
          is_platform_token?: boolean | null
          is_verified?: boolean | null
          liquidity_usd?: number | null
          logo_uri?: string | null
          mint_address: string
          name: string
          price_change_24h?: number | null
          price_usd?: number | null
          symbol: string
          total_supply?: number | null
          updated_at?: string | null
        }
        Update: {
          coingecko_id?: string | null
          created_at?: string | null
          daily_volume?: number | null
          decimals?: number | null
          holder_count?: number | null
          id?: string
          is_platform_token?: boolean | null
          is_verified?: boolean | null
          liquidity_usd?: number | null
          logo_uri?: string | null
          mint_address?: string
          name?: string
          price_change_24h?: number | null
          price_usd?: number | null
          symbol?: string
          total_supply?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solana_tokens_coingecko_id_fkey"
            columns: ["coingecko_id"]
            isOneToOne: false
            referencedRelation: "market_coins"
            referencedColumns: ["id"]
          },
        ]
      }
      solana_transactions: {
        Row: {
          amount: number
          block_time: string | null
          created_at: string | null
          fee_lamports: number | null
          from_wallet: string
          id: string
          metadata: Json | null
          signature: string
          slot: number | null
          status: string | null
          to_wallet: string
          token_mint: string | null
          tx_type: string
        }
        Insert: {
          amount: number
          block_time?: string | null
          created_at?: string | null
          fee_lamports?: number | null
          from_wallet: string
          id?: string
          metadata?: Json | null
          signature: string
          slot?: number | null
          status?: string | null
          to_wallet: string
          token_mint?: string | null
          tx_type: string
        }
        Update: {
          amount?: number
          block_time?: string | null
          created_at?: string | null
          fee_lamports?: number | null
          from_wallet?: string
          id?: string
          metadata?: Json | null
          signature?: string
          slot?: number | null
          status?: string | null
          to_wallet?: string
          token_mint?: string | null
          tx_type?: string
        }
        Relationships: []
      }
      solana_wallets: {
        Row: {
          balance_sol: number | null
          chain: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          label: string | null
          last_activity: string | null
          operator_id: string | null
          owner_user_id: string | null
          updated_at: string | null
          wallet_address: string
          wallet_type: string
        }
        Insert: {
          balance_sol?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_activity?: string | null
          operator_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          wallet_address: string
          wallet_type: string
        }
        Update: {
          balance_sol?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          label?: string | null
          last_activity?: string | null
          operator_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          wallet_address?: string
          wallet_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "solana_wallets_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
      stat_contests: {
        Row: {
          category: string
          created_at: string
          description: string | null
          ends_at: string
          id: string
          max_participants: number | null
          metric: string
          name: string
          participant_count: number
          prize_description: string | null
          prize_type: string
          prize_value_usd: number
          starts_at: string
          status: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          ends_at: string
          id?: string
          max_participants?: number | null
          metric: string
          name: string
          participant_count?: number
          prize_description?: string | null
          prize_type?: string
          prize_value_usd?: number
          starts_at: string
          status?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          ends_at?: string
          id?: string
          max_participants?: number | null
          metric?: string
          name?: string
          participant_count?: number
          prize_description?: string | null
          prize_type?: string
          prize_value_usd?: number
          starts_at?: string
          status?: string
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
          {
            foreignKeyName: "fk_strategy"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
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
          {
            foreignKeyName: "strategy_rentals_strategy_id_fkey"
            columns: ["strategy_id"]
            isOneToOne: false
            referencedRelation: "ai_strategies_public"
            referencedColumns: ["id"]
          },
        ]
      }
      suggestion_votes: {
        Row: {
          created_at: string | null
          id: string
          suggestion_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          suggestion_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          suggestion_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suggestion_votes_suggestion_id_fkey"
            columns: ["suggestion_id"]
            isOneToOne: false
            referencedRelation: "marketplace_suggestions"
            referencedColumns: ["id"]
          },
        ]
      }
      supported_chains: {
        Row: {
          chain_type: string
          created_at: string | null
          explorer_url: string | null
          features: Json | null
          id: string
          is_active: boolean | null
          is_evm_compatible: boolean | null
          logo_url: string | null
          name: string
          native_token_coingecko_id: string | null
          rpc_url: string | null
          symbol: string
        }
        Insert: {
          chain_type: string
          created_at?: string | null
          explorer_url?: string | null
          features?: Json | null
          id: string
          is_active?: boolean | null
          is_evm_compatible?: boolean | null
          logo_url?: string | null
          name: string
          native_token_coingecko_id?: string | null
          rpc_url?: string | null
          symbol: string
        }
        Update: {
          chain_type?: string
          created_at?: string | null
          explorer_url?: string | null
          features?: Json | null
          id?: string
          is_active?: boolean | null
          is_evm_compatible?: boolean | null
          logo_url?: string | null
          name?: string
          native_token_coingecko_id?: string | null
          rpc_url?: string | null
          symbol?: string
        }
        Relationships: []
      }
      supported_exchanges: {
        Row: {
          api_url: string | null
          created_at: string | null
          exchange_type: string
          features: Json | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          requires_api_key: boolean | null
          supported_chains: string[] | null
          trading_pairs_count: number | null
          websocket_url: string | null
        }
        Insert: {
          api_url?: string | null
          created_at?: string | null
          exchange_type: string
          features?: Json | null
          id: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          requires_api_key?: boolean | null
          supported_chains?: string[] | null
          trading_pairs_count?: number | null
          websocket_url?: string | null
        }
        Update: {
          api_url?: string | null
          created_at?: string | null
          exchange_type?: string
          features?: Json | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          requires_api_key?: boolean | null
          supported_chains?: string[] | null
          trading_pairs_count?: number | null
          websocket_url?: string | null
        }
        Relationships: []
      }
      swarm_agents: {
        Row: {
          accuracy_7d: number
          confidence: number
          created_at: string
          domain: string
          generation: number
          icon_name: string
          id: string
          last_signal: string | null
          name: string
          signals_today: number
          status: string
          streak: number
          updated_at: string
          vote: string
        }
        Insert: {
          accuracy_7d?: number
          confidence?: number
          created_at?: string
          domain: string
          generation?: number
          icon_name?: string
          id: string
          last_signal?: string | null
          name: string
          signals_today?: number
          status?: string
          streak?: number
          updated_at?: string
          vote?: string
        }
        Update: {
          accuracy_7d?: number
          confidence?: number
          created_at?: string
          domain?: string
          generation?: number
          icon_name?: string
          id?: string
          last_signal?: string | null
          name?: string
          signals_today?: number
          status?: string
          streak?: number
          updated_at?: string
          vote?: string
        }
        Relationships: []
      }
      token_airdrops: {
        Row: {
          amount_per_user: number
          claimed_count: number | null
          created_at: string
          created_by: string | null
          distribution_type: string
          eligibility_criteria: Json | null
          end_date: string | null
          id: string
          max_recipients: number | null
          name: string
          recipient_list: string[] | null
          start_date: string
          status: string | null
          token_id: string | null
          total_amount: number
        }
        Insert: {
          amount_per_user: number
          claimed_count?: number | null
          created_at?: string
          created_by?: string | null
          distribution_type: string
          eligibility_criteria?: Json | null
          end_date?: string | null
          id?: string
          max_recipients?: number | null
          name: string
          recipient_list?: string[] | null
          start_date: string
          status?: string | null
          token_id?: string | null
          total_amount: number
        }
        Update: {
          amount_per_user?: number
          claimed_count?: number | null
          created_at?: string
          created_by?: string | null
          distribution_type?: string
          eligibility_criteria?: Json | null
          end_date?: string | null
          id?: string
          max_recipients?: number | null
          name?: string
          recipient_list?: string[] | null
          start_date?: string
          status?: string | null
          token_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "token_airdrops_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_balances: {
        Row: {
          balance: number
          created_at: string | null
          id: string
          last_mined_at: string | null
          locked_balance: number
          token_id: string
          total_mined: number
          total_received: number
          total_sent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string | null
          id?: string
          last_mined_at?: string | null
          locked_balance?: number
          token_id: string
          total_mined?: number
          total_received?: number
          total_sent?: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string | null
          id?: string
          last_mined_at?: string | null
          locked_balance?: number
          token_id?: string
          total_mined?: number
          total_received?: number
          total_sent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_balances_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_burns: {
        Row: {
          amount_burned: number
          burn_reason: string
          created_at: string | null
          fee_discount_applied: number | null
          id: string
          token_symbol: string
          usd_value_at_burn: number | null
          user_id: string
        }
        Insert: {
          amount_burned: number
          burn_reason?: string
          created_at?: string | null
          fee_discount_applied?: number | null
          id?: string
          token_symbol: string
          usd_value_at_burn?: number | null
          user_id: string
        }
        Update: {
          amount_burned?: number
          burn_reason?: string
          created_at?: string | null
          fee_discount_applied?: number | null
          id?: string
          token_symbol?: string
          usd_value_at_burn?: number | null
          user_id?: string
        }
        Relationships: []
      }
      token_contests: {
        Row: {
          contest_type: string
          created_at: string
          created_by: string | null
          description: string | null
          end_date: string
          id: string
          max_participants: number | null
          prize_distribution: Json
          prize_pool: number
          rules: Json | null
          start_date: string
          status: string | null
          title: string
          token_id: string | null
          updated_at: string
        }
        Insert: {
          contest_type: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date: string
          id?: string
          max_participants?: number | null
          prize_distribution: Json
          prize_pool: number
          rules?: Json | null
          start_date: string
          status?: string | null
          title: string
          token_id?: string | null
          updated_at?: string
        }
        Update: {
          contest_type?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_date?: string
          id?: string
          max_participants?: number | null
          prize_distribution?: Json
          prize_pool?: number
          rules?: Json | null
          start_date?: string
          status?: string | null
          title?: string
          token_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_contests_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_price_feeds: {
        Row: {
          base_currency: string
          change_24h_percent: number | null
          high_24h: number | null
          id: string
          last_updated: string
          low_24h: number | null
          market_cap: number | null
          price: number
          price_24h_ago: number | null
          source: string | null
          token_id: string | null
          volume_24h: number | null
        }
        Insert: {
          base_currency: string
          change_24h_percent?: number | null
          high_24h?: number | null
          id?: string
          last_updated?: string
          low_24h?: number | null
          market_cap?: number | null
          price: number
          price_24h_ago?: number | null
          source?: string | null
          token_id?: string | null
          volume_24h?: number | null
        }
        Update: {
          base_currency?: string
          change_24h_percent?: number | null
          high_24h?: number | null
          id?: string
          last_updated?: string
          low_24h?: number | null
          market_cap?: number | null
          price?: number
          price_24h_ago?: number | null
          source?: string | null
          token_id?: string | null
          volume_24h?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_price_feeds_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      token_price_history: {
        Row: {
          close_price: number
          created_at: string
          high_price: number
          id: string
          interval_start: string
          interval_type: string
          low_price: number
          open_price: number
          pair_id: string | null
          trades_count: number | null
          volume: number | null
        }
        Insert: {
          close_price: number
          created_at?: string
          high_price: number
          id?: string
          interval_start: string
          interval_type: string
          low_price: number
          open_price: number
          pair_id?: string | null
          trades_count?: number | null
          volume?: number | null
        }
        Update: {
          close_price?: number
          created_at?: string
          high_price?: number
          id?: string
          interval_start?: string
          interval_type?: string
          low_price?: number
          open_price?: number
          pair_id?: string | null
          trades_count?: number | null
          volume?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "token_price_history_pair_id_fkey"
            columns: ["pair_id"]
            isOneToOne: false
            referencedRelation: "exchange_pairs"
            referencedColumns: ["id"]
          },
        ]
      }
      token_revenue: {
        Row: {
          created_at: string
          distributed_at: string | null
          distribution_status: string | null
          gross_amount: number
          id: string
          metadata: Json | null
          platform_share: number
          source_type: string
          token_id: string | null
        }
        Insert: {
          created_at?: string
          distributed_at?: string | null
          distribution_status?: string | null
          gross_amount: number
          id?: string
          metadata?: Json | null
          platform_share: number
          source_type: string
          token_id?: string | null
        }
        Update: {
          created_at?: string
          distributed_at?: string | null
          distribution_status?: string | null
          gross_amount?: number
          id?: string
          metadata?: Json | null
          platform_share?: number
          source_type?: string
          token_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "token_revenue_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      trade_logs: {
        Row: {
          action: string
          created_at: string
          error_message: string | null
          exchange_account_id: string | null
          exchange_order_id: string | null
          id: string
          price: number | null
          quantity: number | null
          side: string | null
          status: string
          symbol: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          error_message?: string | null
          exchange_account_id?: string | null
          exchange_order_id?: string | null
          id?: string
          price?: number | null
          quantity?: number | null
          side?: string | null
          status: string
          symbol?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          error_message?: string | null
          exchange_account_id?: string | null
          exchange_order_id?: string | null
          id?: string
          price?: number | null
          quantity?: number | null
          side?: string | null
          status?: string
          symbol?: string | null
          user_id?: string
        }
        Relationships: []
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
      trading_bots: {
        Row: {
          created_at: string | null
          id: string
          is_dry_run: boolean | null
          last_trade_at: string | null
          name: string
          pair: string
          profit: number | null
          status: string
          strategy: string
          timeframe: string
          trades: number | null
          updated_at: string | null
          user_id: string
          win_rate: number | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_dry_run?: boolean | null
          last_trade_at?: string | null
          name: string
          pair?: string
          profit?: number | null
          status?: string
          strategy: string
          timeframe?: string
          trades?: number | null
          updated_at?: string | null
          user_id: string
          win_rate?: number | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_dry_run?: boolean | null
          last_trade_at?: string | null
          name?: string
          pair?: string
          profit?: number | null
          status?: string
          strategy?: string
          timeframe?: string
          trades?: number | null
          updated_at?: string | null
          user_id?: string
          win_rate?: number | null
        }
        Relationships: []
      }
      traditional_assets: {
        Row: {
          asset_class: string
          beta: number | null
          country: string | null
          created_at: string | null
          currency: string | null
          dividend_yield: number | null
          eps: number | null
          exchange: string | null
          high_24h: number | null
          industry: string | null
          is_active: boolean | null
          last_updated: string | null
          low_24h: number | null
          market_cap: number | null
          name: string
          open_price: number | null
          pe_ratio: number | null
          previous_close: number | null
          price_change_24h: number | null
          price_change_percentage_24h: number | null
          price_usd: number | null
          sector: string | null
          symbol: string
          volume: number | null
          week_52_high: number | null
          week_52_low: number | null
        }
        Insert: {
          asset_class?: string
          beta?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dividend_yield?: number | null
          eps?: number | null
          exchange?: string | null
          high_24h?: number | null
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          name: string
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          price_usd?: number | null
          sector?: string | null
          symbol: string
          volume?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
        }
        Update: {
          asset_class?: string
          beta?: number | null
          country?: string | null
          created_at?: string | null
          currency?: string | null
          dividend_yield?: number | null
          eps?: number | null
          exchange?: string | null
          high_24h?: number | null
          industry?: string | null
          is_active?: boolean | null
          last_updated?: string | null
          low_24h?: number | null
          market_cap?: number | null
          name?: string
          open_price?: number | null
          pe_ratio?: number | null
          previous_close?: number | null
          price_change_24h?: number | null
          price_change_percentage_24h?: number | null
          price_usd?: number | null
          sector?: string | null
          symbol?: string
          volume?: number | null
          week_52_high?: number | null
          week_52_low?: number | null
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
      user_badges: {
        Row: {
          badge_icon: string | null
          badge_name: string
          badge_type: string
          description: string | null
          earned_at: string | null
          id: string
          points: number | null
          user_id: string
        }
        Insert: {
          badge_icon?: string | null
          badge_name: string
          badge_type: string
          description?: string | null
          earned_at?: string | null
          id?: string
          points?: number | null
          user_id: string
        }
        Update: {
          badge_icon?: string | null
          badge_name?: string
          badge_type?: string
          description?: string | null
          earned_at?: string | null
          id?: string
          points?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_course_progress: {
        Row: {
          completed_at: string | null
          course_id: string
          id: string
          last_accessed_at: string
          lessons_completed: number
          started_at: string
          total_time_seconds: number
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          course_id: string
          id?: string
          last_accessed_at?: string
          lessons_completed?: number
          started_at?: string
          total_time_seconds?: number
          user_id: string
        }
        Update: {
          completed_at?: string | null
          course_id?: string
          id?: string
          last_accessed_at?: string
          lessons_completed?: number
          started_at?: string
          total_time_seconds?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_course_progress_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "education_courses"
            referencedColumns: ["id"]
          },
        ]
      }
      user_nfts: {
        Row: {
          ai_generated: boolean | null
          ai_prompt: string | null
          attributes: Json | null
          chain: string
          created_at: string | null
          currency: string | null
          description: string | null
          id: string
          image_url: string | null
          list_price: number | null
          mint_status: string | null
          name: string
          royalty_percent: number | null
          supply: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          attributes?: Json | null
          chain?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          mint_status?: string | null
          name: string
          royalty_percent?: number | null
          supply?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_prompt?: string | null
          attributes?: Json | null
          chain?: string
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          list_price?: number | null
          mint_status?: string | null
          name?: string
          royalty_percent?: number | null
          supply?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_notifications: {
        Row: {
          asset: string | null
          change_percent: number | null
          created_at: string
          id: string
          is_live: boolean | null
          is_read: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string
          value: string | null
        }
        Insert: {
          asset?: string | null
          change_percent?: number | null
          created_at?: string
          id?: string
          is_live?: boolean | null
          is_read?: boolean | null
          message: string
          notification_type: string
          title: string
          user_id: string
          value?: string | null
        }
        Update: {
          asset?: string | null
          change_percent?: number | null
          created_at?: string
          id?: string
          is_live?: boolean | null
          is_read?: boolean | null
          message?: string
          notification_type?: string
          title?: string
          user_id?: string
          value?: string | null
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
      user_service_connections: {
        Row: {
          api_key_hash: string | null
          connected_at: string | null
          connection_status: string | null
          created_at: string | null
          external_account_id: string | null
          id: string
          last_sync_at: string | null
          metadata: Json | null
          service_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          api_key_hash?: string | null
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          service_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          api_key_hash?: string | null
          connected_at?: string | null
          connection_status?: string | null
          created_at?: string | null
          external_account_id?: string | null
          id?: string
          last_sync_at?: string | null
          metadata?: Json | null
          service_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_service_connections_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "satellite_services"
            referencedColumns: ["id"]
          },
        ]
      }
      user_stats: {
        Row: {
          achievements_earned: number
          ai_queries: number
          avg_sharpe: number
          avg_trade_size: number
          backtests_run: number
          best_trade_pnl: number
          computed_at: string
          created_at: string
          id: string
          login_streak: number
          longest_streak: number
          losing_trades: number
          overall_rank: number | null
          period_end: string
          period_start: string
          period_type: string
          polls_voted: number
          posts_created: number
          prediction_accuracy: number
          predictions_made: number
          qtc_mined: number
          qtc_staked: number
          referrals_made: number
          referrals_verified: number
          signals_followed: number
          social_rank: number | null
          strategies_created: number
          strategies_graduated: number
          total_logins: number
          total_pnl: number
          total_points: number
          total_trades: number
          trading_rank: number | null
          user_id: string
          win_rate: number
          winning_trades: number
          worst_trade_pnl: number
        }
        Insert: {
          achievements_earned?: number
          ai_queries?: number
          avg_sharpe?: number
          avg_trade_size?: number
          backtests_run?: number
          best_trade_pnl?: number
          computed_at?: string
          created_at?: string
          id?: string
          login_streak?: number
          longest_streak?: number
          losing_trades?: number
          overall_rank?: number | null
          period_end: string
          period_start: string
          period_type: string
          polls_voted?: number
          posts_created?: number
          prediction_accuracy?: number
          predictions_made?: number
          qtc_mined?: number
          qtc_staked?: number
          referrals_made?: number
          referrals_verified?: number
          signals_followed?: number
          social_rank?: number | null
          strategies_created?: number
          strategies_graduated?: number
          total_logins?: number
          total_pnl?: number
          total_points?: number
          total_trades?: number
          trading_rank?: number | null
          user_id: string
          win_rate?: number
          winning_trades?: number
          worst_trade_pnl?: number
        }
        Update: {
          achievements_earned?: number
          ai_queries?: number
          avg_sharpe?: number
          avg_trade_size?: number
          backtests_run?: number
          best_trade_pnl?: number
          computed_at?: string
          created_at?: string
          id?: string
          login_streak?: number
          longest_streak?: number
          losing_trades?: number
          overall_rank?: number | null
          period_end?: string
          period_start?: string
          period_type?: string
          polls_voted?: number
          posts_created?: number
          prediction_accuracy?: number
          predictions_made?: number
          qtc_mined?: number
          qtc_staked?: number
          referrals_made?: number
          referrals_verified?: number
          signals_followed?: number
          social_rank?: number | null
          strategies_created?: number
          strategies_graduated?: number
          total_logins?: number
          total_pnl?: number
          total_points?: number
          total_trades?: number
          trading_rank?: number | null
          user_id?: string
          win_rate?: number
          winning_trades?: number
          worst_trade_pnl?: number
        }
        Relationships: []
      }
      wallet_key_vault: {
        Row: {
          created_at: string | null
          encrypted_key_data: string
          id: string
          key_derivation_salt: string | null
          wallet_id: string
          wallet_source: string
        }
        Insert: {
          created_at?: string | null
          encrypted_key_data: string
          id?: string
          key_derivation_salt?: string | null
          wallet_id: string
          wallet_source: string
        }
        Update: {
          created_at?: string | null
          encrypted_key_data?: string
          id?: string
          key_derivation_salt?: string | null
          wallet_id?: string
          wallet_source?: string
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
      ai_strategies_public: {
        Row: {
          admin_approved: boolean | null
          backtest_count: number | null
          code_protected: boolean | null
          consistency_score: number | null
          created_at: string | null
          creator_profit_share: number | null
          description: string | null
          entry_rules: Json | null
          exit_rules: Json | null
          factors: string[] | null
          graduation_date: string | null
          id: string | null
          is_available_for_rent: boolean | null
          is_graduated: boolean | null
          name: string | null
          profitability_score: number | null
          rental_price_monthly: number | null
          risk_parameters: Json | null
          status: Database["public"]["Enums"]["strategy_status"] | null
          total_rentals: number | null
          updated_at: string | null
        }
        Insert: {
          admin_approved?: boolean | null
          backtest_count?: number | null
          code_protected?: boolean | null
          consistency_score?: number | null
          created_at?: string | null
          creator_profit_share?: number | null
          description?: string | null
          entry_rules?: Json | null
          exit_rules?: Json | null
          factors?: string[] | null
          graduation_date?: string | null
          id?: string | null
          is_available_for_rent?: boolean | null
          is_graduated?: boolean | null
          name?: string | null
          profitability_score?: number | null
          rental_price_monthly?: number | null
          risk_parameters?: Json | null
          status?: Database["public"]["Enums"]["strategy_status"] | null
          total_rentals?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_approved?: boolean | null
          backtest_count?: number | null
          code_protected?: boolean | null
          consistency_score?: number | null
          created_at?: string | null
          creator_profit_share?: number | null
          description?: string | null
          entry_rules?: Json | null
          exit_rules?: Json | null
          factors?: string[] | null
          graduation_date?: string | null
          id?: string | null
          is_available_for_rent?: boolean | null
          is_graduated?: boolean | null
          name?: string | null
          profitability_score?: number | null
          rental_price_monthly?: number | null
          risk_parameters?: Json | null
          status?: Database["public"]["Enums"]["strategy_status"] | null
          total_rentals?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      automation_templates_safe: {
        Row: {
          action_config: Json | null
          action_type: string | null
          category: string | null
          created_at: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          is_system: boolean | null
          last_run_at: string | null
          name: string | null
          run_count: number | null
          schedule: string | null
          subcategory: string | null
          trigger_config: Json | null
          trigger_type: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          action_config?: Json | null
          action_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          last_run_at?: string | null
          name?: string | null
          run_count?: number | null
          schedule?: string | null
          subcategory?: string | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          action_config?: Json | null
          action_type?: string | null
          category?: string | null
          created_at?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          is_system?: boolean | null
          last_run_at?: string | null
          name?: string | null
          run_count?: number | null
          schedule?: string | null
          subcategory?: string | null
          trigger_config?: Json | null
          trigger_type?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      connected_accounts_safe: {
        Row: {
          account_name: string | null
          account_type: string | null
          balance: number | null
          change_24h: number | null
          created_at: string | null
          id: string | null
          last_sync_at: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          change_24h?: number | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          account_name?: string | null
          account_type?: string | null
          balance?: number | null
          change_24h?: number | null
          created_at?: string | null
          id?: string | null
          last_sync_at?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      data_aggregator_bots_public: {
        Row: {
          bot_type: string | null
          created_at: string | null
          data_category: string | null
          description: string | null
          id: string | null
          is_active: boolean | null
          name: string | null
          quality_score: number | null
          reliability_score: number | null
          total_records_collected: number | null
          updated_at: string | null
        }
        Insert: {
          bot_type?: string | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          total_records_collected?: number | null
          updated_at?: string | null
        }
        Update: {
          bot_type?: string | null
          created_at?: string | null
          data_category?: string | null
          description?: string | null
          id?: string | null
          is_active?: boolean | null
          name?: string | null
          quality_score?: number | null
          reliability_score?: number | null
          total_records_collected?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      faucet_claims_safe: {
        Row: {
          amount: number | null
          chain: string | null
          created_at: string | null
          id: string | null
          status: string | null
          token_id: string | null
          tx_hash: string | null
          user_id: string | null
          wallet_address: string | null
        }
        Insert: {
          amount?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Update: {
          amount?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string | null
          status?: string | null
          token_id?: string | null
          tx_hash?: string | null
          user_id?: string | null
          wallet_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faucet_claims_token_id_fkey"
            columns: ["token_id"]
            isOneToOne: false
            referencedRelation: "platform_tokens"
            referencedColumns: ["id"]
          },
        ]
      }
      faucet_leaderboard: {
        Row: {
          active_days: number | null
          display_name: string | null
          total_claims: number | null
          user_id: string | null
        }
        Relationships: []
      }
      quwallet_wallets_safe: {
        Row: {
          created_at: string | null
          dilithium_public_key: string | null
          ecdsa_public_key: string | null
          hardware_type: string | null
          id: string | null
          is_active: boolean | null
          is_admin_controlled: boolean | null
          is_hardware: boolean | null
          kyber_public_key: string | null
          multi_sig_config: Json | null
          updated_at: string | null
          user_id: string | null
          wallet_address: string | null
          wallet_name: string | null
          wallet_type: string | null
        }
        Insert: {
          created_at?: string | null
          dilithium_public_key?: string | null
          ecdsa_public_key?: string | null
          hardware_type?: string | null
          id?: string | null
          is_active?: boolean | null
          is_admin_controlled?: boolean | null
          is_hardware?: boolean | null
          kyber_public_key?: string | null
          multi_sig_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_name?: string | null
          wallet_type?: string | null
        }
        Update: {
          created_at?: string | null
          dilithium_public_key?: string | null
          ecdsa_public_key?: string | null
          hardware_type?: string | null
          id?: string | null
          is_active?: boolean | null
          is_admin_controlled?: boolean | null
          is_hardware?: boolean | null
          kyber_public_key?: string | null
          multi_sig_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
          wallet_address?: string | null
          wallet_name?: string | null
          wallet_type?: string | null
        }
        Relationships: []
      }
      saved_payment_methods_safe: {
        Row: {
          bank_name: string | null
          card_brand: string | null
          created_at: string | null
          exp_month: number | null
          exp_year: number | null
          id: string | null
          is_default: boolean | null
          last_four: string | null
          metadata: Json | null
          method_type: string | null
          nickname: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          bank_name?: string | null
          card_brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string | null
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          method_type?: string | null
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          bank_name?: string | null
          card_brand?: string | null
          created_at?: string | null
          exp_month?: number | null
          exp_year?: number | null
          id?: string | null
          is_default?: boolean | null
          last_four?: string | null
          metadata?: Json | null
          method_type?: string | null
          nickname?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      solana_wallets_safe: {
        Row: {
          balance_sol: number | null
          chain: string | null
          created_at: string | null
          id: string | null
          is_active: boolean | null
          label: string | null
          last_activity: string | null
          operator_id: string | null
          owner_user_id: string | null
          updated_at: string | null
          wallet_address: string | null
          wallet_type: string | null
        }
        Insert: {
          balance_sol?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          last_activity?: string | null
          operator_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Update: {
          balance_sol?: number | null
          chain?: string | null
          created_at?: string | null
          id?: string | null
          is_active?: boolean | null
          label?: string | null
          last_activity?: string | null
          operator_id?: string | null
          owner_user_id?: string | null
          updated_at?: string | null
          wallet_address?: string | null
          wallet_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "solana_wallets_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_operator_with_wallet: {
        Args: {
          p_currencies?: string[]
          p_is_admin_owned?: boolean
          p_name: string
          p_operator_type: string
          p_owner_user_id?: string
          p_territory_id: string
        }
        Returns: string
      }
      credit_faucet_claim: {
        Args: {
          p_amount: number
          p_chain: string
          p_symbol: string
          p_user_id: string
        }
        Returns: undefined
      }
      get_factor_code: {
        Args: { p_factor_id: string }
        Returns: {
          code: string
          is_owner: boolean
          is_protected: boolean
        }[]
      }
      get_strategy_code: {
        Args: { p_strategy_id: string }
        Returns: {
          code: string
          is_owner: boolean
          is_protected: boolean
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_wallet_balance: {
        Args: { p_amount: number; p_currency: string }
        Returns: undefined
      }
      log_security_event: {
        Args: { p_details?: Json; p_event_type: string; p_severity?: string }
        Returns: string
      }
      process_profit_distribution: {
        Args: { p_revenue_id: string }
        Returns: undefined
      }
      record_operator_transaction: {
        Args: {
          p_amount: number
          p_currency: string
          p_description?: string
          p_from_operator_id: string
          p_reference_id?: string
          p_reference_type?: string
          p_to_operator_id: string
          p_transaction_type: string
        }
        Returns: string
      }
      update_market_price: {
        Args: {
          p_change_24h?: number
          p_change_7d?: number
          p_coin_id: string
          p_high_24h?: number
          p_low_24h?: number
          p_market_cap?: number
          p_price_btc?: number
          p_price_eth?: number
          p_price_usd: number
          p_volume?: number
        }
        Returns: undefined
      }
      update_paper_portfolio: {
        Args: {
          p_amount_change: number
          p_price: number
          p_symbol: string
          p_user_id: string
        }
        Returns: undefined
      }
      update_token_price: {
        Args: {
          p_base_currency: string
          p_new_price: number
          p_token_id: string
        }
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
