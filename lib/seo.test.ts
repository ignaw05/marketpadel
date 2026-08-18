import { test, expect } from "vitest";
import { canonicaFeed, tituloFeed } from "./paletas";

// El h1 de la home y el <title> salen de aca: si esto se rompe, todas las
// facetas quedan con el mismo titulo y Google las lee como duplicadas.
test("el titulo del feed nombra la faceta que se esta viendo", () => {
  expect(tituloFeed({})).toBe("Paletas de pádel usadas en Argentina");
  expect(tituloFeed({ marca: "Bullpadel" })).toBe("Paletas de pádel Bullpadel usadas en Argentina");
  expect(tituloFeed({ provincia: "Córdoba" })).toBe("Paletas de pádel usadas en Córdoba");
  // La ciudad le gana a la provincia: es lo mas especifico que eligio el usuario.
  expect(tituloFeed({ marca: "Nox", provincia: "Buenos Aires", ciudad: "La Plata" })).toBe(
    "Paletas de pádel Nox usadas en La Plata",
  );
});

test("las facetas de catalogo se indexan y el resto no", () => {
  expect(canonicaFeed({})).toEqual({ path: "/", indexable: true });
  expect(canonicaFeed({ marca: "Head" })).toEqual({ path: "/?marca=Head", indexable: true });

  for (const f of [{ q: "hack" }, { forma: "Diamante" }, { precioMax: "200000" }, { estado: "MUY BUENA" }, { pagina: "2" }]) {
    expect(canonicaFeed(f).indexable, JSON.stringify(f)).toBe(false);
  }

  // Ordenar no cambia la pagina: la misma lista con otra secuencia.
  expect(canonicaFeed({ marca: "Head", orden: "precio-asc" })).toEqual({
    path: "/?marca=Head",
    indexable: true,
  });
});

// Sin esto, ?ciudad=X&marca=Y y ?marca=Y&ciudad=X compiten entre si.
test("el orden de los params no cambia la canonica", () => {
  const a = canonicaFeed({ marca: "Siux", ciudad: "Rosario" }).path;
  const b = canonicaFeed({ ciudad: "Rosario", marca: "Siux" }).path;
  expect(a).toBe(b);
  expect(a).toBe("/?marca=Siux&ciudad=Rosario");
});
