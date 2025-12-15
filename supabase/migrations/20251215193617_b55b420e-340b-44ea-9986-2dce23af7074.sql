-- Note: We need to create the first admin user via the auth system
-- This will be done by the admin once they sign up
-- For now, let's create an RPC function that allows the first user to become admin

CREATE OR REPLACE FUNCTION public.setup_first_admin(user_email TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_count INTEGER;
  target_user_id UUID;
BEGIN
  -- Check if any admin exists
  SELECT COUNT(*) INTO admin_count FROM public.user_roles WHERE role = 'admin';
  
  IF admin_count > 0 THEN
    RETURN FALSE; -- Already has admin
  END IF;
  
  -- Get user ID from profiles by email
  SELECT id INTO target_user_id FROM public.profiles WHERE email = user_email;
  
  IF target_user_id IS NULL THEN
    RETURN FALSE; -- User not found
  END IF;
  
  -- Make this user an admin
  INSERT INTO public.user_roles (user_id, role) VALUES (target_user_id, 'admin');
  
  RETURN TRUE;
END;
$$;

-- Allow anyone to call this function (it has its own security check)
GRANT EXECUTE ON FUNCTION public.setup_first_admin TO authenticated;