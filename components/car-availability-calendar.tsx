"use client";

import { useState, useEffect } from "react";
import { DateRange, Matcher } from "react-day-picker";
import { addDays, isSameDay, isBefore, startOfDay } from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BlockedDate {
  from: string; // ISO string
  to: string; // ISO string
  type: "booking" | "maintenance";
  reason?: string;
}

interface CalendarData {
  carId: string;
  minDays: number;
  maxDays: number;
  blockedDates: BlockedDate[];
}

interface CarAvailabilityCalendarProps {
  carId: string;
  pricePerDay: number;
  onRangeSelect: (range: DateRange | undefined) => void;
}

export function CarAvailabilityCalendar({
  carId,
  pricePerDay,
  onRangeSelect,
}: CarAvailabilityCalendarProps) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>();

  useEffect(() => {
    async function fetchAvailability() {
      try {
        const res = await apiClient.get(`/cars/${carId}/availability`);
        if (!res.ok) throw new Error("Failed to fetch availability");
        const json = await res.json();
        setData(json);
      } catch (error) {
        console.error("Availability fetch error:", error);
        toast({
            title: "Error loading calendar",
            description: "Could not fetch car availability.",
            variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    }

    if (carId) {
      fetchAvailability();
    }
  }, [carId]);

  // Convert blocked ranges to Matchers
  const disabledDays: Matcher[] = [
    { before: new Date() }, // Disable past dates
  ];

  if (data?.blockedDates) {
    data.blockedDates.forEach((b) => {
      disabledDays.push({
        from: new Date(b.from),
        to: new Date(b.to),
      });
    });
  }

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDate(undefined);
      onRangeSelect(undefined);
      return;
    }

    // Min/max validation
    if (range.from && range.to) {
        // Calculate days difference
        const days = Math.ceil((range.to.getTime() - range.from.getTime()) / (1000 * 60 * 60 * 24));
        
        if (data && days < data.minDays) {
             toast({
                title: "Invalid range",
                description: `Minimum rental period is ${data.minDays} days.`,
                variant: "destructive"
             });
             // Reset to just "from" day? Or clear? Let's keep it but warn.
             // Usually better to prevent selection but day-picker range handling is tricky.
             // We'll let the parent handle the "valid" state or reset here.
             setDate({ from: range.from, to: undefined }); 
             onRangeSelect(undefined);
             return;
        }

        if (data && days > data.maxDays) {
            toast({
                title: "Invalid range",
                description: `Maximum rental period is ${data.maxDays} days.`,
                variant: "destructive"
            });
            setDate({ from: range.from, to: undefined });
            onRangeSelect(undefined);
            return;
        }

        // Check for overlaps with blocked dates inside the range
        // day-picker disables start/end, but we need to ensure middle dates aren't blocked.
        const start = range.from;
        const end = range.to;
        const isOverlap = data?.blockedDates.some((b) => {
            const blockStart = new Date(b.from);
            const blockEnd = new Date(b.to);
            // Check if any blocked range intersects with selected range
            return (start <= blockEnd && end >= blockStart);
        });

        if (isOverlap) {
            toast({
                title: "Unavailable dates",
                description: "The selected range includes unavailable dates.",
                variant: "destructive"
            });
             setDate({ from: range.from, to: undefined });
             onRangeSelect(undefined);
             return;
        }
    }

    setDate(range);
    onRangeSelect(range);
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center border rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) return <div className="text-red-500">Failed to load calendar</div>;

  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Select Dates</h3>
          <p className="text-sm text-muted-foreground">
            Min: {data.minDays} days • Max: {data.maxDays} days
          </p>
        </div>
        <div className="flex justify-center">
            <Calendar
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={disabledDays}
            className="rounded-md border shadow-sm"
            />
        </div>
        <div className="mt-4 space-y-2">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Rate</span>
                <span className="font-semibold">${pricePerDay}/day</span>
            </div>
            {date?.from && date?.to && (
                <div className="flex justify-between text-sm pt-2 border-t">
                    <span className="font-medium">Total Days</span>
                    <span className="font-bold">
                        {Math.ceil((date.to.getTime() - date.from.getTime()) / (1000 * 60 * 60 * 24))}
                    </span>
                </div>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
