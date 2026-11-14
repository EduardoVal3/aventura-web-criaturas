import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  obtenerImagenCriatura,
  RUTAS_PLACEHOLDERS,
} from '../src/lib/assets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const RAIZ_REPO = resolve(__dirname, '../../..');
const RUTA_CRIATURAS_WEB = join(RAIZ_REPO, 'apps/web/public/assets/criaturas');
const RUTA_BESTIARIO_API = join(
  RAIZ_REPO,
  'apps/api/src/modulos/externo/bestiario-canonico.ts',
);

/**
 * Extrae los 30 slugs canónicos declarados en el bestiario oficial del servidor.
 */
function leerSlugsCanonicos(): string[] {
  const codigo = readFileSync(RUTA_BESTIARIO_API, 'utf8');
  const slugs: string[] = [];
  const patron = /^\s+slug:\s*'([a-z0-9-]+)',\s*$/gm;
  let coincidencia: RegExpExecArray | null;
  while ((coincidencia = patron.exec(codigo)) !== null) {
    slugs.push(coincidencia[1]);
  }
  return slugs;
}

test('Sprites de criaturas: correspondencia 1 a 1 con las 30 especies canónicas sin huecos', () => {
  const slugs = leerSlugsCanonicos();
  assert.strictEqual(slugs.length, 30, 'El bestiario canónico debe definir exactamente 30 slugs');
  assert.strictEqual(new Set(slugs).size, 30, 'Los slugs canónicos deben ser únicos');

  const archivosWebp = readdirSync(RUTA_CRIATURAS_WEB)
    .filter((nombre) => nombre.endsWith('.webp'))
    .sort();

  assert.strictEqual(
    archivosWebp.length,
    30,
    'Deben existir exactamente 30 archivos .webp en apps/web/public/assets/criaturas',
  );

  for (const slug of slugs) {
    const rutaArchivo = join(RUTA_CRIATURAS_WEB, `${slug}.webp`);
    assert.ok(existsSync(rutaArchivo), `Falta el sprite WebP para el slug canónico: ${slug}`);

    const rutaUrl = obtenerImagenCriatura(slug);
    assert.strictEqual(rutaUrl, `/assets/criaturas/${slug}.webp`);
    assert.notStrictEqual(rutaUrl, RUTAS_PLACEHOLDERS.criatura);
  }
});

test('Sprites de criaturas: todos cumplen formato WebP VP8X 512x512 con canal alfa y peso acotado', () => {
  const slugs = leerSlugsCanonicos();
  let pesoTotalBytes = 0;

  for (const slug of slugs) {
    const rutaArchivo = join(RUTA_CRIATURAS_WEB, `${slug}.webp`);
    const stats = statSync(rutaArchivo);
    pesoTotalBytes += stats.size;

    assert.ok(
      stats.size >= 15 * 1024 && stats.size <= 150 * 1024,
      `${slug}.webp tiene peso fuera de rango esperado: ${stats.size} bytes`,
    );

    const encabezado = readFileSync(rutaArchivo).subarray(0, 32);
    assert.strictEqual(encabezado.subarray(0, 4).toString('ascii'), 'RIFF', `${slug}.webp debe iniciar con RIFF`);
    assert.strictEqual(encabezado.subarray(8, 12).toString('ascii'), 'WEBP', `${slug}.webp debe ser WEBP válido`);
    assert.strictEqual(encabezado.subarray(12, 16).toString('ascii'), 'VP8X', `${slug}.webp debe incluir chunk extendido VP8X`);

    const banderasVp8x = encabezado[20];
    assert.ok((banderasVp8x & 0x10) !== 0, `${slug}.webp debe habilitar canal alfa en VP8X`);

    const ancho = 1 + (encabezado[24] | (encabezado[25] << 8) | (encabezado[26] << 16));
    const alto = 1 + (encabezado[27] | (encabezado[28] << 8) | (encabezado[29] << 16));
    assert.strictEqual(ancho, 512, `${slug}.webp debe medir 512px de ancho`);
    assert.strictEqual(alto, 512, `${slug}.webp debe medir 512px de alto`);
  }

  assert.ok(
    pesoTotalBytes <= 2.5 * 1024 * 1024,
    `El lote total no debe superar 2.5 MB (actual: ${(pesoTotalBytes / 1024 / 1024).toFixed(2)} MB)`,
  );
});
