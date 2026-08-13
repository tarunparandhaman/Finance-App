/**
 * Shared artwork for the favicon / apple-icon / PWA icons so the mark stays
 * identical everywhere. Plain divs only — Satori (next/og) doesn't support SVG
 * children or CSS shorthand the way a browser does.
 */
export function BrandIconArt({ size }: { size: number }) {
  const bar = (heightRatio: number, opacity: number) => (
    <div
      style={{
        width: size * 0.125,
        height: size * heightRatio,
        borderRadius: size * 0.045,
        background: "#ffffff",
        opacity,
      }}
    />
  );

  return (
    <div
      style={{
        width: size,
        height: size,
        background: "#0f766e",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "center",
        gap: size * 0.062,
        paddingBottom: size * 0.25,
      }}
    >
      {bar(0.195, 0.55)}
      {bar(0.335, 0.8)}
      {bar(0.5, 1)}
    </div>
  );
}
