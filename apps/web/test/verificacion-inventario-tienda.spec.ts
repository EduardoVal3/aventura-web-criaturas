import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  LOTES_COMPRA,
  normalizarCantidadCompra,
  calcularResumenCompra,
  filtrarItemsPorCategoria,
  calcularVistaPreviaCuracion,
} from '../src/lib/economia-inventario.ts';
import type {
  ItemInventario,
  RespuestaInventario,
  ArticuloCatalogoTienda,
  RespuestaCatalogoTienda,
  RespuestaComprarTienda,
  RespuestaUsarItem,
} from '../src/api/ApiJuego.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('filtrarItemsPorCategoria: filtra correctamente por cada categoría y respeta inmutabilidad', () => {
  const inventarioEjemplo: ItemInventario[] = [
    { codigo: 'pocion-menor', nombre: 'Poción Menor', tipo: 'CURACION', cantidad: 3, efectoValor: 20 },
    { codigo: 'pocion-mayor', nombre: 'Poción Mayor', tipo: 'CURACION', cantidad: 1, efectoValor: 50 },
    { codigo: 'talisman-basico', nombre: 'Talismán Básico', tipo: 'CAPTURA', cantidad: 5, efectoValor: 1 },
    { codigo: 'reliquia-luz', nombre: 'Gema Solar', tipo: 'ESPECIAL', cantidad: 1 },
  ];

  const copiaOriginal = [...inventarioEjemplo];

  // Filtro TODOS
  const todos = filtrarItemsPorCategoria(inventarioEjemplo, 'TODOS');
  assert.strictEqual(todos.length, 4);

  // Filtro CURACION
  const curacion = filtrarItemsPorCategoria(inventarioEjemplo, 'CURACION');
  assert.strictEqual(curacion.length, 2);
  assert.strictEqual(curacion.every((i) => i.tipo === 'CURACION'), true);

  // Filtro CAPTURA
  const captura = filtrarItemsPorCategoria(inventarioEjemplo, 'CAPTURA');
  assert.strictEqual(captura.length, 1);
  assert.strictEqual(captura[0].codigo, 'talisman-basico');

  // Filtro ESPECIAL
  const especial = filtrarItemsPorCategoria(inventarioEjemplo, 'ESPECIAL');
  assert.strictEqual(especial.length, 1);
  assert.strictEqual(especial[0].codigo, 'reliquia-luz');

  // Comprobar inmutabilidad del arreglo de entrada
  assert.deepStrictEqual(inventarioEjemplo, copiaOriginal, 'El inventario original no debió ser alterado');
});

test('normalizarCantidadCompra: acota y limpia valores enteros en [1, 99]', () => {
  assert.strictEqual(normalizarCantidadCompra(0), 1);
  assert.strictEqual(normalizarCantidadCompra(-5), 1);
  assert.strictEqual(normalizarCantidadCompra(Number.NaN), 1);
  assert.strictEqual(normalizarCantidadCompra(1), 1);
  assert.strictEqual(normalizarCantidadCompra(5.7), 5);
  assert.strictEqual(normalizarCantidadCompra(50), 50);
  assert.strictEqual(normalizarCantidadCompra(99), 99);
  assert.strictEqual(normalizarCantidadCompra(100), 99);
  assert.strictEqual(normalizarCantidadCompra(9999), 99);
});

test('calcularResumenCompra: calcula lotes x1, x5, x10 y evalúa suficiencia de monedas', () => {
  const precioUnitario = 30; // Poción menor
  const saldoMonedas = 200;

  // Lote x1 (30 monedas)
  const resumen1 = calcularResumenCompra(precioUnitario, LOTES_COMPRA[0], saldoMonedas);
  assert.strictEqual(resumen1.cantidad, 1);
  assert.strictEqual(resumen1.costoTotal, 30);
  assert.strictEqual(resumen1.saldoRestante, 170);
  assert.strictEqual(resumen1.puedeComprar, true);

  // Lote x5 (150 monedas)
  const resumen5 = calcularResumenCompra(precioUnitario, LOTES_COMPRA[1], saldoMonedas);
  assert.strictEqual(resumen5.cantidad, 5);
  assert.strictEqual(resumen5.costoTotal, 150);
  assert.strictEqual(resumen5.saldoRestante, 50);
  assert.strictEqual(resumen5.puedeComprar, true);

  // Lote x10 (300 monedas) -> Saldo insuficiente
  const resumen10 = calcularResumenCompra(precioUnitario, LOTES_COMPRA[2], saldoMonedas);
  assert.strictEqual(resumen10.cantidad, 10);
  assert.strictEqual(resumen10.costoTotal, 300);
  assert.strictEqual(resumen10.saldoRestante, -100);
  assert.strictEqual(resumen10.puedeComprar, false);
});

