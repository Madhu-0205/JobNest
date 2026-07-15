-- Migration: Enable Row Level Security (RLS) on Financial Platforms tables

-- Enable RLS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ledger_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.escrows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tax_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reward_transactions ENABLE ROW LEVEL SECURITY;

-- 1. WALLETS POLICIES
CREATE POLICY "Users can view own wallet" ON public.wallets
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can manage wallets" ON public.wallets
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 2. WALLET TRANSACTIONS POLICIES
CREATE POLICY "Users can view own wallet transactions" ON public.wallet_transactions
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.wallets w
            WHERE w.id = wallet_id AND (w.user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

-- 3. LEDGER ENTRIES POLICIES (Moderators/Admins only)
CREATE POLICY "Moderators can view ledger" ON public.ledger_entries
    FOR SELECT TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 4. PAYMENTS POLICIES
CREATE POLICY "Users can view own payments" ON public.payments
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Users can insert own payments" ON public.payments
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can manage payments" ON public.payments
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 5. ESCROWS POLICIES
CREATE POLICY "Users can view own escrows" ON public.escrows
    FOR SELECT TO authenticated USING (
        payer_id = auth.uid() OR payee_id = auth.uid() OR public.is_moderator_or_admin(auth.uid())
    );

CREATE POLICY "Users can create own escrows" ON public.escrows
    FOR INSERT TO authenticated WITH CHECK (payer_id = auth.uid());

CREATE POLICY "Moderators can manage escrows" ON public.escrows
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 6. REFUNDS POLICIES
CREATE POLICY "Users can view own refunds" ON public.refunds
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.payments p
            WHERE p.id = payment_id AND (p.user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

-- 7. PAYOUTS POLICIES
CREATE POLICY "Users can view own payouts" ON public.payouts
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Users can insert own payouts" ON public.payouts
    FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY "Moderators can manage payouts" ON public.payouts
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 8. COMMISSIONS POLICIES
CREATE POLICY "Moderators can manage commissions" ON public.commissions
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 9. INVOICES POLICIES
CREATE POLICY "Users can view own invoices" ON public.invoices
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));

CREATE POLICY "Moderators can manage invoices" ON public.invoices
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 10. INVOICE ITEMS POLICIES
CREATE POLICY "Users can view own invoice items" ON public.invoice_items
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_id AND (i.user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

-- 11. TAX RECORDS POLICIES
CREATE POLICY "Users can view own tax records" ON public.tax_records
    FOR SELECT TO authenticated USING (
        EXISTS (
            SELECT 1 FROM public.invoices i
            WHERE i.id = invoice_id AND (i.user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()))
        )
    );

-- 12. COUPONS POLICIES
CREATE POLICY "Anyone can view coupons" ON public.coupons
    FOR SELECT TO authenticated USING (active = true);

CREATE POLICY "Moderators can manage coupons" ON public.coupons
    FOR ALL TO authenticated USING (public.is_moderator_or_admin(auth.uid()));

-- 13. REFERRALS POLICIES
CREATE POLICY "Users can view own referrals" ON public.referrals
    FOR SELECT TO authenticated USING (
        referrer_id = auth.uid() OR referred_id = auth.uid() OR public.is_moderator_or_admin(auth.uid())
    );

CREATE POLICY "Users can insert referrals" ON public.referrals
    FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());

-- 14. REWARD TRANSACTIONS POLICIES
CREATE POLICY "Users can view own reward transactions" ON public.reward_transactions
    FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_moderator_or_admin(auth.uid()));
