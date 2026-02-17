import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { requireRole } from '@/lib/auth/guards';

function toISODate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function monthKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(req: Request) {
  try {
    const supabase = await createClient();
    const authz = await requireRole(supabase, ['admin']);
    if (!authz.ok) return authz.errorResponse;

    const url = new URL(req.url);
    const sp = url.searchParams;

    const months = Math.min(24, Math.max(1, Number(sp.get('months') || '6')));
    const today = new Date();

    const defaultTo = toISODate(today);
    const fromDate = new Date(today);
    fromDate.setMonth(fromDate.getMonth() - (months - 1));
    fromDate.setDate(1);
    const defaultFrom = toISODate(fromDate);

    const dateFrom = (sp.get('date_from') || defaultFrom).slice(0, 10);
    const dateTo = (sp.get('date_to') || defaultTo).slice(0, 10);

    // Paid bookings in range
    const { data: paidBookings, error: bookingsErr } = await supabase
      .from('bookings')
      .select('id, car_id, total_amount, created_at, payment_status')
      .gte('created_at', `${dateFrom}T00:00:00.000Z`)
      .lte('created_at', `${dateTo}T23:59:59.999Z`)
      .eq('payment_status', 'paid');
    if (bookingsErr) throw bookingsErr;

    // All bookings count in range (regardless of payment)
    const { count: allBookingsCount, error: allCountErr } = await supabase
      .from('bookings')
      .select('id', { count: 'exact', head: true })
      .gte('created_at', `${dateFrom}T00:00:00.000Z`)
      .lte('created_at', `${dateTo}T23:59:59.999Z`);
    if (allCountErr) throw allCountErr;

    // Maintenance cost in range
    const { data: maintenance, error: maintErr } = await supabase
      .from('maintenance')
      .select('id, cost, date')
      .gte('date', dateFrom)
      .lte('date', dateTo);
    if (maintErr) throw maintErr;

    const totalRevenue = (paidBookings || []).reduce((sum: number, b: any) => sum + Number(b.total_amount || 0), 0);
    const totalBookings = Number(allBookingsCount || 0);
    const maintenanceCosts = (maintenance || []).reduce((sum: number, m: any) => sum + Number(m.cost || 0), 0);

    // Build month buckets
    const monthBuckets: Record<string, { month: string; bookings: number; revenue: number }> = {};
    const monthLabels: string[] = [];
    const start = new Date(`${dateFrom}T00:00:00.000Z`);
    start.setDate(1);
    for (let i = 0; i < months; i++) {
      const d = new Date(start);
      d.setMonth(start.getMonth() + i);
      const k = monthKey(d);
      monthBuckets[k] = { month: d.toLocaleString('en-US', { month: 'short' }), bookings: 0, revenue: 0 };
      monthLabels.push(k);
    }

    for (const b of paidBookings || []) {
      const d = new Date(b.created_at);
      const k = monthKey(d);
      if (!monthBuckets[k]) continue;
      monthBuckets[k].bookings += 1;
      monthBuckets[k].revenue += Number(b.total_amount || 0);
    }

    const monthlyData = monthLabels.map((k) => monthBuckets[k]);

    // Most rented cars (top 5)
    const carRentals: Record<string, number> = {};
    for (const b of paidBookings || []) {
      if (!b.car_id) continue;
      carRentals[b.car_id] = (carRentals[b.car_id] || 0) + 1;
    }
    const topCarIds = Object.entries(carRentals)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    let carsById: Record<string, any> = {};
    if (topCarIds.length) {
      const { data: cars, error: carsErr } = await supabase
        .from('cars')
        .select('car_id, make, model, location')
        .in('car_id', topCarIds);
      if (carsErr) throw carsErr;
      carsById = Object.fromEntries((cars || []).map((c: any) => [c.car_id, c]));
    }

    const mostRentedCars = Object.entries(carRentals)
      .map(([carId, count]) => {
        const car = carsById[carId];
        return {
          name: car ? `${car.make} ${car.model}` : 'Unknown',
          value: count,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    // Revenue by location (needs all cars referenced in paidBookings)
    const referencedCarIds = Array.from(new Set((paidBookings || []).map((b: any) => b.car_id).filter(Boolean)));
    if (referencedCarIds.length) {
      const { data: cars, error: carsErr } = await supabase
        .from('cars')
        .select('car_id, location')
        .in('car_id', referencedCarIds);
      if (carsErr) throw carsErr;
      carsById = { ...carsById, ...Object.fromEntries((cars || []).map((c: any) => [c.car_id, c])) };
    }

    const locationRevenue: Record<string, number> = {};
    for (const b of paidBookings || []) {
      const car = carsById[b.car_id];
      const loc = car?.location || 'Unknown';
      locationRevenue[loc] = (locationRevenue[loc] || 0) + Number(b.total_amount || 0);
    }
    const revenueByLocation = Object.entries(locationRevenue)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const avgBookingValue = (paidBookings?.length || 0) ? Math.round(totalRevenue / (paidBookings?.length || 1)) : 0;

    return NextResponse.json({
      date_from: dateFrom,
      date_to: dateTo,
      months,
      totalRevenue,
      totalBookings,
      maintenanceCosts,
      netProfit: totalRevenue - maintenanceCosts,
      averageBookingValue: avgBookingValue,
      monthlyData,
      mostRentedCars,
      revenueByLocation,
    });
  } catch (error) {
    console.error('Error building analytics:', error);
    return NextResponse.json({ error: 'Failed to fetch analytics' }, { status: 500 });
  }
}
