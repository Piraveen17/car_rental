"use client"
import { format, isBefore, startOfDay } from "date-fns"
import { Calendar } from "@/components/ui/calendar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { DateRange } from "react-day-picker"
import type { Booking } from "@/types"

interface BookingCalendarProps {
  bookedDates: Booking[]
  pricePerDay: number
  onDateSelect: (range: DateRange | undefined) => void
  selectedRange?: DateRange
}

export function BookingCalendar({ bookedDates, pricePerDay, onDateSelect, selectedRange }: BookingCalendarProps) {
  const today = startOfDay(new Date())

  const isDateBooked = (date: Date) => {
    return bookedDates.some((booking) => {
      if (booking.bookingStatus === "cancelled") return false
      const start = startOfDay(new Date(booking.startDate))
      const end = startOfDay(new Date(booking.endDate))
      return date >= start && date <= end
    })
  }

  const isDateDisabled = (date: Date) => {
    return isBefore(date, today) || isDateBooked(date)
  }

  const calculateDays = () => {
    if (!selectedRange?.from || !selectedRange?.to) return 0
    const diffTime = Math.abs(selectedRange.to.getTime() - selectedRange.from.getTime())
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }

  const totalDays = calculateDays()
  const totalAmount = totalDays * pricePerDay

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Rental Period</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Calendar
          mode="range"
          selected={selectedRange}
          onSelect={onDateSelect}
          disabled={isDateDisabled}
          numberOfMonths={1}
          className="rounded-md border"
        />

        {selectedRange?.from && selectedRange?.to && (
          <div className="space-y-2 pt-4 border-t">
            <div className="flex justify-between text-sm">
              <span>Pick-up:</span>
              <span className="font-medium">{format(selectedRange.from, "PPP")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Drop-off:</span>
              <span className="font-medium">{format(selectedRange.to, "PPP")}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Duration:</span>
              <span className="font-medium">{totalDays} days</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Rate:</span>
              <span className="font-medium">${pricePerDay}/day</span>
            </div>
            <div className="flex justify-between text-lg font-bold pt-2 border-t">
              <span>Total:</span>
              <span className="text-primary">${totalAmount}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
