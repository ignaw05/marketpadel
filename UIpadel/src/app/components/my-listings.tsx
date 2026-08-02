import { useState } from "react";
import { MoreVertical, Pencil, PauseCircle, PlayCircle, Trash2, PackageOpen, Plus, Eye } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Paleta, formatPrecio, MIS_PALETAS } from "../data";

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="rounded-[14px] p-4"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <p className="text-[13px]" style={{ color: "#6B7280" }}>
        {label}
      </p>
      <p className="mt-1 text-[24px]" style={{ color: "#0F5132", fontWeight: 800 }}>
        {value}
      </p>
    </div>
  );
}

function Row({
  paleta,
  onDelete,
  onToggle,
}: {
  paleta: Paleta;
  onDelete: () => void;
  onToggle: () => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="flex items-center gap-3 rounded-[14px] p-3"
      style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[10px]" style={{ background: "#F2F1ED" }}>
        <ImageWithFallback src={paleta.imagen} alt="" className="h-full w-full object-cover" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-[14px]" style={{ color: "#14171A", fontWeight: 600 }}>
          {paleta.marca} {paleta.modelo}
        </p>
        <p className="text-[15px]" style={{ color: "#0F5132", fontWeight: 700 }}>
          {formatPrecio(paleta.precio)}
        </p>
        <div className="mt-0.5 flex items-center gap-2 text-[12px]" style={{ color: "#6B7280" }}>
          <span
            className="rounded-full px-2 py-0.5"
            style={{
              background: paleta.activa ? "rgba(15,81,50,0.1)" : "#F2F1ED",
              color: paleta.activa ? "#0F5132" : "#6B7280",
              fontWeight: 600,
            }}
          >
            {paleta.activa ? "Activa" : "Pausada"}
          </span>
          <span className="flex items-center gap-1">
            <Eye size={12} /> {paleta.visitas}
          </span>
        </div>
      </div>
      <div className="relative">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex h-9 w-9 items-center justify-center rounded-full"
          style={{ color: "#6B7280" }}
        >
          <MoreVertical size={18} />
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
            <div
              className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[14px] p-1.5"
              style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 12px 28px rgba(0,0,0,0.10)" }}
            >
              <button className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px]" style={{ color: "#14171A" }}>
                <Pencil size={15} /> Editar
              </button>
              <button
                onClick={() => {
                  onToggle();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px]"
                style={{ color: "#14171A" }}
              >
                {paleta.activa ? <PauseCircle size={15} /> : <PlayCircle size={15} />}
                {paleta.activa ? "Pausar" : "Reactivar"}
              </button>
              <button
                onClick={() => {
                  onDelete();
                  setOpen(false);
                }}
                className="flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-left text-[13px]"
                style={{ color: "#D4183D" }}
              >
                <Trash2 size={15} /> Eliminar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export function MyListings({ onPublicar }: { onPublicar: () => void }) {
  const [items, setItems] = useState<Paleta[]>(MIS_PALETAS);
  const [aBorrar, setABorrar] = useState<Paleta | null>(null);

  const activas = items.filter((i) => i.activa).length;
  const visitas = items.reduce((s, i) => s + (i.visitas ?? 0), 0);

  const toggle = (id: string) =>
    setItems((p) => p.map((i) => (i.id === id ? { ...i, activa: !i.activa } : i)));

  return (
    <div className="mx-auto max-w-[760px] px-4 py-6 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Mis publicaciones</h1>

      <div className="mt-4 grid grid-cols-3 gap-3">
        <Metric label="Activas" value={String(activas)} />
        <Metric label="Vendidas" value="4" />
        <Metric label="Visitas totales" value={visitas.toLocaleString("es-AR")} />
      </div>

      <div className="mt-6 space-y-3">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-[14px] py-16 text-center" style={{ border: "1px dashed #E6E4DF", background: "#FFFFFF" }}>
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#F2F1ED" }}>
              <PackageOpen size={28} style={{ color: "#0F5132" }} />
            </div>
            <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
              Todavía no publicaste nada
            </p>
            <p className="mt-1 text-[14px]" style={{ color: "#6B7280" }}>
              Publicá tu primera paleta y llegá a jugadores de todo el país.
            </p>
            <button
              onClick={onPublicar}
              className="mt-5 flex items-center gap-2 rounded-[14px] px-4 py-2.5 text-[14px] text-white"
              style={{ background: "#0F5132", fontWeight: 600 }}
            >
              <Plus size={16} /> Publicar tu primera paleta
            </button>
          </div>
        ) : (
          items.map((p) => (
            <Row key={p.id} paleta={p} onDelete={() => setABorrar(p)} onToggle={() => toggle(p.id)} />
          ))
        )}
      </div>

      {/* Modal confirmación eliminar */}
      <AnimatePresence>
        {aBorrar && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-6"
            style={{ background: "rgba(20,23,26,0.4)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setABorrar(null)}
          >
            <motion.div
              className="w-full max-w-[380px] rounded-[14px] p-6"
              style={{ background: "#FFFFFF", boxShadow: "0 20px 50px rgba(0,0,0,0.18)" }}
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
            >
              <h3 style={{ color: "#14171A", fontWeight: 700, fontSize: 18 }}>¿Eliminar publicación?</h3>
              <p className="mt-1.5 text-[14px]" style={{ color: "#6B7280" }}>
                Vas a eliminar “{aBorrar.marca} {aBorrar.modelo}”. Esta acción no se puede deshacer.
              </p>
              <div className="mt-5 flex gap-3">
                <button
                  onClick={() => setABorrar(null)}
                  className="flex-1 rounded-[14px] py-2.5 text-[14px]"
                  style={{ background: "#FAFAF8", border: "1px solid #E6E4DF", color: "#14171A", fontWeight: 600 }}
                >
                  Cancelar
                </button>
                <button
                  onClick={() => {
                    setItems((p) => p.filter((i) => i.id !== aBorrar.id));
                    setABorrar(null);
                  }}
                  className="flex-1 rounded-[14px] py-2.5 text-[14px] text-white"
                  style={{ background: "#D4183D", fontWeight: 600 }}
                >
                  Eliminar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
