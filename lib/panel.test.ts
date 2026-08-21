import { test, expect } from "vitest";
import { variacion, porcentaje } from "./panel";

// La distincion que importa: "no se puede comparar" no es lo mismo que "no se
// movio". Si se confunden, el rango 'total' dibuja una caida del 100%.
test("sin ventana anterior no hay variacion que mostrar", () => {
  expect(variacion(7000, null)).toBeNull();
  expect(variacion(7000, undefined)).toBeNull();
});

test("un anterior en cero si es una comparacion valida", () => {
  expect(variacion(5, 0)).toEqual({ signo: "sube", absoluto: 5 });
});

test("la variacion viene con signo y en valor absoluto", () => {
  expect(variacion(7000, 5000)).toEqual({ signo: "sube", absoluto: 2000 });
  expect(variacion(5000, 7000)).toEqual({ signo: "baja", absoluto: 2000 });
  expect(variacion(7000, 7000)).toEqual({ signo: "igual", absoluto: 0 });
});

// Con 0 pagos en la ventana esto es el caso normal, no el borde.
test("un total en cero no da NaN", () => {
  expect(porcentaje(0, 0)).toBeNull();
  expect(porcentaje(3, 4)).toBe(75);
  expect(porcentaje(1, 3)).toBe(33);
});
