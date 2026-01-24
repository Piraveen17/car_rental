-- Create a public bucket for invoices
INSERT INTO storage.buckets (id, name, public) VALUES ('invoices', 'invoices', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow authenticated users to upload their own invoices (via API)
-- Actually, the API generates it, so it runs as service role / or authenticated user?
-- In Next.js API routes, we use the logged-in user's client. 
-- So we need RLS to allow upload.

-- Allow authenticated users to upload to 'invoices' folder (filename is random/unique enough)
CREATE POLICY "Authenticated users can upload invoices" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (
    bucket_id = 'invoices'
);

-- Allow public read access to invoices
CREATE POLICY "Public Access" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'invoices');
