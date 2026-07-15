-- Migration: Create Financial triggers and wallet initializations

-- 1. Automatically initialize user wallet on profile creation
CREATE OR REPLACE FUNCTION public.init_user_wallet()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.wallets (user_id, balance, pending_balance, locked_balance, currency)
  VALUES (
    NEW.id,
    0.00,
    0.00,
    0.00,
    'INR'
  )
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER trg_init_user_wallet
AFTER INSERT ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.init_user_wallet();

-- 2. Backfill wallets for existing profiles
INSERT INTO public.wallets (user_id, balance, pending_balance, locked_balance, currency)
SELECT 
  id, 
  0.00, 
  0.00, 
  0.00, 
  'INR'
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;
