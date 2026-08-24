/**
 * Aurora backdrop (ReactBits "Aurora" pattern, CSS-only): slow drifting
 * blurred color blobs behind the hero, clipped by the section.
 */
export function Aurora() {
  return (
    <div aria-hidden="true" className="absolute inset-0 overflow-hidden">
      <div
        className="aurora-blob left-1/2 top-[-160px] h-[380px] w-[640px] -translate-x-1/2 bg-primary/20"
        style={{ animationDelay: "0s" }}
      />
      <div
        className="aurora-blob left-[12%] top-[40px] h-[280px] w-[280px] bg-[#57c1ff]/10"
        style={{ animationDelay: "-5s" }}
      />
      <div
        className="aurora-blob right-[10%] top-[110px] h-[300px] w-[320px] bg-primary/10"
        style={{ animationDelay: "-9s" }}
      />
      {/* Fade the aurora into the canvas */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-background" />
    </div>
  );
}
