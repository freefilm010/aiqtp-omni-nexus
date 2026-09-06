CREATE SCHEMA IF NOT EXISTS private;

CREATE OR REPLACE FUNCTION private.request_withdrawal(p_caller uuid, p_amount_usd numeric, p_destination_type text, p_destination_details jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_balance numeric;
  v_id uuid;
BEGIN
  IF p_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  IF p_amount_usd IS NULL OR p_amount_usd < 20 THEN
    RAISE EXCEPTION 'Minimum withdrawal is $20';
  END IF;

  SELECT quantity INTO v_balance
  FROM public.portfolio_holdings
  WHERE user_id = p_caller AND symbol = 'USD'
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < p_amount_usd THEN
    RAISE EXCEPTION 'Insufficient USD balance (have %, need %)', COALESCE(v_balance,0), p_amount_usd;
  END IF;

  UPDATE public.portfolio_holdings
  SET quantity = quantity - p_amount_usd,
      value_usd = quantity - p_amount_usd,
      updated_at = now()
  WHERE user_id = p_caller AND symbol = 'USD';

  INSERT INTO public.withdrawal_requests
    (user_id, amount_usd, destination_type, destination_details, status)
  VALUES (p_caller, p_amount_usd, p_destination_type, p_destination_details, 'pending')
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$function$;

REVOKE ALL ON FUNCTION private.request_withdrawal(uuid, numeric, text, jsonb) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION private.review_withdrawal(p_caller uuid, p_withdrawal_id uuid, p_action text, p_notes text DEFAULT NULL)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_row public.withdrawal_requests%ROWTYPE;
  v_new_status text;
BEGIN
  IF p_caller IS NULL OR NOT public.has_role(p_caller, 'admin') THEN
    RAISE EXCEPTION 'Admin privileges required';
  END IF;
  IF p_action NOT IN ('approve', 'reject', 'mark_paid') THEN
    RAISE EXCEPTION 'Invalid action';
  END IF;

  SELECT * INTO v_row FROM public.withdrawal_requests WHERE id = p_withdrawal_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Withdrawal not found';
  END IF;

  IF p_action = 'mark_paid' THEN
    IF v_row.status <> 'approved' THEN
      RAISE EXCEPTION 'Only approved withdrawals can be marked paid';
    END IF;
    v_new_status := 'paid';
  ELSE
    IF v_row.status <> 'pending' THEN
      RAISE EXCEPTION 'Withdrawal is not pending';
    END IF;
    v_new_status := CASE WHEN p_action = 'approve' THEN 'approved' ELSE 'rejected' END;
  END IF;

  IF v_new_status = 'rejected' THEN
    UPDATE public.portfolio_holdings
    SET quantity = quantity + v_row.amount_usd,
        value_usd = quantity + v_row.amount_usd,
        updated_at = now()
    WHERE user_id = v_row.user_id AND symbol = 'USD';

    IF NOT FOUND THEN
      INSERT INTO public.portfolio_holdings (user_id, symbol, quantity, value_usd)
      VALUES (v_row.user_id, 'USD', v_row.amount_usd, v_row.amount_usd);
    END IF;
  END IF;

  UPDATE public.withdrawal_requests
  SET status = v_new_status,
      admin_notes = COALESCE(p_notes, admin_notes),
      reviewed_by = p_caller,
      reviewed_at = now(),
      updated_at = now()
  WHERE id = p_withdrawal_id;

  RETURN v_new_status;
END;
$function$;

REVOKE ALL ON FUNCTION private.review_withdrawal(uuid, uuid, text, text) FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION public.review_withdrawal(p_withdrawal_id uuid, p_action text, p_notes text DEFAULT NULL)
RETURNS text
LANGUAGE sql
SET search_path TO 'public'
AS $function$
  SELECT private.review_withdrawal(auth.uid(), p_withdrawal_id, p_action, p_notes);
$function$;

GRANT EXECUTE ON FUNCTION public.review_withdrawal(uuid, text, text) TO authenticated, service_role;

DROP POLICY IF EXISTS "Admins can view all withdrawal requests" ON public.withdrawal_requests;
CREATE POLICY "Admins can view all withdrawal requests"
ON public.withdrawal_requests FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin'));