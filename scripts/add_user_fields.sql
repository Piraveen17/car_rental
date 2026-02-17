-- Add nic_passport column to public.users table
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS nic_passport text;

-- Update RLS policies if necessary (usually select polices cover * generally, but good to check)
-- "users_read_own_profile" using (auth.uid() = id) will include the new column automatically.
-- "users_update_own_profile" using (auth.uid() = id) will allow updates if the column is in the table.
