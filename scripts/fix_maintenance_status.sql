
ALTER TABLE public.maintenance DROP CONSTRAINT maintenance_status_check;

-- Add the new constraint allowing 'pending' and 'fixed'
ALTER TABLE public.maintenance ADD CONSTRAINT maintenance_status_check 
CHECK (status IN ('pending', 'fixed'));
