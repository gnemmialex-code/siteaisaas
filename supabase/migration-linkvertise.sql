-- ============================================================
-- MIGRATION : Crédits offerts via Linkvertise
-- À exécuter dans l'éditeur SQL de Supabase (SQL Editor → Run)
-- Réexécutable sans risque (idempotente)
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ── Table des tentatives / récompenses Linkvertise ──
-- Un « ticket » est créé quand l'utilisateur part vers Linkvertise (status = 'pending'),
-- puis confirmé au retour si le hash anti-bypass est validé (status = 'rewarded').
CREATE TABLE IF NOT EXISTS public.linkvertise_claims (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  ticket      TEXT NOT NULL UNIQUE,
  hash        TEXT,
  status      TEXT NOT NULL DEFAULT 'pending'
              CHECK (status IN ('pending', 'rewarded', 'rejected')),
  credits     INTEGER NOT NULL DEFAULT 0,
  ip          TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  rewarded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS linkvertise_claims_user_idx    ON public.linkvertise_claims(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS linkvertise_claims_ip_idx      ON public.linkvertise_claims(ip, created_at DESC);
-- Un hash Linkvertise ne peut être crédité qu'une seule fois (anti-rejeu)
CREATE UNIQUE INDEX IF NOT EXISTS linkvertise_claims_hash_uidx
  ON public.linkvertise_claims(hash) WHERE hash IS NOT NULL;

ALTER TABLE public.linkvertise_claims ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own linkvertise claims" ON public.linkvertise_claims;
CREATE POLICY "Users can view own linkvertise claims"
  ON public.linkvertise_claims FOR SELECT
  USING (auth.uid() = user_id);
-- Aucune policy INSERT/UPDATE : seul le service role (routes API) écrit ici.

-- ── Types de transaction autorisés (ajoute 'linkvertise') ──
ALTER TABLE public.credit_transactions DROP CONSTRAINT IF EXISTS credit_transactions_type_check;
ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('purchase', 'use', 'bonus', 'referral', 'linkvertise'));

-- ============================================================
-- Ouverture d'une tentative : vérifie le quota avant d'envoyer
-- l'utilisateur sur Linkvertise, puis crée le ticket.
-- Retourne { ok, ticket, error, remaining }
-- ============================================================
CREATE OR REPLACE FUNCTION public.open_linkvertise_claim(
  p_user_id   UUID,
  p_ticket    TEXT,
  p_ip        TEXT DEFAULT NULL,
  p_daily_max INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
  v_exists  BOOLEAN;
  v_today   INTEGER;
BEGIN
  SELECT TRUE INTO v_exists FROM public.users WHERE id = p_user_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Utilisateur introuvable');
  END IF;

  SELECT COUNT(*) INTO v_today
  FROM public.linkvertise_claims
  WHERE user_id = p_user_id
    AND status = 'rewarded'
    AND rewarded_at > NOW() - INTERVAL '24 hours';

  IF v_today >= p_daily_max THEN
    RETURN jsonb_build_object(
      'ok', false,
      'error', 'Quota atteint : revenez dans 24 h pour de nouveaux crédits offerts.',
      'remaining', 0
    );
  END IF;

  -- Nettoie les tickets en attente trop vieux de cet utilisateur
  UPDATE public.linkvertise_claims
  SET status = 'rejected'
  WHERE user_id = p_user_id
    AND status = 'pending'
    AND created_at < NOW() - INTERVAL '1 hour';

  INSERT INTO public.linkvertise_claims (user_id, ticket, ip)
  VALUES (p_user_id, p_ticket, p_ip);

  RETURN jsonb_build_object('ok', true, 'ticket', p_ticket, 'remaining', p_daily_max - v_today);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- Validation du retour : crédite l'utilisateur une seule fois.
-- Le hash a déjà été vérifié auprès de l'API anti-bypass Linkvertise
-- par la route /api/linkvertise/callback avant cet appel.
-- Retourne { ok, credits, error }
-- ============================================================
CREATE OR REPLACE FUNCTION public.claim_linkvertise_reward(
  p_user_id   UUID,
  p_ticket    TEXT,
  p_hash      TEXT,
  p_reward    INTEGER DEFAULT 100,
  p_daily_max INTEGER DEFAULT 3,
  p_ttl_min   INTEGER DEFAULT 60
)
RETURNS JSONB AS $$
DECLARE
  v_claim  public.linkvertise_claims%ROWTYPE;
  v_today  INTEGER;
BEGIN
  SELECT * INTO v_claim
  FROM public.linkvertise_claims
  WHERE ticket = p_ticket
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Session de récompense introuvable');
  END IF;
  IF v_claim.user_id <> p_user_id THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Session de récompense invalide');
  END IF;
  IF v_claim.status = 'rewarded' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ces crédits ont déjà été versés');
  END IF;
  IF v_claim.status <> 'pending' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Session de récompense expirée');
  END IF;
  IF v_claim.created_at < NOW() - (p_ttl_min || ' minutes')::INTERVAL THEN
    UPDATE public.linkvertise_claims SET status = 'rejected' WHERE id = v_claim.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Session de récompense expirée, relancez l''opération');
  END IF;

  -- Hash déjà consommé par un autre ticket → rejeu
  IF EXISTS (SELECT 1 FROM public.linkvertise_claims WHERE hash = p_hash) THEN
    UPDATE public.linkvertise_claims SET status = 'rejected' WHERE id = v_claim.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Cette validation a déjà été utilisée');
  END IF;

  SELECT COUNT(*) INTO v_today
  FROM public.linkvertise_claims
  WHERE user_id = p_user_id
    AND status = 'rewarded'
    AND rewarded_at > NOW() - INTERVAL '24 hours';

  IF v_today >= p_daily_max THEN
    UPDATE public.linkvertise_claims SET status = 'rejected' WHERE id = v_claim.id;
    RETURN jsonb_build_object('ok', false, 'error', 'Quota de 24 h atteint');
  END IF;

  UPDATE public.linkvertise_claims
  SET status = 'rewarded', hash = p_hash, credits = p_reward, rewarded_at = NOW()
  WHERE id = v_claim.id;

  UPDATE public.users
  SET credits = credits + p_reward, updated_at = NOW()
  WHERE id = p_user_id;

  INSERT INTO public.credit_transactions (user_id, amount, type, pack_id)
  VALUES (p_user_id, p_reward, 'linkvertise', 'linkvertise');

  RETURN jsonb_build_object('ok', true, 'credits', p_reward);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
