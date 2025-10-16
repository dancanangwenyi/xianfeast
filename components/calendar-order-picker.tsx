"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

interface CalendarOrderPickerProps {
  selectedDate: Date | null
  onDateSelect: (date: Date) => void
  minDate?: Date
  maxDate?: Date
  disabledDates?: Date[]
}

export function CalendarOrderPicker({
  selectedDate,
  onDateSelect,
  minDate,
  maxDate,
  disabledDates = [],
}: CalendarOrderPickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date())

  const daysInMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
  const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1).getDay()

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))
  }

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))
  }

  const isDateDisabled = (date: Date) => {
    if (minDate && date < minDate) return true
    if (maxDate && date > maxDate) return true
    return disabledDates.some((d) => d.toDateString() === date.toDateString())
  }

  const isDateSelected = (date: Date) => {
    return selectedDate?.toDateString() === date.toDateString()
  }

  const monthNames = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ]

  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <Card className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <Button variant="ghost" size="icon" onClick={previousMonth}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-semibold">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button variant="ghost" size="icon" onClick={nextMonth}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {dayNames.map((day) => (
          <div key={day} className="text-center text-sm font-medium text-muted-foreground">
            {day}
          </div>
        ))}

        {Array.from({ length: firstDayOfMonth }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, i) => {
          const day = i + 1
          const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
          const disabled = isDateDisabled(date)
          const selected = isDateSelected(date)

          return (
            <button
              key={day}
              type="button"
              onClick={() => !disabled && onDateSelect(date)}
              disabled={disabled}
              className={cn(
                "aspect-square rounded-md text-sm transition-colors",
                disabled && "cursor-not-allowed text-muted-foreground opacity-50",
                !disabled && !selected && "hover:bg-accent",
                selected && "bg-primary text-primary-foreground hover:bg-primary/90",
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </Card>
  )
}
