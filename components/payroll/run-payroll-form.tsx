"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { runPayrollAction, type PayrollActionState } from "@/lib/actions/payroll";
import { MONTH_NAMES } from "@/lib/format";

export function RunPayrollForm() {
  const [state, formAction, isPending] = useActionState<
    PayrollActionState,
    FormData
  >(runPayrollAction, undefined);

  const now = new Date();
  const years = [now.getFullYear(), now.getFullYear() - 1];

  return (
    <form
      action={formAction}
      data-testid="run-payroll-form"
      aria-label="Run payroll for a month"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="space-y-2">
        <label
          htmlFor="payroll-month"
          className="text-sm font-medium leading-none"
        >
          Month
        </label>
        <Select name="month" defaultValue={String(now.getMonth() + 1)}>
          <SelectTrigger id="payroll-month" data-testid="payroll-month-select" className="w-40">
            <SelectValue placeholder="Month" />
          </SelectTrigger>
          <SelectContent>
            {MONTH_NAMES.map((name, index) => (
              <SelectItem key={name} value={String(index + 1)}>
                {name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <label
          htmlFor="payroll-year"
          className="text-sm font-medium leading-none"
        >
          Year
        </label>
        <Select name="year" defaultValue={String(now.getFullYear())}>
          <SelectTrigger id="payroll-year" data-testid="payroll-year-select" className="w-28">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={String(year)}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Button type="submit" disabled={isPending} data-testid="run-payroll-submit">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Run payroll
      </Button>
      {state?.error ? (
        <p role="alert" data-testid="run-payroll-error" className="w-full text-sm text-destructive">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
