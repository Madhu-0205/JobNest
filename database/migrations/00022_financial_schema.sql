-- Migration: Create Financial Platform Schemas (Payments, Wallet & Escrow)

-- 1. WALLETS
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (balance >= 0.00),
    pending_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (pending_balance >= 0.00),
    locked_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (locked_balance >= 0.00),
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. WALLET TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    wallet_id UUID REFERENCES public.wallets(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit')),
    category VARCHAR(50) NOT NULL CHECK (category IN ('payment', 'refund', 'payout', 'escrow_hold', 'escrow_release', 'reward_bonus', 'cashback', 'commission')),
    reference_id VARCHAR(255) NOT NULL, -- Encrypted or unique reference string
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. LEDGER ENTRIES (Double-entry accounting, immutable)
CREATE TABLE IF NOT EXISTS public.ledger_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- User profile account (null for platform accounts)
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    type VARCHAR(50) NOT NULL CHECK (type IN ('credit', 'debit')),
    transaction_id UUID NOT NULL, -- Corresponds to external transaction event uuid
    reference_type VARCHAR(100) NOT NULL CHECK (reference_type IN ('payment', 'payout', 'refund', 'escrow_hold', 'escrow_release', 'commission', 'reward')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 4. PAYMENTS
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    currency VARCHAR(10) DEFAULT 'INR' NOT NULL,
    gateway VARCHAR(50) DEFAULT 'razorpay' NOT NULL CHECK (gateway IN ('razorpay', 'stripe')),
    gateway_payment_id VARCHAR(255),
    gateway_order_id VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'captured', 'failed', 'refunded')),
    idempotency_key VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 5. ESCROWS
CREATE TABLE IF NOT EXISTS public.escrows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE CASCADE NOT NULL,
    payer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    payee_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    commission_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (commission_amount >= 0.00),
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'funded', 'held', 'partially_released', 'released', 'refunded', 'disputed')),
    released_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (released_amount >= 0.00),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 6. REFUNDS
CREATE TABLE IF NOT EXISTS public.refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID REFERENCES public.payments(id) ON DELETE CASCADE NOT NULL,
    escrow_id UUID REFERENCES public.escrows(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    reason TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processed', 'failed')),
    gateway_refund_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 7. PAYOUTS
CREATE TABLE IF NOT EXISTS public.payouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    method VARCHAR(50) NOT NULL CHECK (method IN ('bank_transfer', 'upi')),
    destination VARCHAR(255) NOT NULL, -- Bank Account string or UPI ID
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    gateway_payout_id VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 8. COMMISSIONS
CREATE TABLE IF NOT EXISTS public.commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    escrow_id UUID REFERENCES public.escrows(id) ON DELETE SET NULL,
    opportunity_id UUID REFERENCES public.opportunities(id) ON DELETE SET NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    rate NUMERIC(5, 4) NOT NULL CHECK (rate >= 0.0000 AND rate <= 1.0000), -- rate fraction
    type VARCHAR(50) DEFAULT 'platform_fee' NOT NULL CHECK (type IN ('platform_fee', 'premium_listing', 'promotional')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 9. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    invoice_number VARCHAR(100) UNIQUE NOT NULL,
    invoice_type VARCHAR(50) DEFAULT 'invoice' NOT NULL CHECK (invoice_type IN ('invoice', 'receipt', 'credit_note', 'debit_note')),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    tax_amount NUMERIC(12, 2) DEFAULT 0.00 NOT NULL CHECK (tax_amount >= 0.00),
    status VARCHAR(50) DEFAULT 'issued' NOT NULL CHECK (status IN ('draft', 'issued', 'paid', 'void')),
    gstin VARCHAR(50),
    billing_details JSONB DEFAULT '{}'::jsonb NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 10. INVOICE ITEMS
CREATE TABLE IF NOT EXISTS public.invoice_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    description TEXT NOT NULL,
    quantity INTEGER DEFAULT 1 NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(12, 2) NOT NULL CHECK (unit_price >= 0.00),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    tax_rate NUMERIC(5, 4) DEFAULT 0.1800 NOT NULL CHECK (tax_rate >= 0.0000 AND tax_rate <= 1.0000)
);

-- 11. TAX RECORDS
CREATE TABLE IF NOT EXISTS public.tax_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID REFERENCES public.invoices(id) ON DELETE CASCADE NOT NULL,
    tax_type VARCHAR(50) NOT NULL CHECK (tax_type IN ('CGST', 'SGST', 'IGST')),
    rate NUMERIC(5, 4) NOT NULL CHECK (rate >= 0.0000 AND rate <= 1.0000),
    amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0.00),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 12. COUPONS
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) UNIQUE NOT NULL,
    discount_type VARCHAR(50) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    value NUMERIC(12, 2) NOT NULL CHECK (value > 0.00),
    max_discount NUMERIC(12, 2),
    min_spend NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    starts_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    active BOOLEAN DEFAULT TRUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 13. REFERRALS
CREATE TABLE IF NOT EXISTS public.referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    referred_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'qualified', 'rewarded')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 14. REWARD TRANSACTIONS
CREATE TABLE IF NOT EXISTS public.reward_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0.00),
    reward_type VARCHAR(50) NOT NULL CHECK (reward_type IN ('referral_bonus', 'signup_bonus', 'cashback')),
    wallet_transaction_id UUID, -- Will link to wallet transaction when credited
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 15. INDEX DEFINITIONS
CREATE INDEX IF NOT EXISTS idx_wallets_user ON public.wallets(user_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet ON public.wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_ledger_entries_account ON public.ledger_entries(account_id);
CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments(user_id);
CREATE INDEX IF NOT EXISTS idx_escrows_payer ON public.escrows(payer_id);
CREATE INDEX IF NOT EXISTS idx_escrows_payee ON public.escrows(payee_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user ON public.payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_user ON public.invoices(user_id);
