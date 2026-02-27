import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { reviewFromDb } from "@/lib/mappers";

// GET /api/cars/[id]/reviews - public
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("reviews")
      .select(`
        *,
        users (id, name, avatar_url)
      `)
      .eq("car_id", id)
      .eq("is_verified", true)
      .order("created_at", { ascending: false })
      .limit(20);

    if (error) throw error;

    const reviews = (data ?? []).map(reviewFromDb);

    // Aggregate stats
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;

    return NextResponse.json({
      reviews,
      stats: {
        count: reviews.length,
        averageRating: Math.round(avgRating * 10) / 10,
        distribution: [5, 4, 3, 2, 1].map((star) => ({
          star,
          count: reviews.filter((r) => r.rating === star).length,
        })),
      },
    });
  } catch (error: any) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json(
      { error: "Failed to fetch reviews" },
      { status: 500 }
    );
  }
}

// POST /api/cars/[id]/reviews - authenticated customers with completed booking
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: carId } = await params;
    const supabase = await createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { bookingId, rating, cleanliness, comfort, valueForMoney, comment } =
      body;

    if (!bookingId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "bookingId and rating (1-5) are required" },
        { status: 400 }
      );
    }

    // Verify the booking belongs to this user and is completed
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("id, user_id, car_id, status")
      .eq("id", bookingId)
      .eq("user_id", user.id)
      .eq("car_id", carId)
      .eq("status", "completed")
      .single();

    if (bookingError || !booking) {
      return NextResponse.json(
        {
          error:
            "You can only review a car after completing a booking for it.",
        },
        { status: 403 }
      );
    }

    // Check if review already exists
    const { data: existing } = await supabase
      .from("reviews")
      .select("id")
      .eq("booking_id", bookingId)
      .maybeSingle();

    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this booking." },
        { status: 409 }
      );
    }

    // Insert review
    const { data: review, error } = await supabase
      .from("reviews")
      .insert({
        booking_id: bookingId,
        user_id: user.id,
        car_id: carId,
        rating,
        cleanliness: cleanliness ?? null,
        comfort: comfort ?? null,
        value_for_money: valueForMoney ?? null,
        comment: comment ?? null,
        is_verified: true,
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(reviewFromDb(review), { status: 201 });
  } catch (error: any) {
    console.error("Error creating review:", error);
    return NextResponse.json(
      { error: "Failed to create review" },
      { status: 500 }
    );
  }
}
