"use client";

import { useState, useEffect, useCallback } from "react";
import { DateRange } from "react-day-picker";
import {
  addDays,
  isBefore,
  startOfDay,
  eachDayOfInterval,
  differenceInCalendarDays,
  format,
} from "date-fns";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/lib/api-client";
import { Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface BlockedDate {
  from: string;
  to: string;
  type: "booking" | "maintenance" | "reserved";
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

/**
 * Build a Set of "yyyy-MM-dd" strings for every day that is blocked.
 * Uses the convention that a booking occupying start_date → end_date
 * blocks the days [start_date, end_date) — i.e. the end day is the
 * pick-up day for the next renter and must stay free.
 */
function buildBlockedSet(blockedDates: BlockedDate[]): Set<string> {
  const set = new Set<string>();
  for (const b of blockedDates) {
    try {
      const start = startOfDay(new Date(b.from));
      // Treat end as exclusive: end_date itself is free (same-day turnaround)
      const lastBlocked = startOfDay(addDays(new Date(b.to), -1));
      if (lastBlocked < start) continue;
      for (const d of eachDayOfInterval({ start, end: lastBlocked })) {
        set.add(format(d, "yyyy-MM-dd"));
      }
    } catch {
      // skip malformed dates
    }
  }
  return set;
}

export function CarAvailabilityCalendar({
  carId,
  pricePerDay,
  onRangeSelect,
}: CarAvailabilityCalendarProps) {
  const [data, setData] = useState<CalendarData | null>(null);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>();
  const [blockedSet, setBlockedSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!carId) return;
    setLoading(true);
    apiClient
      .get(`/cars/${carId}/availability`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed");
        return res.json();
      })
      .then((json: CalendarData) => {
        setData(json);
        setBlockedSet(buildBlockedSet(json.blockedDates ?? []));
      })
      .catch(() => {
        toast({
          title: "Error loading calendar",
          description: "Could not fetch car availability.",
          variant: "destructive",
        });
      })
      .finally(() => setLoading(false));
  }, [carId]);

  // A date is disabled if it's in the past OR in the blocked set
  const isDisabled = useCallback(
    (date: Date): boolean => {
      const d = startOfDay(date);
      if (isBefore(d, startOfDay(new Date()))) return true;
      return blockedSet.has(format(d, "yyyy-MM-dd"));
    },
    [blockedSet]
  );

  /**
   * When user selects a range, we must also ensure no day *inside* the
   * range is blocked — react-day-picker only disables the exact cells it
   * knows about, so a user could drag across a blocked middle day.
   */
  const rangeContainsBlockedDay = useCallback(
    (from: Date, to: Date): boolean => {
      const start = startOfDay(from);
      // End of rental = last night, so the "to" date itself is the drop-off morning
      // We check up to (to - 1 day) since "to" is free for the next customer
      const lastOccupied = startOfDay(addDays(to, -1));
      if (lastOccupied < start) return false;
      for (const d of eachDayOfInterval({ start, end: lastOccupied })) {
        if (blockedSet.has(format(d, "yyyy-MM-dd"))) return true;
      }
      return false;
    },
    [blockedSet]
  );

  const handleSelect = (
    range: DateRange | undefined,
    selectedDay: Date
  ) => {
    if (!range) {
      setDate(undefined);
      onRangeSelect(undefined);
      return;
    }

    // If a full range was already selected, and user clicks again, start a fresh selection
    if (date?.from && date?.to && selectedDay) {
      setDate({ from: selectedDay, to: undefined });
      onRangeSelect(undefined);
      return;
    }

    // If only start picked, just store it — let user pick end next
    if (range.from && !range.to) {
      setDate(range);
      onRangeSelect(undefined); // don't propagate until both ends chosen
      return;
    }

    if (range.from && range.to) {
      const days = differenceInCalendarDays(range.to, range.from);

      if (data && days < data.minDays) {
        toast({
          title: "Too short",
          description: `Minimum rental is ${data.minDays} day${data.minDays > 1 ? "s" : ""}.`,
          variant: "destructive",
        });
        // Reset to just the start so user can try again
        setDate({ from: range.from, to: undefined });
        onRangeSelect(undefined);
        return;
      }

      if (data && days > data.maxDays) {
        toast({
          title: "Too long",
          description: `Maximum rental is ${data.maxDays} days.`,
          variant: "destructive",
        });
        setDate({ from: range.from, to: undefined });
        onRangeSelect(undefined);
        return;
      }

      // Check that no day inside the selected range is blocked
      if (rangeContainsBlockedDay(range.from, range.to)) {
        toast({
          title: "Unavailable dates",
          description:
            "Your selection includes unavailable dates. Please choose a different range.",
          variant: "destructive",
        });
        setDate({ from: range.from, to: undefined });
        onRangeSelect(undefined);
        return;
      }

      setDate(range);
      onRangeSelect(range);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[300px] items-center justify-center border rounded-md">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-sm text-destructive border rounded-md p-4 text-center">
        Failed to load availability calendar.
      </div>
    );
  }

  const totalDays =
    date?.from && date?.to
      ? differenceInCalendarDays(date.to, date.from)
      : 0;

  return (
    <Card className="border-2 border-primary/10 shadow-lg">
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-lg">Select Dates</h3>
          <p className="text-sm text-muted-foreground">
            Min: {data.minDays} days · Max: {data.maxDays} days
          </p>
        </div>
        <div className="flex justify-center">
          <Calendar
            mode="range"
            defaultMonth={new Date()}
            selected={date}
            onSelect={handleSelect}
            numberOfMonths={1}
            disabled={isDisabled}
            className="rounded-md border shadow-sm"
          />
        </div>
        <div className="mt-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Rate</span>
            <span className="font-semibold">${pricePerDay}/day</span>
          </div>
          {totalDays > 0 && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="font-medium">Total Days</span>
              <span className="font-bold">{totalDays}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
