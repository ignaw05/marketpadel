import { test, expect } from "vitest";
import { aviso, hace } from "./actividad";

test("el aviso tiene nombre, accion, marca y antiguedad", () => {
  expect(aviso(() => 0)).toBe("M. López vendió su paleta Adidas, hace 2 min");
  expect(aviso(() => 0.99)).toMatch(/^\S\. \S+ .+ paleta .+, hace \d+ (min|h)$/);
});

test("los minutos se muestran en horas cuando pasan de 59", () => {
  expect(hace(2)).toBe("hace 2 min");
  expect(hace(59)).toBe("hace 59 min");
  expect(hace(60)).toBe("hace 1 h");
  expect(hace(179)).toBe("hace 2 h");
});
