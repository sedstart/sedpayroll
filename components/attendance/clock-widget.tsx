"use client";

import { useActionState } from "react";
import { Clock, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  clockInAction,
  clockOutAction,
  type AttendanceActionState,
} from "@/lib/actions/attendance";
import { formatTime } from "@/lib/format";

export function ClockWidget({
  clockIn,
  clockOut,
}: {
  clockIn: Date | null;
  clockOut: Date | null;
}) {
  const [clockInState, clockInFormAction, isClockingIn] = useActionState<
    AttendanceActionState,
    FormData
  >(clockInAction, undefined);
  const [clockOutState, clockOutFormAction, isClockingOut] = useActionState<
    AttendanceActionState,
    FormData
  >(clockOutAction, undefined);

  const error = clockInState?.error ?? clockOutState?.error;

  return (
    <div
      data-testid="clock-widget"
      className="flex flex-col gap-4 rounded-lg border bg-card p-6"
    >
      <div className="flex items-center gap-3">
        <Clock className="size-6 text-primary" aria-hidden="true" />
        <div>
          <p className="text-sm text-muted-foreground">Today&apos;s status</p>
          <p
            data-testid="clock-status-text"
            className="text-lg font-semibold"
          >
            {!clockIn
              ? "Not clocked in"
              : !clockOut
                ? `Clocked in at ${formatTime(clockIn)}`
                : `Worked ${formatTime(clockIn)} – ${formatTime(clockOut)}`}
          </p>
        </div>
      </div>

      {error ? (
        <p role="alert" data-testid="clock-widget-error" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex gap-3">
        <form action={clockInFormAction}>
          <Button
            type="submit"
            disabled={!!clockIn || isClockingIn}
            data-testid="clock-in-button"
          >
            <LogIn className="size-4" aria-hidden="true" />
            Clock in
          </Button>
        </form>
        <form action={clockOutFormAction}>
          <Button
            type="submit"
            variant="outline"
            disabled={!clockIn || !!clockOut || isClockingOut}
            data-testid="clock-out-button"
          >
            <LogOut className="size-4" aria-hidden="true" />
            Clock out
          </Button>
        </form>
      </div>
    </div>
  );
}
