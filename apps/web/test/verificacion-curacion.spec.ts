import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  clasificarEstadoVital,
  etiquetaEstadoVital,
  calcularDeltaCuracion,
  type EstadoVitalCriatura,
} from '../src/lib/curacion-santuario.ts';

import type {
  RespuestaRestaurar,
  DetalleCriaturaRestaurada,
  CriaturaEquipo,
} from '../src/api/ApiJuego.ts';

import {
  obtenerImagenCriatura,
  obtenerImagenZona,
} from '../src/lib/assets.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('clasificarEstadoVital: clasifica adecuadamente los 3 estados tácticos y bordes', () => {
  // 1. Plena vitalidad (hpActual >= hpMaximo)
  assert.strictEqual(clasificarEstadoVital(30, 30), 'PLENA_VITALIDAD');
  assert.strictEqual(clasificarEstadoVital(35, 30), 'PLENA_VITALIDAD');
  assert.strictEqual(etiquetaEstadoVital('PLENA_VITALIDAD'), 'PLENA VITALIDAD');

  // 2. Herida (0 < hpActual < hpMaximo)
  assert.strictEqual(clasificarEstadoVital(1, 30), 'HERIDA');
  assert.strictEqual(clasificarEstadoVital(15, 30), 'HERIDA');
  assert.strictEqual(clasificarEstadoVital(29, 30), 'HERIDA');
  assert.strictEqual(etiquetaEstadoVital('HERIDA'), 'HERIDA');

  // 3. Debilitada / Caída (hpActual <= 0)
  assert.strictEqual(clasificarEstadoVital(0, 30), 'DEBILITADA');
  assert.strictEqual(clasificarEstadoVital(-5, 30), 'DEBILITADA');
  assert.strictEqual(etiquetaEstadoVital('DEBILITADA'), 'DEBILITADA / CAÍDA');
});

test('calcularDeltaCuracion: respeta INV-03 y calcula deltas exactos sin sobrecuración', () => {
  // Criatura sana: delta 0
  assert.strictEqual(calcularDeltaCuracion(30, 30), 0);
  assert.strictEqual(calcularDeltaCuracion(40, 30), 0);

  // Criatura herida: delta exacto faltante
  assert.strictEqual(calcularDeltaCuracion(12, 30), 18);
  assert.strictEqual(calcularDeltaCuracion(1, 25), 24);

  // Criatura caída (HP=0): delta 100% de hpMaximo (resurrección)
  assert.strictEqual(calcularDeltaCuracion(0, 35), 35);
  assert.strictEqual(calcularDeltaCuracion(-10, 50), 50);
});

test('Contratos tipados: RespuestaRestaurar y DetalleCriaturaRestaurada son consistentes', () => {
  const detalle: DetalleCriaturaRestaurada = {
    criaturaId: 'cri-1',
    nombre: 'Lobo Alfa',
    hpPrevio: 12,
    hpNuevo: 30,
    hpMaximo: 30,
    hpRestaurado: 18,
    fueRevivida: false,
  };

  const respuesta: RespuestaRestaurar = {
    mensaje: 'Todas las criaturas de tu equipo han sido completamente restauradas.',
    criaturasRestauradas: 3,
    criaturasCuradas: 2,
    criaturasRevividas: 1,
    hpTotalRestaurado: 53,
    ubicacionNombre: 'Villa Serena',
    detalles: [detalle],
  };

  assert.strictEqual(respuesta.criaturasRestauradas, 3);
  assert.strictEqual(respuesta.criaturasCuradas, 2);
  assert.strictEqual(respuesta.criaturasRevividas, 1);
  assert.strictEqual(respuesta.hpTotalRestaurado, 53);
  assert.strictEqual(respuesta.detalles?.length, 1);
  assert.strictEqual(respuesta.detalles[0].hpRestaurado, 18);
});

test('Multimedia y Assets: resolución de imágenes de criaturas y zonas del santuario', () => {
  const rutaCriatura = obtenerImagenCriatura('lobo-estepario');
  assert.strictEqual(rutaCriatura, '/assets/criaturas/lobo-estepario.webp');

  const rutaZona = obtenerImagenZona('villa-serena');
  assert.strictEqual(rutaZona, '/assets/zonas/villa-serena.webp');

  const placeholderCriatura = obtenerImagenCriatura(null);
  assert.strictEqual(placeholderCriatura, '/assets/placeholder-criatura.svg');
});

