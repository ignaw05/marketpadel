import { X, MapPin, MessageCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Paleta, formatPrecio, estadoLabel } from "../data";

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[14px] p-3" style={{ background: "#F2F1ED" }}>
      <p className="text-[12px]" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="mt-0.5 text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
        {value}
      </p>
    </div>
  );
}

export function DetailModal({
  paleta,
  onClose,
}: {
  paleta: Paleta | null;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {paleta && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-6"
          style={{ background: "rgba(20,23,26,0.4)" }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className="relative flex max-h-[92vh] w-full flex-col overflow-hidden bg-white sm:max-w-[560px] sm:rounded-[14px]"
            style={{
              borderRadius: "14px 14px 0 0",
              boxShadow: "0 20px 50px rgba(0,0,0,0.18)",
            }}
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 320 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={onClose}
              className="absolute right-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full"
              style={{ background: "rgba(255,255,255,0.9)", color: "#14171A" }}
            >
              <X size={18} />
            </button>

            <div className="overflow-y-auto">
              <div className="relative" style={{ background: "#F2F1ED", aspectRatio: "4 / 3" }}>
                <ImageWithFallback
                  src={paleta.imagen}
                  alt={`${paleta.marca} ${paleta.modelo}`}
                  className="h-full w-full object-cover"
                />
              </div>

              <div className="p-5">
                <p className="text-[13px]" style={{ color: "#6B7280" }}>
                  {paleta.marca}
                </p>
                <h2 style={{ color: "#14171A", fontWeight: 700, fontSize: 22 }}>
                  {paleta.modelo}
                </h2>
                <p className="mt-1 text-[26px]" style={{ color: "#0F5132", fontWeight: 800 }}>
                  {formatPrecio(paleta.precio)}
                </p>

                <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  <Spec label="Estado" value={`${paleta.estado}/10 · ${estadoLabel(paleta.estado)}`} />
                  <Spec label="Forma" value={paleta.forma} />
                  <Spec label="Año" value={String(paleta.anio)} />
                  <Spec label="Ubicación" value={paleta.ubicacion} />
                </div>

                <p className="mt-4 text-[15px]" style={{ color: "#14171A", lineHeight: 1.6 }}>
                  {paleta.descripcion}
                </p>

                <div
                  className="mt-5 flex items-center gap-3 rounded-[14px] p-3"
                  style={{ background: "#FAFAF8", border: "1px solid #E6E4DF" }}
                >
                  <div
                    className="flex h-11 w-11 items-center justify-center rounded-full text-white"
                    style={{ background: "#0F5132", fontWeight: 700 }}
                  >
                    {paleta.vendedor.nombre[0]}
                    {paleta.vendedor.apellido[0]}
                  </div>
                  <div>
                    <p className="text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
                      {paleta.vendedor.nombre} {paleta.vendedor.apellido}
                    </p>
                    <p className="text-[12px]" style={{ color: "#6B7280" }}>
                      Miembro desde {paleta.vendedor.miembroDesde}
                    </p>
                  </div>
                  <p className="ml-auto flex items-center gap-1 text-[12px]" style={{ color: "#6B7280" }}>
                    <MapPin size={12} /> {paleta.ubicacion}
                  </p>
                </div>
              </div>
            </div>

            {/* CTA WhatsApp */}
            <div className="p-4" style={{ borderTop: "1px solid #E6E4DF", background: "#FFFFFF" }}>
              <a
                href={`https://wa.me/?text=${encodeURIComponent(
                  `Hola! Me interesa tu ${paleta.marca} ${paleta.modelo} publicada en PaletaMarket.`,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="flex w-full items-center justify-center gap-2 rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90"
                style={{ background: "#25D366", fontWeight: 700 }}
              >
                <MessageCircle size={19} /> Contactar por WhatsApp
              </a>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
