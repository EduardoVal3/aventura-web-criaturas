import test from "node:test";
import assert from "node:assert/strict";
import {
  construirSlotsTacticos,
  bloquesResonancia,
  describirEstado,
  resolverBadgeEfectoMovimiento,
} from "../src/lib/combate-tactico.ts";
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

test("la insignia de estado activo expone icono, nombre, turnos y claseEstilo tematica", () => {
  const descQuemadura = describirEstado({ codigo: "QUEMADURA", nombre: "Quemadura", turnosRestantes: 2 });
  assert.equal(descQuemadura.icono, "Flame");
  assert.equal(descQuemadura.etiqueta, "Quemadura (2)");
  assert.equal(descQuemadura.turnos, 2);
  assert.ok(descQuemadura.claseEstilo.includes("text-red-400"));

  const descVeneno = describirEstado({ codigo: "VENENO", nombre: "Veneno", turnosRestantes: 3 });
  assert.ok(descVeneno.claseEstilo.includes("text-emerald-400"));

  const descBastion = describirEstado({ codigo: "BASTION", nombre: "Bastión", turnosRestantes: 1, escudo: 25 });
  assert.ok(descBastion.claseEstilo.includes("text-blue-300"));
});

test("resolverBadgeEfectoMovimiento resuelve badges representativos de efectos con claseEstilo tematica", () => {
  // Retorna null si no hay efecto
  assert.equal(resolverBadgeEfectoMovimiento(null, null), null);
  assert.equal(resolverBadgeEfectoMovimiento(undefined, undefined), null);
  assert.equal(resolverBadgeEfectoMovimiento("", null), null);

  // Efectos mecánicos principales
  const quemadura = resolverBadgeEfectoMovimiento("QUEMADURA");
  assert.equal(quemadura?.nombre, "Quemadura");
  assert.equal(quemadura?.icono, "Flame");
  assert.ok(quemadura?.claseEstilo.includes("red"));

  const paralisis = resolverBadgeEfectoMovimiento(null, "PARALISIS");
  assert.equal(paralisis?.nombre, "Parálisis");
  assert.equal(paralisis?.icono, "Zap");
  assert.ok(paralisis?.claseEstilo.includes("amber"));

  const escarcha = resolverBadgeEfectoMovimiento("ENFRIAMIENTO");
  assert.equal(escarcha?.nombre, "Escarcha");
  assert.equal(escarcha?.icono, "Snowflake");
  assert.ok(escarcha?.claseEstilo.includes("cyan"));

  const veneno = resolverBadgeEfectoMovimiento("VENENO_GRAVE");
  assert.equal(veneno?.nombre, "Veneno+");
  assert.equal(veneno?.icono, "Skull");
  assert.ok(veneno?.claseEstilo.includes("emerald"));

  const bastion = resolverBadgeEfectoMovimiento("BASTION");
  assert.equal(bastion?.nombre, "Bastión");
  assert.equal(bastion?.icono, "Shield");
  assert.ok(bastion?.claseEstilo.includes("blue"));

  const petrificacion = resolverBadgeEfectoMovimiento("PETRIFICACION_LEVE");
  assert.equal(petrificacion?.nombre, "Petrif. Leve");
  assert.equal(petrificacion?.icono, "ShieldAlert");
  assert.ok(petrificacion?.claseEstilo.includes("stone"));

  // Efectos tácticos del bestiario
  const critico = resolverBadgeEfectoMovimiento("CRITICO");
  assert.equal(critico?.nombre, "Crítico");
  assert.equal(critico?.icono, "Swords");
  assert.ok(critico?.claseEstilo.includes("rose"));

  const drenaje = resolverBadgeEfectoMovimiento("DRENAJE");
  assert.equal(drenaje?.nombre, "Drenaje");
  assert.equal(drenaje?.icono, "HeartPulse");
  assert.ok(drenaje?.claseEstilo.includes("purple"));

  const sobrecarga = resolverBadgeEfectoMovimiento("SOBRECARGA_LEGENDARIA");
  assert.equal(sobrecarga?.nombre, "Sobrecarga");
  assert.ok(sobrecarga?.claseEstilo.includes("yellow"));

  // Efecto no tabulado como respaldo seguro
  const desconocido = resolverBadgeEfectoMovimiento("SOBRECARGA_MISTICA");
  assert.equal(desconocido?.nombre, "Sobrecarga Mistica");
  assert.equal(desconocido?.icono, "Sparkles");
  assert.ok(desconocido?.claseEstilo.includes("border-pixel"));
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
