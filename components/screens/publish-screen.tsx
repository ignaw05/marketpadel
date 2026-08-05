"use client";

import { useActionState, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Diamond,
  Droplet,
  Circle,
  UploadCloud,
  X,
  ImagePlus,
  AlertCircle,
} from "lucide-react";
import {
  FORMAS,
  ANIOS,
  PROVINCIAS,
  Forma,
  estadoLabel,
} from "@/lib/paletas";
import { publicar, type PublicarState } from "@/app/(main)/publicar/actions";

const inputStyle = (error?: string): React.CSSProperties => ({
  background: "#FAFAF8",
  border: `1px solid ${error ? "#D4183D" : "#E6E4DF"}`,
  color: "#14171A",
  outlineColor: "#0F5132",
});

const campoClass =
  "min-h-[44px] w-full rounded-[14px] px-3.5 py-2.5 text-[15px] outline-none focus-visible:outline-2 focus-visible:outline-offset-2";

function Error({ id, mensaje }: { id: string; mensaje?: string }) {
  if (!mensaje) return null;
  return (
    <p id={id} className="mt-1 text-[13px]" style={{ color: "#D4183D" }}>
      {mensaje}
    </p>
  );
}

function Campo({
  id,
  label,
  error,
  extra,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  extra?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <label className="mb-1.5 block text-[14px]" htmlFor={id} style={{ color: "#14171A" }}>
          {label}
        </label>
        {extra}
      </div>
      {children}
      <Error id={`${id}-error`} mensaje={error} />
    </div>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] w-full rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#0F5132", fontWeight: 600, outlineColor: "#0F5132" }}
    >
      {pending ? "Publicando…" : "Publicar paleta"}
    </button>
  );
}

