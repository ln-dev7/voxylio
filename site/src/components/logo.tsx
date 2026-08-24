/** Brand mark: green disc with a speaker glyph, shared with the extension icon. */
export function Logo({ size = 28 }: { size?: number }) {
  return (
    <span
      className="grid shrink-0 place-items-center rounded-full bg-primary"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      <svg
        width={size * 0.5}
        height={size * 0.5}
        viewBox="0 0 16 16"
        fill="none"
      >
        <path d="M2.5 6.5v3h2.4L8.5 12V4L4.9 6.5H2.5z" fill="#071008" />
        <path
          d="M10.5 5.5a3.4 3.4 0 010 5M12.3 4a5.8 5.8 0 010 8"
          stroke="#071008"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
