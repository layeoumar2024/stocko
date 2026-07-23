-- Migration additive pour la gestion des ventes et lignes de vente (Vente Rapide)

CREATE TABLE public.sales (
    id UUID PRIMARY KEY,
    customer_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
    total NUMERIC NOT NULL CHECK (total >= 0),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('cash', 'mobile_money', 'credit')),
    amount_paid NUMERIC NOT NULL CHECK (amount_paid >= 0),
    device_id TEXT,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    deleted_at TIMESTAMP WITH TIME ZONE,
    cancels_sale_id UUID REFERENCES public.sales(id) ON DELETE SET NULL,
    entreprise_id UUID REFERENCES public.entreprises(id) ON DELETE SET NULL
);

CREATE TABLE public.sale_items (
    id UUID PRIMARY KEY,
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE RESTRICT,
    qty NUMERIC NOT NULL CHECK (qty > 0),
    unit_price NUMERIC NOT NULL CHECK (unit_price >= 0),
    cost_price NUMERIC NOT NULL CHECK (cost_price >= 0)
);

ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage sales of their enterprise" ON public.sales
    FOR ALL USING (entreprise_id = get_user_entreprise_id());

CREATE POLICY "Users can manage sale items of their enterprise" ON public.sale_items
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.sales
            WHERE sales.id = sale_items.sale_id
            AND sales.entreprise_id = get_user_entreprise_id()
        )
    );
