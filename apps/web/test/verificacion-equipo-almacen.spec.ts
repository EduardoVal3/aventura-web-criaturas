import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { moverEnLista } from '../src/lib/orden-equipo.ts';
import type {
  RespuestaEquipo,
  RespuestaAlmacen,
  PeticionTransferirCriatura,
} from '../src/api/ApiJuego.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('moverEnLista: designar líder moviendo un elemento al índice 0', () => {
  const listaInicial = ['Ignis', 'Aqua', 'Terra', 'Aero', 'Lux', 'Umbra'];
  const resultado = moverEnLista(listaInicial, 2, 0); // Terra al frente
  assert.deepStrictEqual(resultado, ['Terra', 'Ignis', 'Aqua', 'Aero', 'Lux', 'Umbra']);
});

test('moverEnLista: subir una posición (i -> i - 1)', () => {
  const listaInicial = ['Ignis', 'Aqua', 'Terra', 'Aero', 'Lux', 'Umbra'];
  const resultado = moverEnLista(listaInicial, 3, 2); // Aero sube antes de Terra
  assert.deepStrictEqual(resultado, ['Ignis', 'Aqua', 'Aero', 'Terra', 'Lux', 'Umbra']);
});

test('moverEnLista: bajar una posición (i -> i + 1)', () => {
  const listaInicial = ['Ignis', 'Aqua', 'Terra', 'Aero', 'Lux', 'Umbra'];
  const resultado = moverEnLista(listaInicial, 0, 1); // Ignis baja después de Aqua
  assert.deepStrictEqual(resultado, ['Aqua', 'Ignis', 'Terra', 'Aero', 'Lux', 'Umbra']);
});

test('moverEnLista: índices fuera de rango o iguales devuelven copia sin alteraciones', () => {
  const listaInicial = ['Ignis', 'Aqua', 'Terra', 'Aero', 'Lux', 'Umbra'];
  assert.deepStrictEqual(moverEnLista(listaInicial, -1, 2), listaInicial);
  assert.deepStrictEqual(moverEnLista(listaInicial, 2, 99), listaInicial);
  assert.deepStrictEqual(moverEnLista(listaInicial, 2, -5), listaInicial);
  assert.deepStrictEqual(moverEnLista(listaInicial, 10, 2), listaInicial);
  assert.deepStrictEqual(moverEnLista(listaInicial, 3, 3), listaInicial);
});

test('moverEnLista: inmutabilidad de la entrada y conservación del multiconjunto de elementos', () => {
  const original = ['A', 'B', 'C'];
  const copiaOriginal = [...original];
  const resultado = moverEnLista(original, 1, 0);

  assert.deepStrictEqual(original, copiaOriginal, 'La lista original fue mutada');
  assert.strictEqual(resultado.length, original.length);
  assert.deepStrictEqual([...resultado].sort(), [...original].sort());
});

test('Contratos: RespuestaEquipo modela limiteEquipo y enLocalidadSegura', () => {
  const respuestaEquipo: RespuestaEquipo = {
    criaturas: [
      {
        criaturaId: 'c-1',
        slug: 'lobo-estepario',
        nombre: 'Lobo Alfa',
        apodo: 'Colmillo',
        nivel: 5,
        hpActual: 45,
        hpMaximo: 45,
        ataque: 14,
        defensa: 10,
        velocidad: 12,
        experiencia: 1250,
        porcentajeXp: 45,
        xpSiguienteNivel: 1500,
        xpNivelActual: 1000,
        orden: 1,
      },
    ],
    limiteEquipo: 6,
    enLocalidadSegura: true,
  };

  assert.strictEqual(respuestaEquipo.limiteEquipo, 6);
  assert.strictEqual(respuestaEquipo.enLocalidadSegura, true);
  assert.strictEqual(respuestaEquipo.criaturas[0].orden, 1);
});

test('Contratos: RespuestaAlmacen modela estadísticas completas y totalEnEquipo', () => {
  const respuestaAlmacen: RespuestaAlmacen = {
    criaturas: [
      {
        criaturaId: 'c-2',
        slug: 'golem-roca',
        nombre: 'Gólem Pétreo',
        apodo: null,
        nivel: 4,
        hpActual: 60,
        hpMaximo: 60,
        ataque: 16,
        defensa: 20,
        velocidad: 6,
        experiencia: 800,
        porcentajeXp: 20,
        orden: null,
      },
    ],
    limiteEquipo: 6,
    enLocalidadSegura: true,
    totalEnEquipo: 5,
  };

  assert.strictEqual(respuestaAlmacen.limiteEquipo, 6);
  assert.strictEqual(respuestaAlmacen.totalEnEquipo, 5);
  assert.strictEqual(respuestaAlmacen.criaturas[0].ataque, 16);
  assert.strictEqual(respuestaAlmacen.criaturas[0].defensa, 20);
  assert.strictEqual(respuestaAlmacen.criaturas[0].velocidad, 6);
});

test('Contratos: PeticionTransferirCriatura soporta intercambio atómico con intercambiarConId', () => {
  const peticionIntercambio: PeticionTransferirCriatura = {
    criaturaId: 'c-almacen',
    haciaEquipo: true,
    intercambiarConId: 'c-equipo-saliente',
  };

  assert.strictEqual(peticionIntercambio.haciaEquipo, true);
  assert.strictEqual(peticionIntercambio.intercambiarConId, 'c-equipo-saliente');
});

test('Regla R1: PantallaEquipo.tsx no contiene emojis unicode', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaEquipo.tsx');
  const contenido = readFileSync(ruta, 'utf-8');
  const tieneEmojis = /\p{Extended_Pictographic}/u.test(contenido);
  assert.strictEqual(
    tieneEmojis,
    false,
    'Se detectaron emojis unicode no permitidos en PantallaEquipo.tsx',
  );
});

test('Regla R1: PantallaAlmacen.tsx no contiene emojis unicode', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaAlmacen.tsx');
  const contenido = readFileSync(ruta, 'utf-8');
  const tieneEmojis = /\p{Extended_Pictographic}/u.test(contenido);
  assert.strictEqual(
    tieneEmojis,
    false,
    'Se detectaron emojis unicode no permitidos en PantallaAlmacen.tsx',
  );
});
