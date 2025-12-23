-- Update the handle_new_user function to recognize admin@gmail.com as admin
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'New User'),
    NEW.raw_user_meta_data ->> 'phone',
    CASE 
      WHEN NEW.email IN ('prajwalnagare123@gmail.com', 'admin@gmail.com') THEN 'admin'::user_role
      ELSE 'photographer'::user_role
    END
  );
  RETURN NEW;
END;
$function$;