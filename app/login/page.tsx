import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
import { LogoMark } from "@/components/layout/logo";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default async function LoginPage() {
  const session = await auth();
  if (session?.user) redirect("/");

  return (
    <div
      className="flex flex-1 items-center justify-center p-4"
      style={{
        backgroundImage:
          "radial-gradient(circle at 15% 20%, color-mix(in oklch, var(--primary) 10%, transparent), transparent 45%), radial-gradient(circle at 85% 85%, color-mix(in oklch, var(--success) 10%, transparent), transparent 45%)",
      }}
    >
      <div className="w-full max-w-sm space-y-6">
        <div className="flex flex-col items-center gap-3 text-center">
          <LogoMark className="size-14" />
          <div>
            <h1 className="text-xl font-semibold tracking-tight">SedPayroll</h1>
            <p className="text-sm text-muted-foreground">
              Payroll, attendance and employee management
            </p>
          </div>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Sign in with your work email to continue.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <LoginForm />
            <div className="rounded-md border bg-muted/50 p-3 text-xs text-muted-foreground">
              <p className="font-medium">Demo credentials</p>
              <p>Admin: neha.iyer@sedpayroll.com / Admin@123</p>
              <p>Employee: aditi.sharma@sedpayroll.com / Employee@123</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
