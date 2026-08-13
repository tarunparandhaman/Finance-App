/**
 * Three stacked bars of increasing height inside a rounded square — reads as
 * accumulation/growth, which is what a "corpus" is.
 */
export default function Logo({ size = 36 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 36 36"
      fill="none"
      aria-hidden="true"
      className="shrink-0"
    >
      <rect width="36" height="36" rx="10" className="fill-primary" />
      <rect x="9" y="20" width="4.5" height="7" rx="1.6" fill="var(--primary-ink)" opacity="0.55" />
      <rect x="15.75" y="15" width="4.5" height="12" rx="1.6" fill="var(--primary-ink)" opacity="0.8" />
      <rect x="22.5" y="9" width="4.5" height="18" rx="1.6" fill="var(--primary-ink)" />
    </svg>
  );
}
