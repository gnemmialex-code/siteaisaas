-- ============================================================
-- Migration : accès NET réservé aux abonnements payants
-- (les crédits ne conditionnent plus rien)
-- À exécuter UNE FOIS dans l'éditeur SQL de Supabase.
--
-- Nouveau modèle :
--   • Anonyme + plan 'free'  → aperçu flouté (aucune génération IA)
--   • Abonnement payant      → rendu net illimité
--   • Les crédits ne servent plus de jauge d'accès.
-- ============================================================

-- 1) Le trigger d'inscription n'attribue plus de crédits d'accès.
--    (Le plan reste 'free' → aperçu flouté tant qu'aucun abonnement.)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, plan_id, referral_code)
  VALUES (NEW.id, NEW.email, 0, 'free', public.generate_referral_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2) Nouveau défaut de la colonne : 0 crédit.
ALTER TABLE public.users ALTER COLUMN credits SET DEFAULT 0;

-- 3) Remise à zéro des soldes des comptes NON payants.
--    Élimine les soldes hérités (« 50 crédits », « 100 crédits », etc.).
--    N'affecte PAS les abonnés payants (au cas où tu réutilises la colonne
--    pour un quota interne plus tard — sinon inoffensif).
UPDATE public.users
SET credits = 0
WHERE plan_id IS NULL
   OR lower(plan_id) IN ('free', 'gratuit', '');

-- ------------------------------------------------------------
-- Note : la fonction decrement_credits() n'est plus appelée par
-- l'application (générations payantes illimitées). On la laisse en place
-- pour ne rien casser ; aucune action requise.
-- ------------------------------------------------------------
