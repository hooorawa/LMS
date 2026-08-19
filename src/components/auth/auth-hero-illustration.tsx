export function AuthHeroIllustration() {
  return (
    <svg
      viewBox="0 0 480 380"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="h-auto w-full max-w-[420px]"
      aria-hidden="true"
    >
      <defs>
        <linearGradient id="hero-card" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="var(--sidebar-foreground)" stopOpacity="0.14" />
          <stop offset="100%" stopColor="var(--sidebar-foreground)" stopOpacity="0.04" />
        </linearGradient>
        <linearGradient id="hero-accent" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--sidebar-primary-foreground)" stopOpacity="0.95" />
          <stop offset="100%" stopColor="var(--sidebar-primary-foreground)" stopOpacity="0.55" />
        </linearGradient>
      </defs>

      {/* Soft ambient glow */}
      <circle cx="240" cy="190" r="170" fill="var(--sidebar-primary-foreground)" opacity="0.05" />

      {/* Main app window */}
      <g filter="drop-shadow(0 24px 48px rgba(0,0,0,0.18))">
        <rect x="60" y="46" width="330" height="230" rx="18" fill="url(#hero-card)" />
        <rect
          x="60.5"
          y="46.5"
          width="329"
          height="229"
          rx="17.5"
          stroke="var(--sidebar-foreground)"
          strokeOpacity="0.12"
        />

        {/* Window chrome dots */}
        <circle cx="82" cy="68" r="4" fill="var(--sidebar-foreground)" fillOpacity="0.25" />
        <circle cx="96" cy="68" r="4" fill="var(--sidebar-foreground)" fillOpacity="0.18" />
        <circle cx="110" cy="68" r="4" fill="var(--sidebar-foreground)" fillOpacity="0.12" />

        {/* Bar chart panel */}
        <rect x="82" y="92" width="140" height="94" rx="10" fill="var(--sidebar-foreground)" fillOpacity="0.06" />
        <rect x="98" y="140" width="14" height="34" rx="3" fill="var(--sidebar-primary-foreground)" fillOpacity="0.9" />
        <rect x="120" y="122" width="14" height="52" rx="3" fill="var(--sidebar-primary-foreground)" fillOpacity="0.65" />
        <rect x="142" y="152" width="14" height="22" rx="3" fill="var(--sidebar-primary-foreground)" fillOpacity="0.4" />
        <rect x="164" y="108" width="14" height="66" rx="3" fill="var(--sidebar-primary-foreground)" fillOpacity="0.9" />
        <rect x="186" y="132" width="14" height="42" rx="3" fill="var(--sidebar-primary-foreground)" fillOpacity="0.5" />

        {/* Checklist panel */}
        <rect x="234" y="92" width="134" height="94" rx="10" fill="var(--sidebar-foreground)" fillOpacity="0.06" />
        {[0, 1, 2, 3].map((i) => (
          <g key={i} transform={`translate(250 ${110 + i * 20})`}>
            <rect width="16" height="16" rx="5" fill="var(--sidebar-primary-foreground)" fillOpacity={i < 3 ? 0.85 : 0.15} />
            {i < 3 ? (
              <path
                d="M4 8.5L7 11.5L12.5 5"
                stroke="var(--sidebar)"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null}
            <rect x="26" y="4" width="82" height="7" rx="3.5" fill="var(--sidebar-foreground)" fillOpacity="0.16" />
          </g>
        ))}

        {/* Footer progress row */}
        <rect x="82" y="204" width="286" height="48" rx="10" fill="var(--sidebar-foreground)" fillOpacity="0.06" />
        <circle cx="106" cy="228" r="14" fill="none" stroke="var(--sidebar-foreground)" strokeOpacity="0.15" strokeWidth="4" />
        <path
          d="M106 214a14 14 0 1 1-9.9 4.1"
          fill="none"
          stroke="var(--sidebar-primary-foreground)"
          strokeWidth="4"
          strokeLinecap="round"
        />
        <rect x="132" y="219" width="150" height="7" rx="3.5" fill="var(--sidebar-foreground)" fillOpacity="0.18" />
        <rect x="132" y="232" width="100" height="6" rx="3" fill="var(--sidebar-foreground)" fillOpacity="0.1" />
      </g>

      {/* Floating grad-cap badge */}
      <g filter="drop-shadow(0 12px 20px rgba(0,0,0,0.22))">
        <circle cx="378" cy="60" r="34" fill="var(--sidebar-primary-foreground)" />
        <path
          d="M378 46l22 9-22 9-22-9 22-9z"
          fill="var(--sidebar)"
        />
        <path
          d="M366 58v10c0 3.3 5.4 6 12 6s12-2.7 12-6V58"
          stroke="var(--sidebar)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <path d="M400 55v10" stroke="var(--sidebar)" strokeWidth="2" strokeLinecap="round" />
      </g>

      {/* Floating fee/receipt badge */}
      <g filter="drop-shadow(0 10px 18px rgba(0,0,0,0.2))">
        <rect x="34" y="240" width="64" height="64" rx="16" fill="var(--sidebar-foreground)" fillOpacity="0.9" />
        <path
          d="M56 258h20M56 268h20M56 278h12"
          stroke="var(--sidebar)"
          strokeWidth="2.4"
          strokeLinecap="round"
        />
      </g>
    </svg>
  );
}
