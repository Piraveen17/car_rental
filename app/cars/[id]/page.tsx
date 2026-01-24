"use client";

import { use, useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { ImageGallery } from "@/components/image-gallery";
import { CarAvailabilityCalendar } from "@/components/car-availability-calendar";
import { AddonsSelector } from "@/components/addons-selector";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useCarsStore, useBookingsStore, useAuthStore } from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import type { DateRange } from "react-day-picker";
import {
  MapPin,
  Users,
  Settings2,
  Fuel,
  Calendar,
  Check,
  ArrowLeft,
  Loader2,
} from "lucide-react";
import { BookingPayload } from "@/types";

export default function CarDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { cars } = useCarsStore();
  const { bookings, addBooking } = useBookingsStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [selectedRange, setSelectedRange] = useState<DateRange | undefined>();
  const [addons, setAddons] = useState<BookingPayload["addons"]>({
    driver: false,
    extraKmQty: 0,
    delivery: false,
  });
  const [addonsTotal, setAddonsTotal] = useState(0);
  const [isBooking, setIsBooking] = useState(false);

  const car = cars.find((c) => c.carId === id);

  const carBookings = useMemo(() => {
    return bookings.filter((b) => b.carId === id);
  }, [bookings, id]);

  if (!car) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Car Not Found</h1>
            <Button asChild>
              <Link href="/cars">Browse Available Cars</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const days = useMemo(() => {
     if (!selectedRange?.from || !selectedRange?.to) return 0;
     return Math.ceil((selectedRange.to.getTime() - selectedRange.from.getTime()) / (1000 * 60 * 60 * 24));
  }, [selectedRange]);

  const calculateTotal = () => {
    const baseTotal = days * car.pricePerDay;
    return baseTotal + addonsTotal;
  };

  const handleBooking = async () => {
    if (!isAuthenticated) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to book a car.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedRange?.from || !selectedRange?.to) {
      toast({
        title: "Select dates",
        description: "Please select your rental dates.",
        variant: "destructive",
      });
      return;
    }

    setIsBooking(true);

    try {
      const bookingId = await addBooking({
        userId: user!.userId,
        carId: car.carId,
        startDate: selectedRange.from,
        endDate: selectedRange.to,
        totalAmount: calculateTotal(),
        paymentStatus: "pending",
        bookingStatus: "pending",
        addons: addons, // Pass selected addons
      } as BookingPayload);

      toast({
        title: "Booking Request Sent!",
        description: "Your booking is pending confirmation. You can track it in your dashboard.",
      });

      console.log(bookingId);

      router.push(`/dashboard`);
    } catch {
      toast({
        title: "Booking failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link href="/cars">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cars
            </Link>
          </Button>

          <div className="grid lg:grid-cols-[1fr_400px] gap-8">
            {/* Left Column - Car Details */}
            <div className="space-y-6">
              <ImageGallery
                images={car.images}
                alt={`${car.make} ${car.model}`}
              />

              <div>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h1 className="text-3xl font-bold">
                      {car.make} {car.model}
                    </h1>
                    <p className="text-lg text-muted-foreground">{car.year}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-primary">
                      ${car.pricePerDay}
                    </p>
                    <p className="text-sm text-muted-foreground">per day</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Specifications */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Users className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Seats</p>
                      <p className="font-semibold">{car.seats}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Settings2 className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Transmission
                      </p>
                      <p className="font-semibold capitalize">
                        {car.transmission}
                      </p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <Fuel className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Fuel</p>
                      <p className="font-semibold">{car.fuelType}</p>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="flex items-center gap-3 p-4">
                    <MapPin className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">Location</p>
                      <p className="font-semibold">{car.location}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Description */}
              {car.description && (
                <Card>
                  <CardHeader>
                    <CardTitle>Description</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">{car.description}</p>
                  </CardContent>
                </Card>
              )}

              {/* Features */}
              <Card>
                <CardHeader>
                  <CardTitle>Features</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {car.features.map((feature, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="flex items-center gap-1"
                      >
                        <Check className="h-3 w-3" />
                        {feature}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Right Column - Booking */}
            <div className="space-y-6">
              <CarAvailabilityCalendar
                carId={car.carId}
                pricePerDay={car.pricePerDay}
                onRangeSelect={setSelectedRange}
              />

              {selectedRange?.from && selectedRange?.to && (
                  <div className="space-y-4">
                    <AddonsSelector 
                        days={days} 
                        onChange={(newAddons, total) => {
                            setAddons(newAddons);
                            setAddonsTotal(total);
                        }} 
                    />
                    
                    <Card>
                        <CardContent className="p-4 bg-muted/20">
                            <div className="flex justify-between text-sm mb-2">
                                <span>Rental ({days} days)</span>
                                <span>${days * car.pricePerDay}</span>
                            </div>
                            {addonsTotal > 0 && (
                                <div className="flex justify-between text-sm mb-2 text-muted-foreground">
                                    <span>Add-ons</span>
                                    <span>+${addonsTotal}</span>
                                </div>
                            )}
                            <div className="flex justify-between font-bold text-lg pt-2 border-t mt-2">
                                <span>Total</span>
                                <span className="text-primary">${calculateTotal()}</span>
                            </div>
                        </CardContent>
                    </Card>
                  </div>
              )}

              <Button
                className="w-full"
                size="lg"
                disabled={
                  !selectedRange?.from ||
                  !selectedRange?.to ||
                  isBooking ||
                  car.status !== "active"
                }
                onClick={handleBooking}
              >
                {isBooking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Calendar className="mr-2 h-4 w-4" />
                    Book Now
                  </>
                )}
              </Button>

              {car.status !== "active" && (
                <p className="text-center text-sm text-muted-foreground">
                  This car is currently unavailable for booking.
                </p>
              )}
            </div>
          </div>
          
          <Separator className="my-12" />

          {/* Reviews Section */}
          <div className="space-y-6">
             <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Customer Reviews</h2>
                {user && (
                    <ReviewsAuthCheck carId={car.carId} userId={user.userId} onReviewSuccess={() => window.location.reload()} />
                )}
             </div>
             <ReviewsSection carId={car.carId} />
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
}

// Sub-components to keep main file clean-ish and handle async logic
import { ReviewsList } from "@/components/reviews-list";
import { ReviewForm } from "@/components/review-form";
import { apiClient } from "@/lib/api-client";

function ReviewsSection({ carId }: { carId: string }) {
    const [reviews, setReviews] = useState<any[]>([]);
    const [stats, setStats] = useState({ count: 0, average: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        apiClient.get(`/cars/${carId}/reviews`)
            .then(res => res.json())
            .then(data => {
                if (data.reviews) {
                    setReviews(data.reviews);
                    setStats(data.stats);
                }
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [carId]);

    if (loading) return <p className="text-muted-foreground">Loading reviews...</p>;

    return <ReviewsList reviews={reviews} stats={stats} />;
}

function ReviewsAuthCheck({ carId, userId, onReviewSuccess }: { carId: string, userId: string, onReviewSuccess: () => void }) {
    const [eligibleBookingId, setEligibleBookingId] = useState<string | null>(null);

    useEffect(() => {
        // Check if user has a completed booking for this car that isn't reviewed yet
        // This logic is complex for client-side without a specific API.
        // We can fetch "my bookings" and filter.
        // Or simpler: Just show the button, and let server reject if invalid.
        // But prompt said: "If logged in AND has a completed booking... show Write review".
        // Let's try to find one.
        apiClient.get('/bookings/my-bookings')
            .then(res => res.json())
            .then((bookings: any[]) => {
                if (Array.isArray(bookings)) {
                   const completed = bookings.find(b => 
                        b.carId === carId && 
                        b.status === 'completed' 
                        // && !b.has_review // We don't have this flag yet, but we have unique constraint.
                        // Ideally we check if review exists.
                   );
                   if (completed) {
                       setEligibleBookingId(completed.id ?? completed.bookingId);
                   }
                }
            })
            .catch(console.error);
    }, [carId, userId]);

    if (!eligibleBookingId) return null;

    return <ReviewForm carId={carId} bookingId={eligibleBookingId} onSuccess={onReviewSuccess} />;
}
