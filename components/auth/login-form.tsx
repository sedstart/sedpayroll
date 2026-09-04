"use client";

import { useActionState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction, type LoginState } from "@/app/login/actions";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState<LoginState, FormData>(
    loginAction,
    undefined
  );

  return (
    <form
      action={formAction}
      data-testid="login-form"
      aria-busy={isPending}
      className="space-y-4"
    >
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          placeholder="you@sedpayroll.com"
          required
          autoComplete="username"
          data-testid="login-email-input"
          aria-invalid={!!state?.error}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          name="password"
          type="password"
          placeholder="••••••••"
          required
          autoComplete="current-password"
          data-testid="login-password-input"
          aria-invalid={!!state?.error}
          aria-describedby={state?.error ? "login-error" : undefined}
        />
      </div>
      {state?.error ? (
        <p
          id="login-error"
          role="alert"
          data-testid="login-error"
          className="text-sm font-medium text-destructive"
        >
          {state.error}
        </p>
      ) : null}
      <Button
        type="submit"
        className="w-full"
        disabled={isPending}
        data-testid="login-submit-button"
      >
        {isPending ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : null}
        Sign in
      </Button>
    </form>
  );
}