test('Multimedia y Audio: assets.ts sintetiza fanfarria retro de santuario / bendición', () => {
  const ruta = join(__dirname, '../src/lib/assets.ts');
  const contenido = readFileSync(ruta, 'utf-8');

  assert.strictEqual(
    contenido.includes('santuario') && contenido.includes('bendicion'),
    true,
    'assets.ts debe sintetizar tonos para santuario y bendicion',
  );

  assert.strictEqual(
    contenido.includes('523.25') && contenido.includes('1046.5'),
    true,
    'La fanfarria del santuario debe incluir las notas ascendentes de la bendición',
  );
});

test('Regla R1: PantallaCuracion.tsx no contiene emojis unicode', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaCuracion.tsx');
  const contenido = readFileSync(ruta, 'utf-8');
  const tieneEmojis = /\p{Extended_Pictographic}/u.test(contenido);
  assert.strictEqual(
    tieneEmojis,
    false,
    'Se detectaron emojis unicode no permitidos en PantallaCuracion.tsx (deben usarse iconos SVG de Lucide)',
  );
});

test('Accesibilidad y Heurística: PantallaCuracion.tsx no contiene el anti-patrón <Link><Button/></Link>', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaCuracion.tsx');
  const contenido = readFileSync(ruta, 'utf-8');

  const tieneLinkButton = /<Link[^>]*>\s*<Button/i.test(contenido);
  assert.strictEqual(
    tieneLinkButton,
    false,
    'PantallaCuracion.tsx no debe anidar elementos <Button> dentro de <Link>',
  );
});

test('Hardening y Cinemática: PantallaCuracion.tsx incluye aria-busy, estado retro y animaciones', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaCuracion.tsx');
  const contenido = readFileSync(ruta, 'utf-8');

  assert.strictEqual(
    contenido.includes('aria-busy'),
    true,
    'Debe declarar aria-busy={restaurando} para hardening contra doble clic',
  );

  assert.strictEqual(
    contenido.includes('CANALIZANDO BENDICIÓN...'),
    true,
    'Debe exhibir el texto retro de carga CANALIZANDO BENDICIÓN...',
  );

  assert.strictEqual(
    contenido.includes('anim-curacion') && contenido.includes('anim-curacion-flotante'),
    true,
    'Debe incorporar las clases anim-curacion y anim-curacion-flotante para la secuencia cinemática',
  );

  assert.strictEqual(
    contenido.includes('obtenerImagenCriatura') && contenido.includes('manejarErrorImagen'),
    true,
    'Debe resolver sprites pixelados con soporte de degradación SVG',
  );

  assert.strictEqual(
    contenido.includes('reproducirSonido("santuario")'),
    true,
    'Debe disparar la fanfarria sonora retro santuario al completar la restauración',
  );
});

test('Hardening, Ergonomía y Estética Retro-Brutalist: PantallaCuracion cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y confinamiento sin overflow', () => {
  const ruta = join(__dirname, '../src/paginas/PantallaCuracion.tsx');
  const contenido = readFileSync(ruta, 'utf-8');

  // Confinamiento responsive sin overflow horizontal
  assert.strictEqual(
    contenido.includes('overflow-x-hidden') && contenido.includes('max-w-4xl'),
    true,
    'Debe contener el layout con overflow-x-hidden y max-w-4xl para evitar desbordamiento horizontal en móviles de 360px',
  );

  // Marcos y sombras sólidas ortogonales retro-brutalistas
  assert.strictEqual(
    contenido.includes('border-4 border-black') && contenido.includes('border-2 border-black'),
    true,
    'Debe implementar bordes gruesos negros retro-brutalistas (border-4 border-black y border-2 border-black)',
  );

  assert.strictEqual(
    contenido.includes('shadow-[6px_6px_0_0_#000]') &&
      contenido.includes('shadow-[4px_4px_0_0_#000]') &&
      contenido.includes('shadow-[2px_2px_0_0_#000]'),
    true,
    'Debe proyectar sombras sólidas ortogonales 8-bit (6px, 4px y 2px)',
  );

  // Ausencia de truncamiento rígido en nombres y apodos
  assert.strictEqual(
    contenido.includes('truncate'),
    false,
    'No debe usar truncate rígido en los textos y nombres de criaturas; debe usar envoltura flexible break-words',
  );

  assert.strictEqual(
    contenido.includes('break-words'),
    true,
    'Debe asegurar lectura completa de nombres y descripciones con break-words',
  );

  // Tipografía retro e insignias
  assert.strictEqual(
    contenido.includes('SANTUARIO ANCESTRAL') && contenido.includes('SERVICIO GRATUITO'),
    true,
    'Debe exhibir las insignias retro ancestral y servicio gratuito',
  );

  assert.strictEqual(
    contenido.includes('HealthBar'),
    true,
    'Debe renderizar la barra de salud retro HealthBar para cada criatura',
  );
});
