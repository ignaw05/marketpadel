import { useMemo, useState } from "react";
import { ChevronDown, SearchX } from "lucide-react";
import { PaletaCard } from "./paleta-card";
import { Paleta, MARCAS, FORMAS } from "../data";

type Filtros = {
  marca: string | null;
  forma: string | null;
  precio: string | null;
  ubicacion: string | null;
  estado: string | null;
};

const PRECIOS = [
  { label: "Hasta $ 200.000", max: 200000, min: 0 },
  { label: "$ 200.000 – $ 350.000", max: 350000, min: 200000 },
  { label: "Más de $ 350.000", max: Infinity, min: 350000 },
];

const ESTADOS = [
  { label: "10/10 sin uso", min: 10 },
  { label: "9+ como nueva", min: 9 },
  { label: "8+ muy buena", min: 8 },
  { label: "7+ buena", min: 7 },
];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className="flex shrink-0 items-center gap-1 rounded-full px-3.5 py-2 text-[13px] transition-colors"
      style={{
        background: active ? "#0F5132" : "#FFFFFF",
        color: active ? "#FFFFFF" : "#14171A",
        border: `1px solid ${active ? "#0F5132" : "#E6E4DF"}`,
        fontWeight: 600,
      }}
    >
      {children}
      <ChevronDown size={14} style={{ opacity: 0.7 }} />
    </button>
  );
}

function Dropdown({
  label,
  options,
  value,
  onSelect,
}: {
  label: string;
  options: string[];
  value: string | null;
  onSelect: (v: string | null) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <Chip active={!!value} onClick={() => setOpen((o) => !o)}>
        {value ?? label}
      </Chip>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute left-0 top-full z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-[14px] p-1.5"
            style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 12px 28px rgba(0,0,0,0.10)" }}
          >
            <button
              className="block w-full rounded-[10px] px-3 py-2 text-left text-[13px]"
              style={{ color: "#6B7280" }}
              onClick={() => {
                onSelect(null);
                setOpen(false);
              }}
            >
              Todas
            </button>
            {options.map((o) => (
              <button
                key={o}
                className="block w-full rounded-[10px] px-3 py-2 text-left text-[13px]"
                style={{
                  color: "#14171A",
                  background: value === o ? "#F2F1ED" : "transparent",
                  fontWeight: value === o ? 600 : 400,
                }}
                onClick={() => {
                  onSelect(o);
                  setOpen(false);
                }}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function HomeScreen({
  paletas,
  query,
  onOpen,
  loading,
}: {
  paletas: Paleta[];
  query: string;
  onOpen: (p: Paleta) => void;
  loading: boolean;
}) {
  const [filtros, setFiltros] = useState<Filtros>({
    marca: null,
    forma: null,
    precio: null,
    ubicacion: null,
    estado: null,
  });

  const set = (k: keyof Filtros, v: string | null) =>
    setFiltros((f) => ({ ...f, [k]: v }));

  const resultado = useMemo(() => {
    return paletas.filter((p) => {
      if (query) {
        const q = query.toLowerCase();
        if (!`${p.marca} ${p.modelo}`.toLowerCase().includes(q)) return false;
      }
      if (filtros.marca && p.marca !== filtros.marca) return false;
      if (filtros.forma && p.forma !== filtros.forma) return false;
      if (filtros.ubicacion && p.ubicacion !== filtros.ubicacion) return false;
      if (filtros.precio) {
        const r = PRECIOS.find((x) => x.label === filtros.precio)!;
        if (p.precio < r.min || p.precio > r.max) return false;
      }
      if (filtros.estado) {
        const e = ESTADOS.find((x) => x.label === filtros.estado)!;
        if (p.estado < e.min) return false;
      }
      return true;
    });
  }, [paletas, query, filtros]);

  const ubicaciones = Array.from(new Set(paletas.map((p) => p.ubicacion)));

  return (
    <div className="mx-auto max-w-[1280px] px-4 py-5 md:px-6">
      {/* Filtros */}
      <div className="mb-5 flex flex-wrap gap-2 pb-1">
        <Dropdown label="Marca" options={MARCAS} value={filtros.marca} onSelect={(v) => set("marca", v)} />
        <Dropdown label="Forma" options={[...FORMAS]} value={filtros.forma} onSelect={(v) => set("forma", v)} />
        <Dropdown label="Precio" options={PRECIOS.map((p) => p.label)} value={filtros.precio} onSelect={(v) => set("precio", v)} />
        <Dropdown label="Ubicación" options={ubicaciones} value={filtros.ubicacion} onSelect={(v) => set("ubicacion", v)} />
        <Dropdown label="Estado" options={ESTADOS.map((e) => e.label)} value={filtros.estado} onSelect={(v) => set("estado", v)} />
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="overflow-hidden rounded-[14px]" style={{ border: "1px solid #E6E4DF" }}>
              <div className="animate-pulse" style={{ background: "#F2F1ED", aspectRatio: "4 / 5" }} />
              <div className="space-y-2 p-3.5">
                <div className="h-3.5 w-3/4 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
                <div className="h-5 w-1/2 animate-pulse rounded" style={{ background: "#F2F1ED" }} />
              </div>
            </div>
          ))}
        </div>
      ) : resultado.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "#F2F1ED" }}>
            <SearchX size={28} style={{ color: "#6B7280" }} />
          </div>
          <p className="mt-4 text-[16px]" style={{ color: "#14171A", fontWeight: 600 }}>
            No encontramos paletas
          </p>
          <p className="mt-1 text-[14px]" style={{ color: "#6B7280" }}>
            Probá ajustando los filtros o la búsqueda.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {resultado.map((p) => (
            <PaletaCard key={p.id} paleta={p} onClick={() => onOpen(p)} />
          ))}
        </div>
      )}
    </div>
  );
}
