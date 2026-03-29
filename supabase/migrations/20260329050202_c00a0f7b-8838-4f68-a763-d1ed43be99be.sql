
-- Update assign_admin_to_approved_emails function to include aiquantcrypto@gmail.com
CREATE OR REPLACE FUNCTION public.assign_admin_to_approved_emails()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  approved_emails TEXT[] := ARRAY['1drrey@gmail.com', '1drrey@duck.com', 'aiqtpinfo@gmail.com', 'aiquantcrypto@gmail.com'];
BEGIN
  IF NEW.email = ANY(approved_emails) THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$function$;
