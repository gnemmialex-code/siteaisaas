-- ============================================================
-- FIX : les nouveaux comptes doivent être 'free' (aperçu flouté),
-- pas 'plan_essentiel' (considéré comme payant).
--
-- Le trigger handle_new_user déployé insérait 'plan_essentiel', ce qui
-- débloquait la HD pour tous les nouveaux inscrits et déclenchait une vraie
-- génération Replicate (→ 401 si pas d'abonnement).
--
-- À exécuter UNE FOIS dans l'éditeur SQL de Supabase :
-- https://supabase.com/dashboard/project/dcrdokjjuucykrffgfdm/sql/new
-- ============================================================

-- 1. Recrée le trigger avec le bon plan par défaut
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, credits, plan_id, referral_code)
  VALUES (NEW.id, NEW.email, 100, 'free', public.generate_referral_code())
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Aligne la valeur par défaut de la colonne
ALTER TABLE public.users ALTER COLUMN plan_id SET DEFAULT 'free';

-- 3. (Optionnel) Repasse en 'free' les comptes jamais passés à la caisse.
--    ⚠️ Ne lance cette ligne que si AUCUN abonné Essentiel payant n'existe encore,
--    car un abonné Essentiel payant porte aussi 'plan_essentiel'.
-- UPDATE public.users SET plan_id = 'free' WHERE plan_id = 'plan_essentiel';
