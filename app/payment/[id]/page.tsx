"use client";

import { use, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  useBookingsStore,
  useCarsStore,
  usePaymentsStore,
  useAuthStore,
} from "@/lib/store";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import {
  Car,
  Calendar,
  CreditCard,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  ArrowLeft,
} from "lucide-react";
import { BookingPayload } from "@/types";


export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { bookings, fetchBookings, updateBooking } = useBookingsStore();
  const { cars, fetchCars } = useCarsStore();
  const { initiatePayment, completePayment } = usePaymentsStore();
  const { user, isAuthenticated } = useAuthStore();
  const { toast } = useToast();

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentComplete, setPaymentComplete] = useState(false);

  useEffect(() => {
    fetchBookings();
    fetchCars();
  }, [fetchBookings,fetchCars]);
  console.log(bookings);

  const booking = bookings.find((b) => b.bookingId === id);
  const car = booking ? cars.find((c) => c.carId === booking.carId) : null;

  useEffect(() => {
    // Middleware protects this route, but just in case:
     if (!isAuthenticated && !user) {
         // Optionally redirect to home or show unauth state
         // router.push("/"); 
     }
  }, [isAuthenticated, user, router]);

  if (!booking || !car) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Booking Not Found</h1>
            <Button asChild>
              <Link href="/cars">Browse Cars</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (booking.paymentStatus === "paid") {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <CheckCircle2 className="h-16 w-16 text-success mx-auto mb-4" />
              <h1 className="text-2xl font-bold mb-2">
                Payment Already Complete
              </h1>
              <p className="text-muted-foreground mb-6">
                This booking has already been paid for.
              </p>
              <Button asChild>
                <Link href="/dashboard">View My Bookings</Link>
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const handlePayment = async () => {
    setIsProcessing(true);

    // Simulate payment processing
    await new Promise((resolve) => setTimeout(resolve, 2000));

    try {
      const paymentId = await initiatePayment(
        booking.bookingId,
        booking.totalAmount
      );

      // Simulate payment completion
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const success = await completePayment(paymentId);

      const updatedBooking: BookingPayload = {
        ...booking,
        paymentStatus: "paid",
        bookingStatus: "confirmed",
        invoiceUrl: `/invoices/invoice-${booking.bookingId}.pdf`,
      };

      if (success) {
        updateBooking(booking.bookingId, updatedBooking);

        setPaymentComplete(true);

        toast({
          title: "Payment Successful!",
          description: "Your booking has been confirmed.",
        });
      }
    } catch {
      toast({
        title: "Payment Failed",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  if (paymentComplete) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6 space-y-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto">
                <CheckCircle2 className="h-10 w-10 text-success" />
              </div>
              <div>
                <h1 className="text-2xl font-bold mb-2">Payment Successful!</h1>
                <p className="text-muted-foreground">
                  Your booking for {car.make} {car.model} has been confirmed.
                </p>
              </div>
              <div className="bg-muted rounded-lg p-4 text-left space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Booking ID:</span>
                  <span className="font-mono">{booking.bookingId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Pick-up:</span>
                  <span>{format(new Date(booking.startDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Drop-off:</span>
                  <span>{format(new Date(booking.endDate), "PPP")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Paid:</span>
                  <span className="font-bold text-primary">
                    ${booking.totalAmount}
                  </span>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button asChild>
                  <Link href="/dashboard">View My Bookings</Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/cars">Book Another Car</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  const days = Math.ceil(
    (new Date(booking.endDate).getTime() -
      new Date(booking.startDate).getTime()) /
      (1000 * 60 * 60 * 24)
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1">
        <div className="container px-4 py-8 max-w-4xl">
          <Button variant="ghost" asChild className="mb-6">
            <Link href={`/cars/${car.carId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Car Details
            </Link>
          </Button>

          <div className="grid md:grid-cols-[1fr_400px] gap-8">
            {/* Booking Summary */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Booking Summary</CardTitle>
                  <CardDescription>Review your rental details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-24 h-16 rounded-lg bg-muted flex items-center justify-center">
                      <Car className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <div>
                      <h3 className="font-semibold">
                        {`${car.make} ${car.model} car`}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {car.year} • {car.transmission}
                      </p>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Pick-up Date
                        </p>
                        <p className="font-medium">
                          {format(new Date(booking.startDate), "PPP")}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Calendar className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drop-off Date
                        </p>
                        <p className="font-medium">
                          {format(new Date(booking.endDate), "PPP")}
                        </p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">
                        ${car.pricePerDay} x {days} days
                      </span>
                      <span>${booking.totalAmount}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Insurance</span>
                      <span className="text-success">Included</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total</span>
                      <span className="text-primary">
                        ${booking.totalAmount}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Payment Form */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CreditCard className="h-5 w-5" />
                    Demo Payment
                  </CardTitle>
                  <CardDescription>
                    This is a demo payment - no real money will be charged
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-muted/50 rounded-lg p-4 border border-dashed">
                    <p className="text-sm text-center text-muted-foreground">
                      In a production environment, this would be a real payment
                      form with Stripe or another payment provider.
                    </p>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <ShieldCheck className="h-4 w-4 text-success" />
                    <span>Secure payment processing</span>
                  </div>

                  <Button
                    className="w-full"
                    size="lg"
                    onClick={handlePayment}
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Processing Payment...
                      </>
                    ) : (
                      <>Pay ${booking.totalAmount}</>
                    )}
                  </Button>

                  <p className="text-xs text-center text-muted-foreground">
                    By clicking Pay, you agree to our Terms of Service and
                    Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
