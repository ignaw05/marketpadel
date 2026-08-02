export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <span
        className="flex items-center justify-center rounded-[10px]"
        style={{ width: 32, height: 32, background: "#0F5132" }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
          <ellipse cx="12" cy="9" rx="7" ry="8" fill="#C7F751" />
          <circle cx="9.5" cy="7" r="1.1" fill="#0F5132" />
          <circle cx="13" cy="6.5" r="1.1" fill="#0F5132" />
          <circle cx="11" cy="10" r="1.1" fill="#0F5132" />
          <circle cx="14.5" cy="9.5" r="1.1" fill="#0F5132" />
          <rect x="11" y="16" width="2" height="6" rx="1" fill="#C7F751" />
        </svg>
      </span>
      <span
        style={{ color: "#14171A", fontWeight: 800, letterSpacing: "-0.02em" }}
      >
        Paleta<span style={{ color: "#0F5132" }}>Market</span>
      </span>
    </div>
  );
}