export function PublishScreen({ marcas }: { marcas: { id: number; nombre: string }[] }) {
  const [state, formAction] = useActionState<PublicarState, FormData>(publicar, {});
  const v = state.valores ?? {};
  const e = state.campos ?? {};

  const [fotos, setFotos] = useState<{ file: File; url: string }[]>([]);
  const [drag, setDrag] = useState(false);
  const [forma, setForma] = useState<Forma>((v.forma as Forma) || "Diamante");
  const [estado, setEstado] = useState(Number(v.estado) || 9);
  const [precio, setPrecio] = useState(v.precio ?? "");
  const [desc, setDesc] = useState(v.descripcion ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  // El <input type=file> es la fuente de verdad para el submit, asi que hay que
  // reescribir su FileList cuando se agrega o se saca una foto.
  const sincronizar = (lista: typeof fotos) => {
    const dt = new DataTransfer();
    lista.forEach(({ file }) => dt.items.add(file));
    if (fileRef.current) fileRef.current.files = dt.files;
    setFotos(lista);
  };

  const agregar = (files: FileList | null) => {
    if (!files) return;
    const nuevas = Array.from(files)
      .slice(0, 4 - fotos.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    sincronizar([...fotos, ...nuevas]);
  };

  const sacar = (i: number) => {
    URL.revokeObjectURL(fotos[i].url);
    sincronizar(fotos.filter((_, x) => x !== i));
  };

  const precioNum = precio.replace(/\D/g, "");
  const precioFmt = precioNum ? "$ " + Number(precioNum).toLocaleString("es-AR") : "";

  const formaIcon = (f: Forma) =>
    f === "Diamante" ? (
      <Diamond size={18} aria-hidden />
    ) : f === "Lágrima" ? (
      <Droplet size={18} aria-hidden />
    ) : (
      <Circle size={18} aria-hidden />
    );

  return (
    <form action={formAction} className="mx-auto max-w-[640px] px-4 pb-28 pt-6 md:px-6 md:pb-10" noValidate>
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>Publicar paleta</h1>
      <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
        Completá los datos y en minutos tu paleta queda publicada.
      </p>

      <div
        className="mt-5 space-y-5 rounded-[14px] p-5 md:p-6"
        style={{ background: "#FFFFFF", border: "1px solid #E6E4DF", boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
      >
        {state.error && (
          <p
            role="alert"
            className="flex items-start gap-2 rounded-[14px] p-3 text-[13px]"
            style={{ background: "rgba(212,24,61,0.08)", color: "#A31232" }}
          >
            <AlertCircle size={16} className="mt-px shrink-0" aria-hidden />
            {state.error}
          </p>
        )}

        {/* Fotos */}
        <fieldset>
          <legend className="mb-1.5 text-[14px]" style={{ color: "#14171A" }}>
            Fotos (hasta 4)
          </legend>
          <div className="grid grid-cols-4 gap-2.5">
            {fotos.map(({ url }, i) => (
              <div
                key={url}
                className="relative overflow-hidden rounded-[14px]"
                style={{ aspectRatio: "1", background: "#F2F1ED" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- object URL local, no pasa por el optimizador */}
                <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                <button
                  type="button"
                  onClick={() => sacar(i)}
                  className="absolute right-1 top-1 flex h-7 w-7 items-center justify-center rounded-full focus-visible:outline-2"
                  style={{ background: "rgba(20,23,26,0.65)", color: "#fff", outlineColor: "#FFFFFF" }}
                >
                  <X size={13} aria-hidden />
                  <span className="sr-only">Sacar la foto {i + 1}</span>
                </button>
              </div>
            ))}
            {fotos.length < 4 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(ev) => {
                  ev.preventDefault();
                  setDrag(true);
                }}
                onDragLeave={() => setDrag(false)}
                onDrop={(ev) => {
                  ev.preventDefault();
                  setDrag(false);
                  agregar(ev.dataTransfer.files);
                }}
                className="flex flex-col items-center justify-center gap-1 rounded-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  aspectRatio: "1",
                  border: `1.5px dashed ${drag ? "#0F5132" : e.fotos ? "#D4183D" : "#E6E4DF"}`,
                  background: drag ? "rgba(15,81,50,0.04)" : "#FAFAF8",
                  color: "#5B6470",
                  outlineColor: "#0F5132",
                }}
              >
                {fotos.length === 0 ? (
                  <UploadCloud size={22} aria-hidden />
                ) : (
                  <ImagePlus size={20} aria-hidden />
                )}
                <span className="text-[11px]">Arrastrá o subí</span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            name="fotos"
            type="file"
            accept="image/*"
            multiple
            hidden
            onChange={(ev) => agregar(ev.target.files)}
          />
          <Error id="fotos-error" mensaje={e.fotos} />
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="marca_id" label="Marca" error={e.marca_id}>
            <select
              id="marca_id"
              name="marca_id"
              defaultValue={v.marca_id ?? ""}
              aria-invalid={!!e.marca_id}
              className={campoClass}
              style={inputStyle(e.marca_id)}
            >
              <option value="" disabled>
                Elegí una marca
              </option>
              {marcas.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="modelo" label="Modelo" error={e.modelo}>
            <input
              id="modelo"
              name="modelo"
              defaultValue={v.modelo}
              maxLength={120}
              placeholder="Ej: Vertex 04"
              aria-invalid={!!e.modelo}
              className={campoClass}
              style={inputStyle(e.modelo)}
            />
          </Campo>
        </div>

        {/* Forma */}
        <fieldset>
          <legend className="mb-1.5 text-[14px]" style={{ color: "#14171A" }}>
            Forma
          </legend>
          <input type="hidden" name="forma" value={forma} />
          <div className="grid grid-cols-3 gap-2.5">
            {FORMAS.map((f) => {
              const activa = forma === f;
              return (
                <button
                  key={f}
                  type="button"
                  onClick={() => setForma(f)}
                  aria-pressed={activa}
                  className="flex min-h-[44px] items-center justify-center gap-2 rounded-[14px] py-2.5 text-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                  style={{
                    background: activa ? "#0F5132" : "#FAFAF8",
                    color: activa ? "#FFFFFF" : "#14171A",
                    border: `1px solid ${activa ? "#0F5132" : "#E6E4DF"}`,
                    fontWeight: 600,
                    outlineColor: "#0F5132",
                  }}
                >
                  {formaIcon(f)} {f}
                </button>
              );
            })}
          </div>
          <Error id="forma-error" mensaje={e.forma} />
        </fieldset>

        {/* Estado */}
        <Campo
          id="estado"
          label="Estado"
          error={e.estado}
          extra={
            <span
              className="rounded-full px-2.5 py-1 text-[12px]"
              style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
            >
              {estado}/10 · {estadoLabel(estado)}
            </span>
          }
        >
          <input
            id="estado"
            name="estado"
            type="range"
            min={6}
            max={10}
            value={estado}
            onChange={(ev) => setEstado(Number(ev.target.value))}
            className="w-full"
            style={{ accentColor: "#0F5132" }}
          />
          <div className="flex justify-between text-[11px]" style={{ color: "#5B6470" }}>
            <span>6/10</span>
            <span>10/10</span>
          </div>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="anio" label="Año" error={e.anio}>
            <select
              id="anio"
              name="anio"
              defaultValue={v.anio ?? ""}
              aria-invalid={!!e.anio}
              className={campoClass}
              style={inputStyle(e.anio)}
            >
              <option value="" disabled>
                Elegí un año
              </option>
              {ANIOS.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
          </Campo>

          <Campo id="precio" label="Precio (ARS)" error={e.precio}>
            <input
              id="precio"
              name="precio"
              value={precioFmt}
              onChange={(ev) => setPrecio(ev.target.value)}
              placeholder="$ 0"
              inputMode="numeric"
              aria-invalid={!!e.precio}
              className={campoClass}
              style={inputStyle(e.precio)}
            />
          </Campo>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="provincia" label="Provincia" error={e.provincia}>
            <select
              id="provincia"
              name="provincia"
              defaultValue={v.provincia ?? ""}
              aria-invalid={!!e.provincia}
              className={campoClass}
              style={inputStyle(e.provincia)}
            >
              <option value="" disabled>
                Elegí provincia
              </option>
              {PROVINCIAS.map((p) => (
                <option key={p}>{p}</option>
              ))}
            </select>
          </Campo>

          <Campo id="ciudad" label="Ciudad" error={e.ciudad}>
            <input
              id="ciudad"
              name="ciudad"
              defaultValue={v.ciudad}
              placeholder="Ej: Rosario"
              aria-invalid={!!e.ciudad}
              className={campoClass}
              style={inputStyle(e.ciudad)}
            />
          </Campo>
        </div>

        <Campo
          id="descripcion"
          label="Descripción"
          error={e.descripcion}
          extra={
            <span className="text-[12px]" style={{ color: "#5B6470" }}>
              {desc.length}/300
            </span>
          }
        >
          <textarea
            id="descripcion"
            name="descripcion"
            value={desc}
            maxLength={300}
            onChange={(ev) => setDesc(ev.target.value)}
            rows={4}
            placeholder="Contá cómo está, si tiene golpes, si va con paletero…"
            aria-invalid={!!e.descripcion}
            className={`${campoClass} resize-none`}
            style={inputStyle(e.descripcion)}
          />
        </Campo>

        <div className="hidden md:block">
          <Submit />
        </div>
      </div>

      {/* Botón fijo mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 p-4 md:hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}
      >
        <Submit />
      </div>
    </form>
  );
}
