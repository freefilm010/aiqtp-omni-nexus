-- Create a trigger function to automatically assign admin role to specific emails
CREATE OR REPLACE FUNCTION public.assign_admin_to_approved_emails()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  approved_emails TEXT[] := ARRAY['1drrey@gmail.com', '1drrey@duck.com', 'aiqtpinfo@gmail.com'];
BEGIN
  -- Check if the new user's email is in the approved list
  IF NEW.email = ANY(approved_emails) THEN
    -- Insert admin role
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger that fires after new user is created
DROP TRIGGER IF EXISTS on_auth_user_created_assign_admin ON auth.users;
CREATE TRIGGER on_auth_user_created_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.assign_admin_to_approved_emails();