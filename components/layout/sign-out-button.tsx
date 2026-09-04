"use client";

import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton() {
  return (
    <form action={signOutAction}>
      <Button
        type="submit"
        variant="ghost"
        size="sm"
        className="text-muted-foreground"
        data-testid="sign-out-button"
        aria-label="Sign out"
      >
        <LogOut className="size-4" aria-hidden="true" />
        Sign out
      </Button>
    </form>
  );
}
