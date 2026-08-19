"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import {
  Diamond,
  Droplet,
  Circle,
  UploadCloud,
  X,
  ImagePlus,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import {
  FORMAS,
  ANIOS,
  PROVINCIAS,
  DURACION_DIAS,
  Forma,
  estadoLabel,
  medidas,
  miniatura,
  MAX_LADO,
  MINI_LADO,
} from "@/lib/paletas";
import type { Paleta } from "@/lib/paletas";
import { validarFotos, MAX_BYTES } from "@/lib/validar";
import { createClient } from "@/lib/supabase/client";
import { publicar, type PublicarState } from "@/app/(main)/publicar/actions";
import { actualizar } from "@/app/(main)/editar/[id]/actions";

const inputStyle = (error?: string): React.CSSProperties => ({
  background: "#FAFAF8",
  border: `1px solid ${error ? "#D4183D" : "#E6E4DF"}`,
  color: "#14171A",
  outlineColor: "#057305",
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

/** El asterisco es decorativo: el dato real lo da `required` en el input. */
function Obligatorio() {
  return (
    <span aria-hidden="true" style={{ color: "#D4183D" }}>
      {" *"}
    </span>
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
          <Obligatorio />
        </label>
        {extra}
      </div>
      {children}
      <Error id={`${id}-error`} mensaje={error} />
    </div>
  );
}

/** Tope de lo que aceptamos decodificar, antes de achicar. */
const MAX_BYTES_ORIGEN = 25 * 1024 * 1024;

/**
 * Reencoda en un canvas: una foto de celular pasa de ~5 MB a ~200 KB, que con
 * datos moviles es la diferencia entre subir y abandonar.
 *
 * WebP primero y JPEG despues: toBlob cae a PNG cuando no sabe encodar el tipo
 * pedido, y ese PNG pesa mas que el original. Safari viejo y varios Android no
 * encodan WebP, y ahi el JPEG es lo que salva el resize — sin el fallback la
 * foto se subia cruda, 4032px y 2,4 MB, porque el unico camino era WebP o nada.
 * ponytail: sin libreria de compresion, el canvas ya sabe hacer las dos cosas.
 */
async function encodar(bitmap: ImageBitmap, max: number): Promise<Blob | null> {
  const { ancho, alto } = medidas(bitmap.width, bitmap.height, max);
  const canvas = document.createElement("canvas");
  canvas.width = ancho;
  canvas.height = alto;
  canvas.getContext("2d")?.drawImage(bitmap, 0, 0, ancho, alto);

  for (const tipo of ["image/webp", "image/jpeg"]) {
    const blob = await new Promise<Blob | null>((listo) =>
      canvas.toBlob(listo, tipo, 0.82),
    );
    if (blob?.type === tipo) return blob;
  }
  return null;
}

const EXT: Record<string, string> = { "image/webp": "webp", "image/jpeg": "jpg" };

async function achicar(file: File, bitmap: ImageBitmap): Promise<File> {
  const blob = await encodar(bitmap, MAX_LADO);
  // El original solo gana si ya venia mas chico que lo que sabemos generar.
  if (!blob || blob.size >= file.size) return file;
  return new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.${EXT[blob.type]}`, {
    type: blob.type,
  });
}

function MoverFoto({
  hacia,
  indice,
  disabled,
  onClick,
}: {
  hacia: "izquierda" | "derecha";
  indice: number;
  disabled: boolean;
  onClick: () => void;
}) {
  const Icono = hacia === "izquierda" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="flex h-11 w-11 items-center justify-center rounded-[10px] disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ color: "#14171A", outlineColor: "#057305" }}
    >
      <Icono size={18} aria-hidden />
      <span className="sr-only">
        Mover la foto {indice + 1} a la {hacia}
      </span>
    </button>
  );
}

/**
 * Combobox nativo del navegador (<input list> + <datalist>) no anda en Safari
 * de iOS y en Android sale con el estilo del sistema: por eso el listbox de
 * sugerencias se dibuja a mano, con los mismos colores que el resto del form.
 */
function CampoMarca({
  id,
  marcas,
  valor,
  onChange,
  error,
}: {
  id: string;
  marcas: { id: number; nombre: string }[];
  valor: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  const [abierta, setAbierta] = useState(false);
  const [activo, setActivo] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const contenedorRef = useRef<HTMLDivElement>(null);

  // En mobile la lista se cierra al tocar afuera, no al perder el foco: cerrar
  // el teclado (boton "Listo") blurea el input sin que el usuario haya elegido
  // nada, y ahi es justo cuando quiere ver las sugerencias sin el teclado arriba.
  useEffect(() => {
    if (!abierta) return;
    const afuera = (ev: PointerEvent) => {
      if (!contenedorRef.current?.contains(ev.target as Node)) setAbierta(false);
    };
    document.addEventListener("pointerdown", afuera);
    return () => document.removeEventListener("pointerdown", afuera);
  }, [abierta]);

  const filtradas = marcas.filter((m) =>
    m.nombre.toLowerCase().includes(valor.trim().toLowerCase()),
  );

  const elegir = (nombre: string) => {
    onChange(nombre);
    // El focus() dispara el onFocus del input, que reabre la lista: por eso
    // el cierre va despues, asi es lo ultimo que se aplica en el batch.
    inputRef.current?.focus();
    setAbierta(false);
  };

  return (
    <div
      ref={contenedorRef}
      className="relative"
      // Solo cierra al tabular hacia otro control. relatedTarget null (teclado
      // que se cierra, o tap en Safari iOS que no enfoca el boton) no cuenta:
      // de eso se encarga el pointerdown de afuera.
      onBlur={(ev) => {
        const destino = ev.relatedTarget as Node | null;
        if (destino && !ev.currentTarget.contains(destino)) setAbierta(false);
      }}
    >
      <input
        ref={inputRef}
        id={id}
        name="marca"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={abierta && filtradas.length > 0}
        aria-controls={`${id}-listbox`}
        aria-activedescendant={activo >= 0 ? `${id}-opcion-${activo}` : undefined}
        autoComplete="off"
        required
        value={valor}
        onChange={(ev) => {
          onChange(ev.target.value);
          setAbierta(true);
          setActivo(-1);
        }}
        onFocus={() => setAbierta(true)}
        onKeyDown={(ev) => {
          if (ev.key === "ArrowDown") {
            ev.preventDefault();
            setAbierta(true);
            setActivo((i) => Math.min(i + 1, filtradas.length - 1));
          } else if (ev.key === "ArrowUp") {
            ev.preventDefault();
            setActivo((i) => Math.max(i - 1, 0));
          } else if (ev.key === "Enter" && abierta && activo >= 0 && filtradas[activo]) {
            ev.preventDefault();
            elegir(filtradas[activo].nombre);
          } else if (ev.key === "Escape") {
            setAbierta(false);
          }
        }}
        maxLength={60}
        placeholder="Ej: Bullpadel"
        aria-invalid={!!error}
        className={campoClass}
        style={inputStyle(error)}
      />

      {abierta && filtradas.length > 0 && (
        <ul
          id={`${id}-listbox`}
          role="listbox"
          aria-label="Marcas sugeridas"
          className="absolute inset-x-0 top-full z-20 mt-1.5 max-h-56 overflow-y-auto rounded-[14px] p-1.5"
          style={{
            background: "#FFFFFF",
            border: "1px solid #E6E4DF",
            boxShadow: "0 12px 28px rgba(0,0,0,0.10)",
          }}
        >
          {filtradas.map((m, i) => (
            <li key={m.id}>
              <button
                type="button"
                role="option"
                id={`${id}-opcion-${i}`}
                aria-selected={i === activo}
                onClick={() => elegir(m.nombre)}
                className="block min-h-[44px] w-full rounded-[10px] px-3 py-2.5 text-left text-[14px] focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  color: "#14171A",
                  background: i === activo ? "#F2F1ED" : "transparent",
                  outlineColor: "#057305",
                }}
              >
                {m.nombre}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Submit({ editando }: { editando: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="min-h-[44px] w-full rounded-[14px] py-3 text-[15px] text-white transition-opacity hover:opacity-90 disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2"
      style={{ background: "#057305", fontWeight: 600, outlineColor: "#057305" }}
    >
      {editando
        ? pending
          ? "Guardando…"
          : "Guardar cambios"
        : pending
          ? "Publicando…"
          : "Publicar paleta"}
    </button>
  );
}

export function PublishScreen({
  marcas,
  userId,
  paleta,
}: {
  marcas: { id: number; nombre: string }[];
  userId: string;
  /** Presente en modo edicion: la paleta a modificar. */
  paleta?: Paleta;
}) {
  const editando = !!paleta;
  const [fotos, setFotos] = useState<{ file?: File; mini?: Blob | null; url: string }[]>(
    paleta ? paleta.fotos.map((url) => ({ url })) : [],
  );

  // Las fotos se suben desde el navegador directo al storage y al server action
  // solo le llegan las URLs: un form con 4 fotos de celular pasa los limites de
  // body de un server action y la request muere antes de llegar.
  const subirYPublicar = async (
    prev: PublicarState,
    fd: FormData,
  ): Promise<PublicarState> => {
    // Las que ya estaban publicadas no tienen `file`: ya se validaron cuando
    // se subieron la primera vez, no hace falta chequearlas de nuevo.
    const mensaje = validarFotos(
      fotos.map(({ file }) =>
        file ? { tipo: file.type, bytes: file.size } : { tipo: "image/webp", bytes: 0 },
      ),
    );
    if (mensaje) return { ...prev, error: undefined, campos: { fotos: mensaje } };

    const supabase = createClient();
    const urls: string[] = [];
    // ponytail: si falla a mitad quedan fotos huerfanas en el bucket; limpiarlas
    // con un job de storage si alguna vez molesta.
    for (const { file, mini, url } of fotos) {
      if (!file) {
        urls.push(url);
        continue;
      }
      const ext = (file.name.split(".").pop() ?? "jpg").toLowerCase().slice(0, 5);
      // La policy del bucket exige que la carpeta sea el uid del que sube.
      const ruta = `${userId}/${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage
        .from("paletas")
        .upload(ruta, file, { contentType: file.type });
      if (error) return { ...prev, error: "No pudimos subir las fotos. Probá de nuevo." };
      // ponytail: si la mini no sube, la publicacion sale igual — ImageWithFallback
      // cae a la foto grande. No vale frenar una venta por una miniatura.
      if (mini) {
        await supabase.storage
          .from("paletas")
          .upload(miniatura(ruta), mini, { contentType: mini.type });
      }
      urls.push(supabase.storage.from("paletas").getPublicUrl(ruta).data.publicUrl);
    }

    urls.forEach((u) => fd.append("fotos", u));
    return paleta ? actualizar(paleta.id, prev, fd) : publicar(prev, fd);
  };

  const [state, formAction] = useActionState<PublicarState, FormData>(subirYPublicar, {});
  const e = state.campos ?? {};

  const [drag, setDrag] = useState(false);
  const [aviso, setAviso] = useState<string>();
  const [procesando, setProcesando] = useState(false);
  // Todos los campos viven en estado de React. React 19 resetea el <form>
  // cuando termina la accion, asi que lo que quede en el DOM se pierde: con un
  // error de validacion el usuario tendria que reescribir todo.
  const [marca, setMarca] = useState(paleta?.marca ?? "");
  const [modelo, setModelo] = useState(paleta?.modelo ?? "");
  const [anio, setAnio] = useState(paleta ? String(paleta.anio) : "");
  const [provincia, setProvincia] = useState(paleta?.provincia ?? "");
  const [ciudad, setCiudad] = useState(paleta?.ciudad ?? "");
  const [forma, setForma] = useState<Forma>(paleta?.forma ?? "Diamante");
  const [estado, setEstado] = useState(paleta?.estado ?? 6);
  const [precio, setPrecio] = useState(paleta ? String(paleta.precio) : "");
  const [desc, setDesc] = useState(paleta?.descripcion ?? "");
  const [permuta, setPermuta] = useState(paleta?.acepta_permuta ?? false);
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  // React 19 resetea el <form> cuando termina la accion. Los campos de texto
  // los repinta desde el estado, pero un <select> controlado queda en la
  // primera opcion: el estado dice "Mendoza" y la pantalla "Elegí provincia".
  // Hay que reescribirles el valor despues del reset.
  useEffect(() => {
    const f = formRef.current;
    if (!f) return;
    for (const [nombre, valor] of [
      ["anio", anio],
      ["provincia", provincia],
    ] as const) {
      const campo = f.elements.namedItem(nombre);
      if (campo instanceof HTMLSelectElement) campo.value = valor;
    }
    // Mismo problema con el checkbox: el reset lo devuelve a defaultChecked.
    const check = f.elements.namedItem("permuta");
    if (check instanceof HTMLInputElement) check.checked = permuta;
  }, [state, anio, provincia, permuta]);

  const agregar = async (files: FileList | null) => {
    if (!files) return;
    const candidatos = Array.from(files).slice(0, 4 - fotos.length);
    // Sin esto, volver a elegir el mismo archivo no dispara el change.
    if (fileRef.current) fileRef.current.value = "";

    setProcesando(true);
    const nuevas: typeof fotos = [];
    const ilegibles: string[] = [];
    const pesadas: string[] = [];

    for (const file of candidatos) {
      // Antes de decodificar: un archivo enorme cuelga la pestaña del celular.
      if (file.size > MAX_BYTES_ORIGEN) {
        pesadas.push(file.name);
        continue;
      }
      // Si este navegador no la puede decodificar, el comprador tampoco la va a
      // ver: pasa con los .heic del iPhone en todo lo que no sea Safari.
      // from-image: sin esto las fotos verticales del celular salen acostadas,
      // porque el WebP que generamos no se lleva el EXIF con la rotación.
      const bitmap = await createImageBitmap(file, {
        imageOrientation: "from-image",
      }).catch(() => null);
      if (!bitmap) {
        ilegibles.push(file.name);
        continue;
      }

      const liviana = await achicar(file, bitmap);
      // La mini es lo que se sirve en el feed, las listas y el fondo de la galeria:
      // sin ella cada card se baja la foto de 1600px. Sale del mismo bitmap, asi que
      // es un encode mas y ninguna decodificacion extra.
      const mini = await encodar(bitmap, MINI_LADO);
      bitmap.close();
      if (liviana.size > MAX_BYTES) {
        pesadas.push(file.name);
        continue;
      }
      nuevas.push({ file: liviana, mini, url: URL.createObjectURL(liviana) });
    }

    setFotos([...fotos, ...nuevas]);
    setAviso(
      [
        ilegibles.length &&
          `No pudimos leer ${ilegibles.join(", ")}. Si son fotos del iPhone (.heic), abrilas y exportalas como JPG antes de subirlas.`,
        pesadas.length && `${pesadas.join(", ")}: pesan demasiado, probá con fotos más chicas.`,
      ]
        .filter(Boolean)
        .join(" ") || undefined,
    );
    setProcesando(false);
  };

  const sacar = (i: number) => {
    // Las que ya estaban publicadas apuntan a la URL del storage, no a un
    // object URL local: no hay nada que revocar.
    if (fotos[i].file) URL.revokeObjectURL(fotos[i].url);
    setFotos(fotos.filter((_, x) => x !== i));
  };

  const mover = (i: number, hacia: number) => {
    const lista = [...fotos];
    [lista[i], lista[i + hacia]] = [lista[i + hacia], lista[i]];
    setFotos(lista);
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
    <form ref={formRef} action={formAction} className="mx-auto max-w-[640px] px-4 pb-28 pt-6 md:px-6 md:pb-10" noValidate>
      <h1 style={{ color: "#14171A", fontWeight: 700, fontSize: 24 }}>
        {editando ? "Editar paleta" : "Publicar paleta"}
      </h1>
      <p className="mt-1 text-[14px]" style={{ color: "#5B6470" }}>
        {editando
          ? "Actualizá los datos de tu publicación. "
          : "Completá los datos y en minutos tu paleta queda publicada. "}
        Los campos con <span style={{ color: "#D4183D" }}>*</span> son obligatorios.
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
            Fotos (hasta 4)<Obligatorio />
          </legend>
          <p className="mb-2 text-[13px]" style={{ color: "#5B6470" }}>
            La primera es la portada. Ordenalas con las flechas.
          </p>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {fotos.map(({ url }, i) => (
              <div key={url}>
                <div
                  className="relative overflow-hidden rounded-[14px]"
                  style={{ aspectRatio: "1", background: "#F2F1ED" }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- object URL local, no pasa por el optimizador */}
                  <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
                  {i === 0 && (
                    <span
                      className="absolute bottom-1 left-1 rounded-full px-2 py-0.5 text-[11px]"
                      style={{ background: "#C7F751", color: "#14171A", fontWeight: 700 }}
                    >
                      Portada
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => sacar(i)}
                    className="absolute right-0 top-0 flex h-11 w-11 items-center justify-center focus-visible:outline-2 focus-visible:-outline-offset-2"
                    style={{ color: "#FFFFFF", outlineColor: "#FFFFFF" }}
                  >
                    <span
                      className="flex h-7 w-7 items-center justify-center rounded-full"
                      style={{ background: "rgba(20,23,26,0.65)" }}
                    >
                      <X size={13} aria-hidden />
                    </span>
                    <span className="sr-only">Sacar la foto {i + 1}</span>
                  </button>
                </div>
                <div className="mt-0.5 flex items-center justify-between">
                  <MoverFoto
                    hacia="izquierda"
                    indice={i}
                    disabled={i === 0}
                    onClick={() => mover(i, -1)}
                  />
                  <span className="text-[12px]" style={{ color: "#5B6470" }}>
                    {i + 1}/{fotos.length}
                  </span>
                  <MoverFoto
                    hacia="derecha"
                    indice={i}
                    disabled={i === fotos.length - 1}
                    onClick={() => mover(i, 1)}
                  />
                </div>
              </div>
            ))}
            {fotos.length < 4 && (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={procesando}
                aria-busy={procesando}
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
                className="flex flex-col items-center justify-center gap-1 self-start rounded-[14px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
                style={{
                  aspectRatio: "1",
                  width: "100%",
                  border: `1.5px dashed ${drag ? "#057305" : e.fotos || aviso ? "#D4183D" : "#E6E4DF"}`,
                  background: drag ? "rgba(5,115,5,0.04)" : "#FAFAF8",
                  color: "#5B6470",
                  outlineColor: "#057305",
                }}
              >
                {procesando ? (
                  <Loader2 size={22} className="animate-spin" aria-hidden />
                ) : fotos.length === 0 ? (
                  <UploadCloud size={22} aria-hidden />
                ) : (
                  <ImagePlus size={20} aria-hidden />
                )}
                <span className="text-[11px]">
                  {procesando ? "Preparando…" : "Arrastrá o subí"}
                </span>
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            // Lista explicita en vez de image/*: iOS convierte el HEIC a JPG solo
            // cuando el accept no lo incluye.
            accept="image/jpeg,image/png,image/webp"
            multiple
            hidden
            onChange={(ev) => agregar(ev.target.files)}
          />
          <Error id="fotos-error" mensaje={e.fotos} />
          {aviso && (
            <p role="alert" className="mt-1 text-[13px]" style={{ color: "#D4183D" }}>
              {aviso}
            </p>
          )}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="marca" label="Marca" error={e.marca}>
            <CampoMarca id="marca" marcas={marcas} valor={marca} onChange={setMarca} error={e.marca} />
          </Campo>

          <Campo id="modelo" label="Modelo" error={e.modelo}>
            <input
              id="modelo"
              name="modelo"
              required
              value={modelo}
              onChange={(ev) => setModelo(ev.target.value)}
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
            Forma<Obligatorio />
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
                    background: activa ? "#057305" : "#FAFAF8",
                    color: activa ? "#FFFFFF" : "#14171A",
                    border: `1px solid ${activa ? "#057305" : "#E6E4DF"}`,
                    fontWeight: 600,
                    outlineColor: "#057305",
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
            min={1}
            max={10}
            value={estado}
            onChange={(ev) => setEstado(Number(ev.target.value))}
            className="w-full"
            style={{ accentColor: "#057305" }}
          />
          <div className="flex justify-between text-[11px]" style={{ color: "#5B6470" }}>
            <span>1/10</span>
            <span>10/10</span>
          </div>
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo id="anio" label="Año" error={e.anio}>
            <select
              id="anio"
              name="anio"
              required
              value={anio}
              onChange={(ev) => setAnio(ev.target.value)}
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
              required
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
              required
              value={provincia}
              onChange={(ev) => setProvincia(ev.target.value)}
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
              required
              value={ciudad}
              onChange={(ev) => setCiudad(ev.target.value)}
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
            required
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

        <div>
          <label
            htmlFor="permuta"
            className="flex min-h-[44px] cursor-pointer items-center gap-2.5 text-[15px]"
            style={{ color: "#14171A" }}
          >
            <input
              id="permuta"
              name="permuta"
              type="checkbox"
              checked={permuta}
              onChange={(ev) => setPermuta(ev.target.checked)}
              className="h-5 w-5 shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2"
              style={{ accentColor: "#057305", outlineColor: "#057305" }}
            />
            Acepto permuta por otra paleta
          </label>
          <p className="mt-0.5 text-[13px]" style={{ color: "#5B6470" }}>
            Los compradores pueden filtrar el mercado por esto.
          </p>
        </div>

        {/* Ultima linea del formulario: en mobile queda arriba de la barra fija, en
            desktop justo arriba del boton. Un solo lugar para los dos. */}
        {!editando && (
          <p className="text-[13px]" style={{ color: "#5B6470", lineHeight: 1.5 }}>
            Tu publicación se muestra {DURACION_DIAS} días. Después la renovás con un
            toque desde Mis paletas.
          </p>
        )}

        <div className="hidden md:block">
          <Submit editando={editando} />
        </div>
      </div>

      {/* Botón fijo mobile */}
      <div
        className="fixed inset-x-0 bottom-0 z-20 p-4 md:hidden"
        style={{ background: "#FFFFFF", boxShadow: "0 -4px 16px rgba(0,0,0,0.06)" }}
      >
        <Submit editando={editando} />
      </div>
    </form>
  );
}
