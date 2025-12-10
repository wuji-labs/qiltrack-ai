-- Fix handle_new_user trigger to pass referral_code from metadata
-- This enables the referral system to work correctly by passing the
-- referral code stored in user metadata to fn_initialize_profile

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Update the handle_new_user function to pass referral_code
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Call fn_initialize_profile with all 4 parameters
  PERFORM public.fn_initialize_profile(
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'referral_code'  -- Pass referral code from metadata
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Add a comment to explain the fix
COMMENT ON FUNCTION public.handle_new_user() IS
'Trigger function that initializes a new user profile when a user signs up.
Passes referral_code from raw_user_meta_data to fn_initialize_profile to establish referral relationships.';
