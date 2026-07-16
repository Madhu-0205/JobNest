-- Migration: Create atomic wallet adjustment function to prevent race conditions and lost updates.

CREATE OR REPLACE FUNCTION public.adjust_wallet_balance(
    p_user_id UUID,
    p_amount NUMERIC,
    p_locked_amount NUMERIC DEFAULT 0.00
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance NUMERIC,
    new_locked NUMERIC
) AS $$
DECLARE
    v_wallet_id UUID;
    v_balance NUMERIC;
    v_locked NUMERIC;
BEGIN
    -- Row-level locking to prevent concurrency race conditions
    SELECT id, balance, locked_balance 
    INTO v_wallet_id, v_balance, v_locked
    FROM public.wallets 
    WHERE user_id = p_user_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RETURN QUERY SELECT FALSE, 0.00, 0.00;
        RETURN;
    END IF;

    -- Enforce balance constraints
    IF (v_balance + p_amount) < 0.00 THEN
        RAISE EXCEPTION 'INSUFFICIENT_FUNDS';
    END IF;

    IF (v_locked + p_locked_amount) < 0.00 THEN
        RAISE EXCEPTION 'INSUFFICIENT_LOCKED_FUNDS';
    END IF;

    UPDATE public.wallets 
    SET 
        balance = balance + p_amount,
        locked_balance = locked_balance + p_locked_amount,
        updated_at = NOW()
    WHERE id = v_wallet_id
    RETURNING balance, locked_balance INTO v_balance, v_locked;

    RETURN QUERY SELECT TRUE, v_balance, v_locked;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
