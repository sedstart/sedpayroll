import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { LoginForm } from "@/components/auth/login-form";
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
    <div className="flex flex-1 items-center justify-center p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">SedPayroll</CardTitle>
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
  );
}
