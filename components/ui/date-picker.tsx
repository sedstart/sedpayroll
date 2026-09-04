"use client"

import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

function parseISODate(value?: string | null) {
  if (!value) return undefined
  // Force local-midnight parsing so the picker never drifts a day off in
  // timezones behind UTC (new Date("yyyy-MM-dd") parses as UTC midnight).
  const date = new Date(`${value}T00:00:00`)
  return Number.isNaN(date.getTime()) ? undefined : date
}

function toISODate(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

function formatDisplay(date: Date) {
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  })
}

/**
 * A shadcn-style date picker that still participates in native <form>
 * Server Action submissions: it renders a hidden `name`d input carrying the
 * ISO (yyyy-MM-dd) value, same as a native `<input type="date">` would.
 */
export function DatePicker({
  name,
  id,
  defaultValue,
  placeholder = "Pick a date",
  required,
  disabled,
  className,
  "data-testid": dataTestId,
  "aria-invalid": ariaInvalid,
  "aria-describedby": ariaDescribedBy,
}: {
  name: string
  id?: string
  defaultValue?: string | null
  placeholder?: string
  required?: boolean
  disabled?: boolean
  className?: string
  "data-testid"?: string
  "aria-invalid"?: boolean
  "aria-describedby"?: string
}) {
  const [date, setDate] = React.useState<Date | undefined>(() =>
    parseISODate(defaultValue)
  )
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <input
        type="hidden"
        name={name}
        value={date ? toISODate(date) : ""}
        required={required}
        data-testid={dataTestId}
      />
      <PopoverTrigger
        render={
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            aria-invalid={ariaInvalid}
            aria-describedby={ariaDescribedBy}
            className={cn(
              "w-full justify-start font-normal",
              !date && "text-muted-foreground",
              className
            )}
          >
            <CalendarIcon className="size-4" aria-hidden="true" />
            {date ? formatDisplay(date) : placeholder}
          </Button>
        }
      />
      <PopoverContent className="w-auto p-0">
        <Calendar
          mode="single"
          selected={date}
          defaultMonth={date}
          captionLayout="dropdown"
          onSelect={(selected) => {
            setDate(selected);
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
