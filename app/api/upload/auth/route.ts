import ImageKit from 'imagekit';
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

const imagekit = new ImageKit({
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
});

export async function GET() {
  const supabase = await createClient();
  const gate = await requireRole(supabase, ['admin', 'staff']);
  if (!gate.ok) return gate.errorResponse;

  const result = imagekit.getAuthenticationParameters();
  return NextResponse.json(result);
}
