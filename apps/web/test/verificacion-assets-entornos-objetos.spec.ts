import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  obtenerImagenObjeto,
  obtenerImagenZona,
  RUTAS_PLACEHOLDERS,
  sanitizarSlugZona,
} from '../src/lib/assets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RAIZ_REPO = resolve(__dirname, '../../..');
const RUTA_ASSETS = join(RAIZ_REPO, 'apps/web/public/assets');
const RUTA_MUNDO_API = join(RAIZ_REPO, 'apps/api/src/modulos/mundo/mundo.service.ts');
const RUTA_SEED_API = join(RAIZ_REPO, 'apps/api/prisma/seed.ts');

/**
 * Extrae ubicaciones y zonas silvestres canónicas desde MundoService.
 */
function leerUbicacionesCanonicas(): { todas: string[]; zonasCombate: string[] } {
  const codigo = readFileSync(RUTA_MUNDO_API, 'utf8');
  const patron = /nombre:\s*'([^']+)',\s*tipo:\s*'(LOCALIDAD|ZONA)'/g;
  const todas: string[] = [];
  const zonasCombate: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = patron.exec(codigo)) !== null) {
    const slug = sanitizarSlugZona(m[1]);
    todas.push(slug);
    if (m[2] === 'ZONA') {
      zonasCombate.push(slug);
    }
  }
  return { todas, zonasCombate };
}

/**
 * Extrae los códigos de ítems sembrados en el catálogo oficial del bazar.
 */
function leerObjetosCanonicos(): string[] {
  const codigo = readFileSync(RUTA_SEED_API, 'utf8');
  const bloque = codigo.slice(codigo.indexOf('async function sembrarObjetos()'));
  const patron = /codigo:\s*'([a-z0-9-]+)'/g;
  const codigos: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = patron.exec(bloque)) !== null) {
    codigos.push(m[1]);
  }
  return codigos;
}

/**
 * Lee ancho y alto reales desde encabezado WebP VP8 lossy o VP8X extendido.
 */
function leerEncabezadoWebp(ruta: string): { chunk: string; ancho: number; alto: number; tieneAlfa: boolean } {
  const buf = readFileSync(ruta).subarray(0, 32);
  assert.strictEqual(buf.subarray(0, 4).toString('ascii'), 'RIFF', `${ruta} debe iniciar con RIFF`);
  assert.strictEqual(buf.subarray(8, 12).toString('ascii'), 'WEBP', `${ruta} debe ser WEBP válido`);
  const chunk = buf.subarray(12, 16).toString('ascii');

  if (chunk === 'VP8X') {
    const flags = buf[20];
    const ancho = 1 + (buf[24] | (buf[25] << 8) | (buf[26] << 16));
    const alto = 1 + (buf[27] | (buf[28] << 8) | (buf[29] << 16));
    return { chunk, ancho, alto, tieneAlfa: (flags & 0x10) !== 0 };
  }

  assert.strictEqual(chunk, 'VP8 ', `${ruta} debe usar chunk VP8 o VP8X`);
  const ancho = buf.readUInt16LE(26) & 0x3fff;
  const alto = buf.readUInt16LE(28) & 0x3fff;
  return { chunk, ancho, alto, tieneAlfa: false };
}

test('Zonas y arenas de combate: correspondencia 1 a 1 en formato WebP 800x450 y peso acotado', () => {
  const { todas, zonasCombate } = leerUbicacionesCanonicas();
  assert.strictEqual(todas.length, 9, 'MundoService debe declarar 9 ubicaciones canónicas');
  assert.strictEqual(zonasCombate.length, 6, 'MundoService debe declarar 6 zonas silvestres');

  const dirZonas = join(RUTA_ASSETS, 'zonas');
  const dirArenas = join(RUTA_ASSETS, 'battlegrounds');

  assert.strictEqual(readdirSync(dirZonas).filter((f) => f.endsWith('.webp')).length, 9);
  assert.strictEqual(readdirSync(dirArenas).filter((f) => f.endsWith('.webp')).length, 6);

  for (const slug of todas) {
    const archivo = join(dirZonas, `${slug}.webp`);
    assert.ok(existsSync(archivo), `Falta paisaje de zona/localidad: ${slug}.webp`);
    assert.strictEqual(obtenerImagenZona(slug), `/assets/zonas/${slug}.webp`);
    assert.notStrictEqual(obtenerImagenZona(slug), RUTAS_PLACEHOLDERS.zona);

    const meta = leerEncabezadoWebp(archivo);
    assert.strictEqual(meta.ancho, 800, `zonas/${slug}.webp debe medir 800px de ancho`);
    assert.strictEqual(meta.alto, 450, `zonas/${slug}.webp debe medir 450px de alto`);
    const size = statSync(archivo).size;
    assert.ok(size >= 25 * 1024 && size <= 160 * 1024, `zonas/${slug}.webp peso fuera de rango: ${size}`);
  }

  for (const slug of zonasCombate) {
    const archivo = join(dirArenas, `${slug}.webp`);
    assert.ok(existsSync(archivo), `Falta escenario de combate: ${slug}.webp`);

    const meta = leerEncabezadoWebp(archivo);
    assert.strictEqual(meta.ancho, 800, `battlegrounds/${slug}.webp debe medir 800px de ancho`);
    assert.strictEqual(meta.alto, 450, `battlegrounds/${slug}.webp debe medir 450px de alto`);
    const size = statSync(archivo).size;
    assert.ok(size >= 25 * 1024 && size <= 160 * 1024, `battlegrounds/${slug}.webp peso fuera de rango: ${size}`);
  }
});

test('Objetos del bazar: correspondencia 1 a 1 en formato WebP VP8X 256x256 con canal alfa', () => {
  const codigos = leerObjetosCanonicos();
  assert.strictEqual(codigos.length, 4, 'El catálogo inicial debe declarar 4 objetos');

  const dirObjetos = join(RUTA_ASSETS, 'objetos');
  assert.strictEqual(readdirSync(dirObjetos).filter((f) => f.endsWith('.webp')).length, 4);

  for (const codigo of codigos) {
    const archivo = join(dirObjetos, `${codigo}.webp`);
    assert.ok(existsSync(archivo), `Falta sprite del objeto: ${codigo}.webp`);
    assert.strictEqual(obtenerImagenObjeto(codigo), `/assets/objetos/${codigo}.webp`);
    assert.notStrictEqual(obtenerImagenObjeto(codigo), RUTAS_PLACEHOLDERS.objeto);

    const meta = leerEncabezadoWebp(archivo);
    assert.strictEqual(meta.chunk, 'VP8X', `objetos/${codigo}.webp debe incluir chunk VP8X`);
    assert.ok(meta.tieneAlfa, `objetos/${codigo}.webp debe conservar canal alfa transparente`);
    assert.strictEqual(meta.ancho, 256, `objetos/${codigo}.webp debe medir 256px de ancho`);
    assert.strictEqual(meta.alto, 256, `objetos/${codigo}.webp debe medir 256px de alto`);
    const size = statSync(archivo).size;
    assert.ok(size >= 5 * 1024 && size <= 60 * 1024, `objetos/${codigo}.webp peso fuera de rango: ${size}`);
  }
});
