import Image from "next/image";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Image
        src="/logo.png"
        alt=""
        width={32}
        height={32}
        className="rounded-[10px]"
        priority
      />
      <span
        style={{ color: "#14171A", fontWeight: 800, letterSpacing: "-0.02em" }}
      >
        Paletita
      </span>
    </div>
  );
}
