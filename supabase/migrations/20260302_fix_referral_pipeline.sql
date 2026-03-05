-- ============================================================
-- Fix referral pipeline: auto-record referrals + badge system
-- ============================================================

-- 1. Add referred_id to referrals table (if not exists)
ALTER TABLE referrals ADD COLUMN IF NOT EXISTS referred_id uuid REFERENCES profiles(id);

-- 2. Add referral_badge to profiles table (if not exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS referral_badge text;

-- 3. Function: compute referral badge from count
CREATE OR REPLACE FUNCTION compute_referral_badge(referral_count int)
RETURNS text
LANGUAGE plpgsql
AS $compute_badge$
BEGIN
  IF referral_count >= 5 THEN
    RETURN 'ambassador';
  ELSIF referral_count >= 1 THEN
    RETURN 'connector';
  ELSE
    RETURN NULL;
  END IF;
END;
$compute_badge$;

-- 4. Function: update referral badge for a given referrer
CREATE OR REPLACE FUNCTION update_referral_badge(referrer uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $update_badge$
DECLARE
  ref_count int;
  new_badge text;
BEGIN
  SELECT count(*) INTO ref_count
  FROM referrals
  WHERE referrer_id = referrer;

  new_badge := compute_referral_badge(ref_count);

  UPDATE profiles
  SET referral_badge = new_badge
  WHERE id = referrer;
END;
$update_badge$;

-- 5. Trigger function: on new profile insert, record referral from auth metadata
CREATE OR REPLACE FUNCTION handle_new_profile_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $new_profile$
DECLARE
  ref_code text;
  referrer_row record;
BEGIN
  SELECT raw_user_meta_data ->> 'referral_code'
  INTO ref_code
  FROM auth.users
  WHERE id = NEW.id;

  IF ref_code IS NULL OR ref_code = '' THEN
    RETURN NEW;
  END IF;

  SELECT id, username INTO referrer_row
  FROM profiles
  WHERE username = ref_code OR referral_code = ref_code
  LIMIT 1;

  IF referrer_row.id IS NULL OR referrer_row.id = NEW.id THEN
    RETURN NEW;
  END IF;

  INSERT INTO referrals (referrer_id, referred_id)
  VALUES (referrer_row.id, NEW.id)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$new_profile$;

DROP TRIGGER IF EXISTS on_profile_created_record_referral ON profiles;
CREATE TRIGGER on_profile_created_record_referral
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_profile_referral();

-- 6. Trigger function: on new referral, notify referrer and update badge
CREATE OR REPLACE FUNCTION handle_new_referral()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $new_referral$
BEGIN
  INSERT INTO notifications (user_id, type, from_user_id, read)
  VALUES (NEW.referrer_id, 'referral', NEW.referred_id, false);

  PERFORM update_referral_badge(NEW.referrer_id);

  RETURN NEW;
END;
$new_referral$;

DROP TRIGGER IF EXISTS on_referral_created ON referrals;
CREATE TRIGGER on_referral_created
  AFTER INSERT ON referrals
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_referral();
