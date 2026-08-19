import { LayoutGrid } from "lucide-react";
import { cn } from "@/lib/utils";
import { AuthHeroIllustration } from "./auth-hero-illustration";

export const AUTH_CARD_WRAPPER_CLASS =
  "grid h-dvh overflow-hidden bg-background min-[920px]:grid-cols-[1.02fr_1fr]";

export const AUTH_HERO_PANEL_CLASS =
  "relative flex min-h-[420px] overflow-hidden bg-[#060914] text-slate-50 max-[560px]:min-h-0";

export const AUTH_FORM_COLUMN_CLASS = "flex items-center justify-center p-6 sm:p-10 max-[560px]:p-4";

export const AUTH_CARD_CLASS = "w-full max-w-md";

export function AuthCardBackdrop() {
  return (
    <>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)] lg:bg-[radial-gradient(ellipse_50%_40%_at_100%_0%,color-mix(in_oklch,var(--primary)_8%,transparent),transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(var(--foreground)_1px,transparent_1px),linear-gradient(90deg,var(--foreground)_1px,transparent_1px)] [background-size:32px_32px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 hidden h-72 w-72 -translate-x-1/3 translate-y-1/3 rounded-full bg-[color-mix(in_oklch,var(--primary)_10%,transparent)] blur-3xl lg:block"
      />
    </>
  );
}

export function AuthHeroPanel() {
  return (
    <div className={AUTH_HERO_PANEL_CLASS}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(135deg,rgba(6,9,20,.9)_0%,rgba(6,9,20,.68)_52%,rgba(6,9,20,.44)_100%),radial-gradient(ellipse_at_25%_30%,rgba(37,99,235,.48),transparent_38%),radial-gradient(ellipse_at_78%_28%,rgba(245,158,11,.22),transparent_30%),linear-gradient(120deg,#101827_0%,#24374d_44%,#758a9d_100%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-20 [background-image:radial-gradient(rgba(255,255,255,.7)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:linear-gradient(to_bottom,black,transparent_65%)]"
      />
      <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-8 min-[920px]:h-full min-[920px]:p-[clamp(2.5rem,5vw,3.4rem)] max-[560px]:min-h-0 max-[560px]:justify-start max-[560px]:p-5">
        <div className="hidden min-[920px]:flex min-[920px]:justify-end">
          <div className="w-full max-w-[430px] opacity-95">
            <AuthHeroIllustration />
          </div>
        </div>

        <div>
          <span className="inline-flex w-fit rounded-full border border-white/20 bg-white/10 px-4 py-2 text-[11px] font-extrabold tracking-[0.1em] text-slate-50 uppercase backdrop-blur-sm max-[560px]:px-3 max-[560px]:py-1.5 max-[560px]:text-[10px]">
            Institute operations, simplified
          </span>
          <h2 className="mt-5 max-w-md text-[34px] font-bold leading-none tracking-tight text-slate-50 min-[920px]:text-[44px] max-[560px]:mt-3 max-[560px]:text-2xl">
            A calmer, smarter place to run <span className="text-amber-400">teaching and learning.</span>
          </h2>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-slate-200/75 max-[560px]:hidden">
            Keep classes, finance, communication, and student progress in one professional workspace.
          </p>
          <div className="mt-7 flex max-w-sm gap-3.5 max-[560px]:hidden">
            <span className="w-[3px] shrink-0 rounded-full bg-gradient-to-b from-amber-400 to-amber-600" />
            <div>
              <strong className="block text-sm text-slate-50">Built for real institute workflows</strong>
              <span className="mt-1 block text-[13px] leading-relaxed text-slate-200/70">
                Move from planning to action with less friction for admins, staff, and students.
              </span>
            </div>
          </div>
          <div className="mt-9 flex flex-wrap gap-x-8 gap-y-4 max-[560px]:hidden">
            {["Courses", "Operations", "Progress"].map((label) => (
              <div key={label} className="flex flex-col gap-1">
                <span className="text-xl font-extrabold tracking-tight text-amber-400">-</span>
                <span className="text-[10px] font-bold tracking-[0.1em] text-slate-200/60 uppercase">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function AuthCard({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <main className={AUTH_CARD_WRAPPER_CLASS}>
      <AuthHeroPanel />
      <div className={cn("relative", AUTH_FORM_COLUMN_CLASS)}>
        <AuthCardBackdrop />
        <div
          className={cn(
            "surface-subtle shadow-panel-hover relative rounded-[28px] border border-border/70 border-t-[3px] border-t-primary bg-card/95 p-6 backdrop-blur-sm sm:p-7",
            AUTH_CARD_CLASS
          )}
        >
          <div className="flex flex-col gap-3 pb-7">
            <div className="flex items-center gap-2.5">
              <div className="flex size-10 items-center justify-center rounded-(--radius-icon) bg-primary shadow-button">
                <LayoutGrid className="size-5 text-primary-foreground" />
              </div>
              <span className="text-[17px] font-bold tracking-tight text-foreground">RaxwoLMS</span>
            </div>
            <div>
              <p className="text-[12.5px] font-semibold uppercase tracking-wide text-primary">
                Welcome back
              </p>
              <h1 className="text-heading mt-1 text-[22px]">{title}</h1>
              {description ? (
                <p className="mt-1.5 text-[13.5px] text-muted-foreground">{description}</p>
              ) : null}
            </div>
          </div>
          <div>{children}</div>
          <p className="mt-6 text-[12.5px] text-muted-foreground">
            Trouble signing in? Contact your institute administrator for help.
          </p>
        </div>
      </div>
    </main>
  );
}
