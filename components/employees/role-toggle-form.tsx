"use client";

import { useActionState } from "react";
import { ShieldCheck, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  setEmployeeRoleAction,
  type RoleActionState,
} from "@/lib/actions/employees";

export function RoleToggleForm({
  employeeId,
  role,
  disabled,
}: {
  employeeId: number;
  role: "admin" | "employee";
  disabled?: boolean;
}) {
  const nextRole = role === "admin" ? "employee" : "admin";
  const boundAction = setEmployeeRoleAction.bind(null, employeeId, nextRole);
  const [state, formAction, isPending] = useActionState<
    RoleActionState,
    FormData
  >(async () => boundAction(), undefined);

  return (
    <form action={formAction} data-testid="role-toggle-form">
      <Button
        type="submit"
        variant={role === "admin" ? "outline" : "default"}
        size="sm"
        disabled={disabled || isPending}
        data-testid="role-toggle-button"
        aria-label={
          role === "admin" ? "Remove admin access" : "Grant admin access"
        }
      >
        {role === "admin" ? (
          <ShieldOff className="size-4" aria-hidden="true" />
        ) : (
          <ShieldCheck className="size-4" aria-hidden="true" />
        )}
        {role === "admin" ? "Remove admin access" : "Grant admin access"}
      </Button>
      {state?.error ? (
        <p
          role="alert"
          data-testid="role-toggle-error"
          className="mt-2 text-xs text-destructive"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
