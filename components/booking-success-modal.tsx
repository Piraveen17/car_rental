"use client";

import Link from "next/link";
import { CheckCircle2, Car, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface BookingSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  carName: string;
}

export function BookingSuccessModal({
  open,
  onOpenChange,
  bookingId,
  carName,
}: BookingSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <CheckCircle2 className="h-6 w-6 text-green-600" />
          </div>
          <DialogTitle className="text-center text-xl">
            Booking Request Sent!
          </DialogTitle>
          <DialogDescription className="text-center">
            Your request to book <strong>{carName}</strong> has been received.
            <br />
            Booking ID: <span className="font-mono text-xs">{bookingId}</span>
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex flex-col gap-3 py-4">
            <div className="bg-muted/50 p-4 rounded-lg text-sm text-center text-muted-foreground">
                Our team will review your request shortly. You can track the status in your dashboard.
            </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="w-full sm:w-auto" asChild>
            <Link href="/cars">
              <Car className="mr-2 h-4 w-4" />
              Browse More
            </Link>
          </Button>
          <Button className="w-full sm:w-auto" asChild>
            <Link href="/dashboard">
              <LayoutDashboard className="mr-2 h-4 w-4" />
              Go to Dashboard
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
