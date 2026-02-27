import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { requireUser } from '@/lib/auth/guards';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { COMPANY } from '@/lib/config/company';
import { generateInvoiceNo } from '@/lib/invoices/invoiceNumber';

async function isAdminOrStaff(supabase: any) {
  try {
    const { data } = await supabase.rpc('is_role', { roles: ['admin', 'staff'] });
    return Boolean(data);
  } catch {
    return false;
  }
}

async function signedInvoiceUrl(admin: any, pathOrUrl: string) {
  // If legacy data stored a public URL, return it as-is.
  if (!pathOrUrl) return null;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;

  const { data, error } = await admin.storage
    .from('invoices')
    .createSignedUrl(pathOrUrl, 60 * 15);
  if (error) return null;
  return data?.signedUrl ?? null;
}

// GET /api/bookings/[id]/invoice -> returns a signed URL if invoice exists
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const { id: bookingId } = await params;
    const admin = createAdminClient();

    const { data: booking } = await admin
      .from('bookings')
      .select('id,user_id')
      .eq('id', bookingId)
      .maybeSingle();

    if (!booking) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });

    const elevated = await isAdminOrStaff(supabase);
    if (!elevated && booking.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { data: inv } = await admin
      .from('invoices')
      .select('pdf_url')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (!inv?.pdf_url) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });

    const url = await signedInvoiceUrl(admin, inv.pdf_url);
    if (!url) return NextResponse.json({ error: 'Failed to sign invoice URL' }, { status: 500 });

    return NextResponse.json({ url });
  } catch (e: any) {
    console.error('Invoice GET error:', e);
    return NextResponse.json({ error: 'Failed to fetch invoice' }, { status: 500 });
  }
}

// POST /api/bookings/[id]/invoice -> generate invoice if paid
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const auth = await requireUser(supabase);
    if (auth.errorResponse) return auth.errorResponse;

    const { id: bookingId } = await params;
    const admin = createAdminClient();

    // 1) Fetch booking with details (service role, then enforce auth/ownership)
    const { data: booking, error: bookingError } = await admin
      .from('bookings')
      .select('*, cars(make, model, year, price_per_day), users!bookings_user_id_fkey(email, name, phone, nic_passport)')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const elevated = await isAdminOrStaff(supabase);
    if (!elevated && booking.user_id !== auth.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (String(booking.payment_status).toLowerCase() !== 'paid') {
      return NextResponse.json({ error: 'Booking not paid' }, { status: 400 });
    }

    // 2) If invoice exists, return a signed URL
    const { data: existingInvoice } = await admin
      .from('invoices')
      .select('pdf_url')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingInvoice?.pdf_url) {
      const url = await signedInvoiceUrl(admin, existingInvoice.pdf_url);
      if (!url) return NextResponse.json({ error: 'Failed to sign invoice URL' }, { status: 500 });
      return NextResponse.json({ url, existing: true });
    }

    // 3) Generate PDF
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.text('INVOICE', 105, 20, { align: 'center' });

    doc.setFontSize(10);
    doc.text(COMPANY.name, 14, 30);
    doc.text(COMPANY.address, 14, 35);
    doc.text(COMPANY.email, 14, 40);
    doc.text(COMPANY.phone, 14, 45);

    const invoiceNo = generateInvoiceNo(bookingId);
    doc.text(`Invoice No: ${invoiceNo}`, 140, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 35);
    doc.text(`Booking Ref: ${bookingId}`, 140, 40);

    doc.text('Bill To:', 14, 60);
    doc.setFont('helvetica', 'bold');
    doc.text(`${booking.users?.name || 'Customer'}`, 14, 65);
    doc.setFont('helvetica', 'normal');
    doc.text(`${booking.users?.email || ''}`, 14, 70);
    doc.text(`${booking.users?.phone || ''}`, 14, 75);

    // Payment Info
    doc.text('Payment Info:', 140, 60);
    doc.setFont('helvetica', 'normal');
    doc.text(`Method: ${booking.payment_method || 'N/A'}`, 140, 65);
    doc.text(`Paid: ${booking.paid_at ? new Date(booking.paid_at).toLocaleDateString() : 'N/A'}`, 140, 70);

    const rows: any[] = [];
    const days = Math.ceil(
      Math.abs(new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) /
        (1000 * 3600 * 24)
    );

    rows.push([
      `Car Rental: ${booking.cars?.make} ${booking.cars?.model} (${booking.cars?.year})`,
      `${days} days`,
      `$${Number(booking.cars?.price_per_day).toFixed(2)}`,
      `$${Number(booking.base_amount || days * Number(booking.cars?.price_per_day)).toFixed(2)}`,
    ]);

    // Addons from JSONB
    if (booking.addons && typeof booking.addons === 'object') {
      const addons = booking.addons as Record<string, any>;
      if (addons.driver) rows.push(['Add-on: Additional Driver', '1', '-', '-']);
      if (addons.delivery) rows.push(['Add-on: Vehicle Delivery', '1', '-', '-']);
      if (addons.extraKmQty) rows.push([`Add-on: Extra KM (${addons.extraKmQty} km)`, '-', '-', '-']);
    }

    rows.push(['', '', 'Total', `$${Number(booking.total_amount).toFixed(2)}`]);

    autoTable(doc, {
      head: [['Item', 'Qty/Days', 'Rate', 'Amount']],
      body: rows,
      startY: 80,
    });

    const pdfBuffer = doc.output('arraybuffer');

    // 4) Upload to Storage (store path in DB)
    const filePath = `${bookingId}/${invoiceNo}.pdf`;
    const { error: uploadError } = await admin.storage.from('invoices').upload(filePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: true,
    });

    if (uploadError) {
      console.error('Invoice storage upload error:', uploadError);
      return NextResponse.json({ error: 'Failed to upload invoice' }, { status: 500 });
    }

    // 5) Save invoice record (store path)
    const { error: invErr } = await admin.from('invoices').insert({
      booking_id: bookingId,
      invoice_no: invoiceNo,
      pdf_url: filePath,
    });

    if (invErr) {
      console.error('Invoice insert error:', invErr);
      // Continue anyway; file exists and we can still return a signed URL.
    }

    const url = await signedInvoiceUrl(admin, filePath);
    if (!url) return NextResponse.json({ error: 'Failed to sign invoice URL' }, { status: 500 });

    return NextResponse.json({ success: true, url, invoiceNo });
  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