test('calcularVistaPreviaCuracion: respeta INV-03 acotando al hpMaximo y señalando salud completa', () => {
  // Caso 1: Curación ordinaria dentro del rango (15 + 20 = 35 <= 50)
  const c1 = calcularVistaPreviaCuracion(15, 50, 20);
  assert.strictEqual(c1.hpNuevo, 35);
  assert.strictEqual(c1.curacionEfectiva, 20);
  assert.strictEqual(c1.yaSaludCompleta, false);

  // Caso 2: Sobrecuración evitada (40 + 20 = 60 -> acotado a 50)
  const c2 = calcularVistaPreviaCuracion(40, 50, 20);
  assert.strictEqual(c2.hpNuevo, 50);
  assert.strictEqual(c2.curacionEfectiva, 10);
  assert.strictEqual(c2.yaSaludCompleta, false);

  // Caso 3: Criatura con salud completa ya al tope (50/50 HP)
  const c3 = calcularVistaPreviaCuracion(50, 50, 20);
  assert.strictEqual(c3.hpNuevo, 50);
  assert.strictEqual(c3.curacionEfectiva, 0);
  assert.strictEqual(c3.yaSaludCompleta, true);
});

test('Contratos tipados: RespuestaCatalogoTienda y RespuestaInventario modelan metadatos enriquecidos', () => {
  const catalogo: RespuestaCatalogoTienda = {
    saldoMonedas: 350,
    servicioDisponible: true,
    ubicacionActual: {
      id: 'LOC-02',
      nombre: 'Puesto Fronterizo del Río',
      esSegura: true,
    },
    items: [
      {
        codigo: 'pocion-menor',
        nombre: 'Poción Menor',
        descripcion: 'Restaura 20 HP',
        tipo: 'CURACION',
        precioCompra: 30,
        efectoValor: 20,
        cantidadEnInventario: 2,
      },
    ],
  };

  assert.strictEqual(catalogo.servicioDisponible, true);
  assert.strictEqual(catalogo.items[0].cantidadEnInventario, 2);
  assert.strictEqual(catalogo.items[0].efectoValor, 20);

  const inventario: RespuestaInventario = {
    monedas: 350,
    capacidadMaxima: 20,
    ranurasOcupadas: 3,
    totalUnidades: 8,
    items: [
      {
        codigo: 'talisman-basico',
        nombre: 'Talismán Básico',
        tipo: 'CAPTURA',
        cantidad: 5,
      },
    ],
  };

  assert.strictEqual(inventario.capacidadMaxima, 20);
  assert.strictEqual(inventario.ranurasOcupadas, 3);
  assert.strictEqual(inventario.totalUnidades, 8);

  const respuestaComprar: RespuestaComprarTienda = {
    itemCodigo: 'pocion-menor',
    nombre: 'Poción Menor',
    cantidadComprada: 5,
    precioUnitario: 30,
    costoTotal: 150,
    saldoRestante: 200,
    cantidadEnInventario: 7,
  };

  assert.strictEqual(respuestaComprar.cantidadComprada, 5);
  assert.strictEqual(respuestaComprar.costoTotal, 150);

  const respuestaUsar: RespuestaUsarItem = {
    criaturaId: 'c-1',
    criaturaNombre: 'Lobo',
    hpPrevio: 20,
    hpNuevo: 30,
    hpMaximo: 30,
    curacionAplicada: 10,
    cantidadRestante: 1,
  };

  assert.strictEqual(respuestaUsar.curacionAplicada, 10);
  assert.strictEqual(respuestaUsar.cantidadRestante, 1);
});

test('Regla R1: PantallaInventario.tsx no contiene emojis unicode', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaInventario.tsx');
  const contenido = readFileSync(ruta, 'utf-8');
  const tieneEmojis = /\p{Extended_Pictographic}/u.test(contenido);
  assert.strictEqual(
    tieneEmojis,
    false,
    'Se detectaron emojis unicode no permitidos en PantallaInventario.tsx',
  );
});

test('Regla R1: PantallaTienda.tsx no contiene emojis unicode', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaTienda.tsx');
  const contenido = readFileSync(ruta, 'utf-8');
  const tieneEmojis = /\p{Extended_Pictographic}/u.test(contenido);
  assert.strictEqual(
    tieneEmojis,
    false,
    'Se detectaron emojis unicode no permitidos en PantallaTienda.tsx',
  );
});

test('Multimedia y Audio: assets.ts sintetiza tonos retro para monedas/compra y curar/pocion', () => {
  const ruta = join(__dirname, '../src/lib/assets.ts');
  const contenido = readFileSync(ruta, 'utf-8');

  assert.strictEqual(
    contenido.includes('monedas') && contenido.includes('compra'),
    true,
    'assets.ts debe sintetizar tonos para monedas y compra',
  );

  assert.strictEqual(
    contenido.includes('curar') && contenido.includes('pocion'),
    true,
    'assets.ts debe sintetizar tonos para curar y pocion',
  );
});
