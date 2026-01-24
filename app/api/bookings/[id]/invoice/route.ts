import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookingId } = await params;
    const supabase = await createClient();

    // 1. Fetch Booking with details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, cars(make, model, year, price_per_day), users(email, name, phone, nic_passport), booking_addons(qty, unit_price, total, addons(name))')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (booking.payment_status !== 'paid') {
      return NextResponse.json({ error: 'Booking not paid' }, { status: 400 });
    }

    // 2. Check if invoice already exists
    const { data: existingInvoice } = await supabase
      .from('invoices')
      .select('pdf_url')
      .eq('booking_id', bookingId)
      .maybeSingle();

    if (existingInvoice) {
        return NextResponse.json({ url: existingInvoice.pdf_url });
    }

    // 3. Generate PDF
    // Note: in a real Edge/Node environment without DOM, jsPDF might struggle with some features.
    // We will do a basic generation.
    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("INVOICE", 105, 20, { align: "center" });
    
    doc.setFontSize(10);
    doc.text("DriveEase Rentals", 14, 30);
    doc.text("123 Main Street, Cityville", 14, 35);
    doc.text("contact@driveease.com", 14, 40);

    // Invoice Details
    const invoiceNo = `INV-${new Date().getFullYear()}-${bookingId.slice(0, 6).toUpperCase()}`;
    doc.text(`Invoice No: ${invoiceNo}`, 140, 30);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 140, 35);
    doc.text(`Booking Ref: ${bookingId}`, 140, 40);

    // Customer Details
    doc.text(`Bill To:`, 14, 55);
    doc.setFont("helvetica", "bold");
    doc.text(`${booking.users?.name || 'Guest'}`, 14, 60);
    doc.setFont("helvetica", "normal");
    doc.text(`${booking.users?.email || ''}`, 14, 65);
    doc.text(`${booking.users?.phone || ''}`, 14, 70);

    // Table Data
    const rows = [];
    
    // Main Rental Item
    const days = Math.ceil(Math.abs(new Date(booking.end_date).getTime() - new Date(booking.start_date).getTime()) / (1000 * 3600 * 24));
    rows.push([
        `Car Rental: ${booking.cars?.make} ${booking.cars?.model} (${booking.cars?.year})`,
        `${days} days`,
        `$${Number(booking.cars?.price_per_day).toFixed(2)}`,
        `$${Number(booking.base_amount || (days * Number(booking.cars?.price_per_day))).toFixed(2)}`
    ]);

    // Addons
    if (booking.booking_addons && booking.booking_addons.length > 0) {
        booking.booking_addons.forEach((ad: any) => {
            rows.push([
                `Add-on: ${ad.addons?.name}`,
                `${ad.qty}`,
                `$${Number(ad.unit_price).toFixed(2)}`,
                `$${Number(ad.total).toFixed(2)}`
            ]);
        });
    }

    // Totals
    rows.push(['', '', 'Total', `$${Number(booking.total_amount).toFixed(2)}`]);

    autoTable(doc, {
        head: [['Item', 'Qty/Days', 'Rate', 'Amount']],
        body: rows,
        startY: 80,
    });

    // Output as Buffer/ArrayBuffer
    const pdfBuffer = doc.output('arraybuffer');

    // 4. Upload to Storage
    const fileName = `${bookingId}/${invoiceNo}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase
        .storage
        .from('invoices')
        .upload(fileName, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true
        });

    if (uploadError) {
        console.error("Storage Error:", uploadError);
        // Fallback: Return generated ID or error, but let's assume we need to return URL.
        // If storage fails, we might mock a URL or return error.
        // For this task, we assume 'invoices' bucket exists or we create it?
        // User instructions said "bucket 'invoices' - User must create this".
        // I can't create bucket via SQL Migration easily (Supabase specific).
        // I will assume it works or handle error gracefully.
        throw new Error("Failed to upload invoice");
    }

    const { data: { publicUrl } } = supabase.storage
        .from('invoices')
        .getPublicUrl(fileName);

    // 5. Save to Invoices table
    await supabase.from('invoices').insert({
        booking_id: bookingId,
        invoice_no: invoiceNo,
        pdf_url: publicUrl
    });

    // 6. Update Booking
    await supabase.from('bookings').update({ invoice_url: publicUrl }).eq('id', bookingId);

    // 7. Mock Email
    console.log(`[EMAIL-MOCK] Sending invoice ${invoiceNo} to ${booking.users?.email}. Download: ${publicUrl}`);

    return NextResponse.json({ 
        success: true, 
        url: publicUrl,
        invoiceNo 
    });

  } catch (error: any) {
    console.error('Invoice generation error:', error);
    return NextResponse.json({ error: 'Failed to generate invoice' }, { status: 500 });
  }
}
