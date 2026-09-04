/**
 * Brand mark: a rounded indigo→emerald badge with two overlapping coin
 * rings — an abstract "payment" motif drawn as plain stroked circles (no
 * font glyph involved) so it renders identically everywhere: browsers, the
 * favicon, and rasterized app icons. Keep this in sync with app/icon.svg
 * and scripts/generate-icons.mjs if the mark ever changes.
 */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      className={className}
      aria-hidden="true"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="sedpayroll-logo-gradient" x1="4" y1="4" x2="60" y2="60" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#4f46e5" />
          <stop offset="1" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <rect x="2" y="2" width="60" height="60" rx="16" fill="url(#sedpayroll-logo-gradient)" />
      <g stroke="#ffffff" strokeWidth="4.5" fill="none">
        <circle cx="24" cy="39" r="12" />
        <circle cx="39" cy="24" r="12" />
      </g>
    </svg>
  );
}

export function Logo({
  className,
  iconClassName = "size-7",
}: {
  className?: string;
  iconClassName?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <LogoMark className={iconClassName} />
      <span className="font-semibold tracking-tight">
        <span className="text-muted-foreground font-normal">Sed</span>
        Payroll
      </span>
    </span>
  );
}
