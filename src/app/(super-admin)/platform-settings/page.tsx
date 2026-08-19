import { requireSession, requireRole } from "@/lib/tenant/scope";
import { getSystemSettings } from "@/lib/data/system-settings.data";
import { Building2, Headphones, Palette } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/dashboard-shell/stat-card";
import { PlatformSettingsForm } from "./platform-settings-form";

export default async function PlatformSettingsPage() {
  const session = await requireSession();
  requireRole(session, ["super-admin"]);

  const settings = await getSystemSettings();

  return (
    <div className="flex w-full flex-col gap-6">
      <div className="relative overflow-hidden rounded-[28px] border border-primary/15 bg-[linear-gradient(120deg,color-mix(in_oklch,var(--primary),transparent_91%),transparent_55%),var(--card)] px-5 py-6 sm:px-7 sm:py-8">
        <div className="absolute -top-16 -right-10 size-56 rounded-full bg-primary/10 blur-3xl" />
        <div className="relative max-w-2xl"><p className="text-eyebrow text-primary">Platform controls</p><h1 className="text-heading mt-2 text-3xl">Make the platform feel like yours.</h1><p className="mt-2 text-sm leading-6 text-muted-foreground">Set the identity, support handoff, onboarding defaults, and public policy copy used across the product.</p></div>
      </div>

      <div className="grid gap-4 md:grid-cols-3"><StatCard label="Platform identity" icon={Building2} value={settings.systemName} sub={settings.tagline || "No tagline configured"} tone="primary" /><StatCard label="Support channel" icon={Headphones} value={settings.supportEmail || "Not set"} sub="Shown for platform assistance" tone="info" /><StatCard label="Default trial" icon={Palette} value={`${settings.defaultTrialDays} days`} sub="Applied to new institute trials" tone="success" /></div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Card>
          <CardHeader>
            <CardTitle>Platform configuration</CardTitle>
            <p className="text-sm text-muted-foreground">Changes are recorded in the audit log and affect new platform interactions immediately.</p>
          </CardHeader>
          <CardContent>
            <PlatformSettingsForm settings={settings} />
          </CardContent>
        </Card>
        <Card className="h-fit">
          <CardHeader><CardTitle>Current preview</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div className="rounded-2xl border border-border/70 p-4" style={{ borderTopColor: settings.primaryColor || undefined, borderTopWidth: 4 }}>
              <div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-xl text-sm font-bold text-white" style={{ backgroundColor: settings.primaryColor || "var(--primary)" }}>{settings.systemName.slice(0, 2).toUpperCase()}</div><div><p className="font-semibold">{settings.systemName}</p><p className="text-xs text-muted-foreground">{settings.tagline || "Your learning platform"}</p></div></div>
              <div className="mt-5 rounded-xl bg-muted/60 p-3 text-sm"><p className="font-medium">Need help?</p><p className="mt-1 text-xs text-muted-foreground">{settings.supportEmail || "Configure a support email to guide institutes and learners."}</p></div>
            </div>
            <p className="text-xs leading-5 text-muted-foreground">The preview reflects saved settings. Save the form to refresh it with your latest changes.</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
