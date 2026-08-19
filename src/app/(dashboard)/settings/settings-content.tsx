"use client";

import { Bell, KeyRound, Mail, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsIndicator, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ChangePasswordForm } from "@/app/change-password/change-password-form";
import { ProfileForm } from "./profile-form";
import { NotificationPreferencesForm } from "./notification-preferences-form";

const ROLE_LABELS: Record<string, string> = {
  "super-admin": "Super administrator",
  "institute-admin": "Institute administrator",
  "institute-staff": "Teacher / staff",
  student: "Student",
};

export function SettingsContent({
  profile,
}: {
  profile: {
    name: string;
    email: string;
    phone: string;
    avatarUrl: string;
    role: string;
    notificationPreferences: { announcements: boolean; billing: boolean; academic: boolean };
    studentMeta?: {
      rollNumber?: string;
      birthday?: Date;
      gender?: string;
      guardianName?: string;
      guardianPhone?: string;
      registrationDate?: Date;
      paymentType?: string;
    } | null;
  };
}) {
  const initials = profile.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "U";
  const roleLabel = ROLE_LABELS[profile.role] ?? profile.role;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div>
        <p className="text-eyebrow text-primary">Account</p>
        <h1 className="text-heading mt-1 text-2xl">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your personal details and account security.</p>
      </div>

      <Card className="bg-[linear-gradient(135deg,color-mix(in_oklch,var(--primary)_10%,var(--card)),var(--card)_48%)]">
        <CardContent className="flex flex-col gap-5 pt-(--card-spacing) sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="size-16 border-4 border-card shadow-panel">
              {profile.avatarUrl ? <AvatarImage src={profile.avatarUrl} alt="" /> : null}
              <AvatarFallback className="bg-primary-subtle text-lg font-bold text-primary">{initials}</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-lg font-bold tracking-tight">{profile.name}</h2>
              <p className="mt-0.5 text-sm text-muted-foreground">{profile.email}</p>
              <Badge className="mt-2 capitalize" variant="secondary">{roleLabel}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm sm:w-[270px]">
            <div className="rounded-xl border border-border/70 bg-card/80 p-3"><Mail className="size-4 text-primary" /><p className="mt-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Email</p><p className="mt-0.5 truncate font-medium">{profile.email}</p></div>
            <div className="rounded-xl border border-border/70 bg-card/80 p-3"><Phone className="size-4 text-primary" /><p className="mt-2 text-[11px] font-semibold tracking-wide text-muted-foreground uppercase">Phone</p><p className="mt-0.5 truncate font-medium">{profile.phone || "Not added"}</p></div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="profile">
        <TabsList className="w-full sm:w-fit">
          <TabsIndicator />
          <TabsTrigger value="profile"><UserRound />Profile</TabsTrigger>
          <TabsTrigger value="notifications"><Bell />Notifications</TabsTrigger>
          <TabsTrigger value="security"><ShieldCheck />Security</TabsTrigger>
        </TabsList>
        <TabsContent value="profile">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_280px]">
            <Card>
              <CardHeader>
                <CardTitle>Personal information</CardTitle>
                <CardDescription>Keep the details your institute uses to identify and contact you up to date.</CardDescription>
              </CardHeader>
              <CardContent><ProfileForm name={profile.name} email={profile.email} phone={profile.phone} avatarUrl={profile.avatarUrl} /></CardContent>
            </Card>
            {profile.role === "student" && profile.studentMeta ? (
              <Card className="h-fit bg-muted/35">
                <CardHeader>
                  <CardTitle className="text-base">Student record</CardTitle>
                  <CardDescription>Institute-managed profile details.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm text-muted-foreground">
                  <p><span className="font-medium text-foreground">Roll number:</span> {profile.studentMeta.rollNumber || "Not assigned"}</p>
                  <p><span className="font-medium text-foreground">Birthday:</span> {profile.studentMeta.birthday ? new Date(profile.studentMeta.birthday).toLocaleDateString() : "Not recorded"}</p>
                  <p><span className="font-medium text-foreground">Gender:</span> {profile.studentMeta.gender ?? "Not recorded"}</p>
                  <p><span className="font-medium text-foreground">Guardian:</span> {profile.studentMeta.guardianName || "Not recorded"}</p>
                  <p><span className="font-medium text-foreground">Guardian phone:</span> {profile.studentMeta.guardianPhone || "Not recorded"}</p>
                  <p><span className="font-medium text-foreground">Registered:</span> {profile.studentMeta.registrationDate ? new Date(profile.studentMeta.registrationDate).toLocaleDateString() : "Not recorded"}</p>
                  <p><span className="font-medium text-foreground">Payment type:</span> {profile.studentMeta.paymentType || "Not recorded"}</p>
                </CardContent>
              </Card>
            ) : null}
          </div>
        </TabsContent>
        <TabsContent value="notifications"><Card><CardHeader><CardTitle>Notification preferences</CardTitle><CardDescription>Choose the updates you want to receive in LearningMS. Essential account-security messages are always delivered.</CardDescription></CardHeader><CardContent><NotificationPreferencesForm preferences={profile.notificationPreferences} /></CardContent></Card></TabsContent>
        <TabsContent value="security">
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
            <Card>
              <CardHeader><CardTitle>Change password</CardTitle><CardDescription>Choose a strong, unique password you do not use elsewhere.</CardDescription></CardHeader>
              <CardContent><ChangePasswordForm /></CardContent>
            </Card>
            <Card className="h-fit bg-muted/35">
              <CardHeader><KeyRound className="size-5 text-primary" /><CardTitle className="mt-2 text-base">Security tip</CardTitle></CardHeader>
              <CardContent className="text-sm leading-relaxed text-muted-foreground">Use a long password with a mix of words, numbers, and symbols. Never share it with anyone.</CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
