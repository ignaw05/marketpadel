import { useState, useRef } from "react";
import { Diamond, Droplet, Circle, UploadCloud, X, ImagePlus } from "lucide-react";
import { MARCAS, FORMAS, ANIOS, PROVINCIAS, Forma, estadoLabel } from "../data";

function Label({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-1.5 block text-[14px]" style={{ color: "#14171A" }}>
      {children}
    </span>
  );
}

const inputStyle: React.CSSProperties = {
  background: "#FAFAF8",
  border: "1px solid #E6E4DF",
  color: "#14171A",
};

function focusOn(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#0F5132";
}
function focusOff(e: React.FocusEvent<HTMLElement>) {
  e.currentTarget.style.borderColor = "#E6E4DF";
}

export function PublishScreen({ onPublish }: { onPublish: () => void }) {
  const [fotos, setFotos] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);
  const [forma, setForma] = useState<Forma>("Diamante");
  const [estado, setEstado] = useState(9);
  const [precio, setPrecio] = useState("");
  const [desc, setDesc] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const addFotos = (files: FileList | null) => {
    if (!files) return;
    const nuevos = Array.from(files)
      .slice(0, 4 - fotos.length)
      .map((f) => URL.createObjectURL(f));
    setFotos((p) => [...p, ...nuevos].slice(0, 4));
  };

  const precioNum = precio.replace(/\D/g, "");
  const precioFmt = precioNum ? "$ " + Number(precioNum).toLocaleString("es-AR") : "";

  const formaIcon = (f: Forma) =>
    f === "Diamante" ? <Diamond size={18} /> : f === "Lágrima" ? <Droplet size={18} /> : <Circle size={18} />;

  return (
    <div className="mx-auto max-w-[640px] px-4 pb-28 pt-6 md:pb-10 md:px-6">
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Publicar paleta</h1>
      <p className="mt-1 text-[14px]" style={{ color: "#6B7280" }}>
        Completá los datos y en minutos tu paleta queda publicada.
      </p>

      <div
        className="mt-5 space-y-5 rounded-[14px] p-5 md:p-6"
        style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {/* Uploader */}
        <div>
          <Label>Fotos (hasta 4)</Label>
          <div className="grid grid-cols-4 gap-2.5">
            {fotos.map((f, i) => (
              <div key={i} className="relative overflow-hidden rounded-[14px]" style={{ aspectRatio: "1", background: "#F2F1ED" }}>
                <img src={f} alt="" className="h-full w-full object-cover" />
                <button
                  onClick={() => setFotos((p) => p.filter((_, x) => x !== i))}
                  className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full"
                  style={{ background: "rgba(20,23,26,0.6)", color: "#fff" }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
            {fotos.length < 4 && (
              <button
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDrag(false);
                  addFotos(e.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-[14px] transition-colors"
                style={{
                  aspectRatio: "1",
                  border: `1.5px dashed ${drag ? "#0F5132" : "#E6E4DF"}`,
                  background: drag ? "rgba(15,81,50,0.04)" : "#FAFAF8",
                  color: "#6B7280",
                }}
              >
                {fotos.length === 0 ? <UploadCloud size={22} /> : <ImagePlus size={20} />}
                <span className="text-[11px]">Arrastrá o subí</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => addFotos(e.target.files)} />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Marca</Label>
            <select className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} defaultValue="">
              <option value="" disabled>
                Elegí una marca
              </option>
              {MARCAS.map((m) => (
                <option key={m}>{m}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Modelo</Label>
            <input placeholder="Ej: Vertex 04" className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
          </label>
        </div>

        {/* Forma toggle */}
        <div>
          <Label>Forma</Label>
          <div className="grid grid-cols-3 gap-2.5">
            {FORMAS.map((f) => {
              const active = forma === f;
              return (
                <button
                  key={f}
                  onClick={() => setForma(f)}
                  className="flex items-center justify-center gap-2 rounded-[14px] py-2.5 text-[14px] transition-colors"
                  style={{
                    background: active ? "#0F5132" : "#FAFAF8",
                    color: active ? "#FFFFFF" : "#14171A",
                    border: `1px solid ${active ? "#0F5132" : "#E6E4DF"}`,
                    fontWeight: 600,
                  }}
                >
                  {formaIcon(f)} {f}
                </button>
              );
            })}
          </div>
        </div>

        {/* Estado slider */}
        <div>
          <div className="flex items-center justify-between">
            <Label>Estado</Label>
            <span
              className="rounded-full px-2.5 py-1 text-[12px]"
              style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
            >
              {estado}/10 · {estadoLabel(estado)}
            </span>
          </div>
          <input
            type="range"
            min={6}
            max={10}
            value={estado}
            onChange={(e) => setEstado(Number(e.target.value))}
            className="w-full"
            style={{ accentColor: "#0F5132" }}
          />
          <div className="flex justify-between text-[11px]" style={{ color: "#6B7280" }}>
            <span>6/10</span>
            <span>10/10</span>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Año</Label>
            <select className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} defaultValue="">
              <option value="" disabled>
                Elegí un año
              </option>
              {ANIOS.map((a) => (
                <option key={a}>{a}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Precio (ARS)</Label>
            <input
              value={precioFmt}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="$ 0"
              inputMode="numeric"
              className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none"
              style={inputStyle}
              onFocus={focusOn}
              onBlur={focusOff}
            />
          </label>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Label>Provincia</Label>
            <select className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} defaultValue="">
              <option value="" disabled>
                Elegí provincia
              </option>
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <Label>Ciudad</Label>
            <input placeholder="Ej: Rosario" className="w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none" style={inputStyle} onFocus={focusOn} onBlur={focusOff} />
          </label>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <Label>Descripción</Label>
            <span className="text-[12px]" style={{ color: "#6B7280" }}>
              {desc.length}/300
            </span>
          </div>
          <textarea
            value={desc}
            maxLength={300}
            onChange={(e) => setDesc(e.target.value)}
            rows={4}
            placeholder="Contá cómo está, si tiene golpes, si va con paletero…"
            className="w-full resize-none rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none"
            style={inputStyle}
            onFocus={focusOn}
            onBlur={focusOff}
          />
        </div>

        {/* Botón desktop */}
        <button
          onClick={onPublish}
          className="hidden w-full rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 md:block"
          style={{ background: "#0F5132", fontWeight: 600 }}
        >
          Publicar paleta
        </button>
      </div>

      {/* Botón fijo mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 p-4 md:hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}
      >
        <button
          onClick={onPublish}
          className="w-full rounded-[14px] py-3 text-[15px] text-white"
          style={{ background: "#0F5132", fontWeight: 600 }}
        >
          Publicar paleta
        </button>
      </div>
    </div>
  );
}
