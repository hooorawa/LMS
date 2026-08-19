import { AuthCard } from "@/components/auth/auth-card";
import { ChangePasswordForm } from "./change-password-form";

export default function ChangePasswordPage() {
  return (
    <AuthCard
      title="Set a new password"
      description="You'll use this the next time you sign in"
    >
      <ChangePasswordForm />
    </AuthCard>
  );
}
