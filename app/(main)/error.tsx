"use client";

import { useEffect } from "react";
import { AlertTriangle, RotateCw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-[560px] flex-col items-center px-4 py-24 text-center">
      <div
        className="flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: "#F2F1ED" }}
      >
        <AlertTriangle size={28} style={{ color: "#D4183D" }} aria-hidden />
      </div>
      <h1 className="mt-4 text-[18px]" style={{ color: "#14171A", fontWeight: 700 }}>
        Se nos cayó la red
      </h1>
      <p className="mt-1.5 text-[14px]" style={{ color: "#5B6470" }}>
        No pudimos cargar esta pantalla. Puede ser un problema momentáneo de conexión.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-5 flex min-h-[44px] items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
      >
        <RotateCw size={16} aria-hidden /> Reintentar
      </button>
    </div>
  );
}
