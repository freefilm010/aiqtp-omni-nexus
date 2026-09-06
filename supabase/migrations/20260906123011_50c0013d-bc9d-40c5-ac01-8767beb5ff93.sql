CREATE OR REPLACE FUNCTION public.train_strategies_market_replay(
  p_limit int DEFAULT 50,
  p_cycles int DEFAULT 20,
  p_symbol text DEFAULT 'BTCUSDT'
) RETURNS TABLE(trained int, graduated int)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  hi numeric[]; lo numeric[]; cl numeric[];
  n int; s record; cy int; st int; i int; j int;
  sl numeric; tp numeric; pos numeric;
  entry numeric; exitp numeric; exitidx int;
  cap numeric; peak numeric; dd numeric; ret numeric;
  wins int; trades int; rsum numeric; rsq numeric;
  win_rate numeric; profit numeric; sharpe numeric; consistency numeric;
  seg int; segwin int;
  c_profit numeric := 0; c_cons numeric := 0; c_wr numeric := 0; c_dd numeric := 0; c_sh numeric := 0;
  passed int; v_trained int := 0; v_grad int := 0; grad boolean;
  win_len constant int := 168;
BEGIN
  SELECT array_agg(high ORDER BY open_time), array_agg(low ORDER BY open_time), array_agg(close ORDER BY open_time)
    INTO hi, lo, cl
  FROM public.market_ohlcv_cache WHERE symbol = p_symbol AND timeframe = '1h';

  n := coalesce(array_length(cl, 1), 0);
  IF n < win_len + 10 THEN
    RAISE EXCEPTION 'Insufficient real market data for % (% candles)', p_symbol, n;
  END IF;

  FOR s IN
    SELECT id, user_id, exit_rules, risk_parameters
    FROM public.ai_strategies
    WHERE coalesce(is_graduated, false) = false
    ORDER BY created_at
    LIMIT p_limit
  LOOP
    sl  := greatest(0.2, coalesce(substring(s.exit_rules->>'stop_loss'   from '[0-9]+(\.[0-9]+)?')::numeric, 2)) / 100;
    tp  := greatest(0.2, coalesce(substring(s.exit_rules->>'take_profit' from '[0-9]+(\.[0-9]+)?')::numeric, 5)) / 100;
    pos := greatest(1,   coalesce(substring(s.risk_parameters->>'max_position_size' from '[0-9]+(\.[0-9]+)?')::numeric, 5)) / 100;

    c_profit := 0; c_cons := 0; c_wr := 0; c_dd := 0; c_sh := 0; passed := 0;

    FOR cy IN 0 .. p_cycles - 1 LOOP
      st := (abs(hashtext(s.id::text || ':' || cy)) % (n - win_len - 1)) + 1;
      cap := 10000; peak := 10000; dd := 0; wins := 0; trades := 0; rsum := 0; rsq := 0;
      i := st;
      WHILE i < st + win_len - 1 LOOP
        entry := cl[i];
        exitp := cl[st + win_len - 1];
        exitidx := st + win_len - 1;
        j := i + 1;
        WHILE j <= st + win_len - 1 LOOP
          IF lo[j] <= entry * (1 - sl) THEN exitp := entry * (1 - sl); exitidx := j; EXIT; END IF;
          IF hi[j] >= entry * (1 + tp) THEN exitp := entry * (1 + tp); exitidx := j; EXIT; END IF;
          j := j + 1;
        END LOOP;
        ret := (exitp - entry) / entry;
        cap := cap + (cap * pos * ret);
        trades := trades + 1;
        rsum := rsum + ret; rsq := rsq + ret * ret;
        IF ret > 0 THEN wins := wins + 1; END IF;
        peak := greatest(peak, cap);
        dd := greatest(dd, ((peak - cap) / peak) * 100);
        i := exitidx + 1;
      END LOOP;

      win_rate := CASE WHEN trades > 0 THEN (wins::numeric / trades) * 100 ELSE 0 END;
      profit := ((cap - 10000) / 10000) * 100;
      sharpe := CASE
        WHEN trades > 1 AND (rsq / trades - (rsum / trades) ^ 2) > 0
        THEN ((rsum / trades) / sqrt(rsq / trades - (rsum / trades) ^ 2)) * sqrt(trades)
        ELSE 0 END;

      seg := 0; segwin := 0;
      j := st;
      WHILE j + 24 < st + win_len LOOP
        seg := seg + 1;
        IF cl[j + 24] > cl[j] THEN segwin := segwin + 1; END IF;
        j := j + 24;
      END LOOP;
      consistency := greatest(0, least(100,
        50 + (win_rate - 50) * 0.6 + (CASE WHEN seg > 0 THEN (segwin::numeric / seg) * 100 ELSE 50 END - 50) * 0.4));

      IF profit >= 1.0 AND win_rate >= 60 AND dd <= 18 AND consistency >= 60 THEN
        passed := passed + 1;
      END IF;

      c_profit := c_profit + profit; c_cons := c_cons + consistency;
      c_wr := c_wr + win_rate; c_dd := c_dd + dd; c_sh := c_sh + sharpe;

      INSERT INTO public.graduation_tests
        (strategy_id, user_id, test_number, profitability, win_rate, sharpe_ratio, max_drawdown, consistency_score, passed, test_data)
      VALUES (s.id, s.user_id, cy + 1, round(profit, 4), round(win_rate, 2), round(sharpe, 4), round(dd, 2), round(consistency, 2),
        profit >= 1.0 AND win_rate >= 60 AND dd <= 18 AND consistency >= 60,
        jsonb_build_object('cycle_type', 'market_replay', 'market_symbol', p_symbol,
                           'source', 'binance_klines_1h', 'trades', trades, 'final_capital', round(cap, 2)));
    END LOOP;

    grad := (passed::numeric / p_cycles) * 100 >= 60;

    UPDATE public.ai_strategies SET
      profitability_score = round(c_profit / p_cycles, 4),
      consistency_score   = round(c_cons / p_cycles, 2),
      backtest_count      = coalesce(backtest_count, 0) + p_cycles,
      status              = CASE WHEN grad THEN 'paper_trading'::strategy_status ELSE 'backtesting'::strategy_status END,
      is_graduated        = grad,
      graduation_date     = CASE WHEN grad THEN now() ELSE graduation_date END,
      is_available_for_rent = CASE WHEN grad THEN true ELSE is_available_for_rent END,
      rental_price_monthly  = CASE WHEN grad
        THEN round(29 + greatest(0, c_profit / p_cycles) * 5 + ((passed::numeric / p_cycles) * 100) * 0.3)
        ELSE rental_price_monthly END,
      updated_at = now()
    WHERE id = s.id;

    v_trained := v_trained + 1;
    IF grad THEN v_grad := v_grad + 1; END IF;
  END LOOP;

  RETURN QUERY SELECT v_trained, v_grad;
END $$;

REVOKE ALL ON FUNCTION public.train_strategies_market_replay(int, int, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.train_strategies_market_replay(int, int, text) TO service_role;
