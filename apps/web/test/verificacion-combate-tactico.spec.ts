import test from "node:test";
import assert from "node:assert/strict";
import { construirSlotsTacticos, bloquesResonancia, describirEstado } from "../src/lib/combate-tactico.ts";
import { agruparEspeciesPorZona } from "../src/lib/catalogo-historial.ts";

const mov = (slot: number, extra = {}) => ({ nombre: `M${slot}`, poder: 10, slot, ...extra });
const movimientos = [1, 2, 3, 4].map((s) => mov(s));

test("el panel expone 4 slots y M4 depende de la Resonancia", () => {
  const slots90 = construirSlotsTacticos(movimientos, 90);
  assert.equal(slots90.length, 4);
  assert.equal(slots90[3]?.bloqueado, true);
  assert.equal(bloquesResonancia(90), 9);

  const slots100 = construirSlotsTacticos(movimientos, 100);
  assert.equal(slots100[3]?.bloqueado, false);
  assert.equal(bloquesResonancia(100), 10);

  const forzado = construirSlotsTacticos([mov(1), mov(2), mov(3), mov(4, { bloqueado: true })], 100);
  assert.equal(forzado[3]?.bloqueado, true);
});

test("la insignia de estado activo expone icono, nombre y turnos", () => {
  const desc = describirEstado({ codigo: "QUEMADURA", nombre: "Quemadura", turnosRestantes: 2 });
  assert.equal(desc.icono, "Flame");
  assert.equal(desc.etiqueta, "Quemadura (2)");
  assert.equal(desc.turnos, 2);
});

test("el catalogo agrupa por zona y marca las legendarias", () => {
  const esp = (slug: string, zId: string, zNom: string, leg = false) => ({
    slug,
    nombre: slug,
    tipo: "beast",
    hpBase: 50,
    ataqueBase: 50,
    defensaBase: 50,
    velocidadBase: 50,
    challengeRating: "1",
    tasaCaptura: 0.3,
    esLegendaria: leg,
    zona: { id: zId, nombre: zNom },
  });

  const grupos = agruparEspeciesPorZona([
    esp("lobo", "ZON-01", "Praderas"),
    esp("behir", "ZON-05", "Abismo", true),
    esp("remorhaz", "ZON-06", "Glaciar", true),
  ]);

  assert.equal(grupos.length, 3);
  assert.deepEqual(grupos.map((g) => g.zonaId), ["ZON-01", "ZON-05", "ZON-06"]);
  assert.deepEqual(grupos.map((g) => g.legendarias), [0, 1, 1]);
  assert.equal(grupos[1]?.especies[0]?.esLegendaria, true);
});
