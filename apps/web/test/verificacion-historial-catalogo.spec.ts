import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TRADUCCION_TIPOS_ESPECIE,
  TRADUCCION_ELEMENTOS,
  calcularArquetipoCriatura,
  filtrarEspeciesCatalogo,
  resolverCategoriaEvento,
  formatearFechaAmigable,
  filtrarEventosHistorial,
} from '../src/lib/catalogo-historial.ts';

import type { EspecieCatalogo, EventoHistorial } from '../src/api/ApiJuego.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

test('Compendio: TRADUCCION_TIPOS_ESPECIE cubre los tipos biológicos del SRD 5.2 en español', () => {
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['beast'], 'Bestia');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['monstrosity'], 'Monstruosidad');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['undead'], 'No-muerto');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['elemental'], 'Elemental');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['construct'], 'Autómata');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['plant'], 'Planta');
  assert.strictEqual(TRADUCCION_TIPOS_ESPECIE['dragon'], 'Dragón');
});

test('Compendio: TRADUCCION_ELEMENTOS cubre las 6 afinidades elementales de Aethelgard', () => {
  const claves = Object.keys(TRADUCCION_ELEMENTOS);
  assert.deepStrictEqual(claves, ['fisico', 'fuego', 'agua', 'natura', 'sombra', 'luz']);
  assert.strictEqual(TRADUCCION_ELEMENTOS['fuego'].nombre, 'Fuego');
  assert.strictEqual(TRADUCCION_ELEMENTOS['agua'].nombre, 'Agua');
  assert.strictEqual(TRADUCCION_ELEMENTOS['sombra'].nombre, 'Sombra');
});

test('Compendio: calcularArquetipoCriatura clasifica fielmente las 4 vertientes tácticas', () => {
  // Tanque
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 40, ataqueBase: 42, defensaBase: 100, velocidadBase: 41 }),
    'TANQUE',
  );
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 95, ataqueBase: 72, defensaBase: 68, velocidadBase: 47 }),
    'TANQUE',
  );

  // Atacante
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 51, ataqueBase: 100, defensaBase: 58, velocidadBase: 67 }),
    'ATACANTE',
  );
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 53, ataqueBase: 76, defensaBase: 58, velocidadBase: 50 }),
    'ATACANTE',
  );

  // Veloz
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 53, ataqueBase: 68, defensaBase: 51, velocidadBase: 89 }),
    'VELOZ',
  );
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 62, ataqueBase: 68, defensaBase: 68, velocidadBase: 100 }),
    'VELOZ',
  );

  // Equilibrado
  assert.strictEqual(
    calcularArquetipoCriatura({ hpBase: 30, ataqueBase: 42, defensaBase: 58, velocidadBase: 50 }),
    'EQUILIBRADO',
  );
});

test('Compendio: filtrarEspeciesCatalogo combina tipo, arquetipo, rareza especial y búsqueda textual', () => {
  const listaPrueba: EspecieCatalogo[] = [
    {
      slug: 'lobo-gris',
      nombre: 'Lobo Gris',
      tipo: 'beast',
      challengeRating: 0.25,
      hpBase: 30,
      ataqueBase: 42,
      defensaBase: 58,
      velocidadBase: 50,
      tasaCaptura: 0.88,
      esEspecial: false,
      descripcion: 'Cazador en manada ágil y coordinado.',
    },
    {
      slug: 'armadura-animada',
      nombre: 'Armadura Animada',
      tipo: 'construct',
      challengeRating: 1,
      hpBase: 40,
      ataqueBase: 42,
      defensaBase: 100,
      velocidadBase: 41,
      tasaCaptura: 0.83,
      esEspecial: false,
      descripcion: 'Coraza metálica encantada.',
    },
    {
      slug: 'hidra-de-las-marismas',
      nombre: 'Hidra de las Marismas',
      tipo: 'monstrosity',
      challengeRating: 8,
      hpBase: 95,
      ataqueBase: 72,
      defensaBase: 68,
      velocidadBase: 47,
      tasaCaptura: 0.34,
      esEspecial: true,
      descripcion: 'Colosal reptil serpentino de múltiples cabezas.',
    },
    {
      slug: 'elemental-de-aire',
      nombre: 'Elemental de Aire',
      tipo: 'elemental',
      challengeRating: 5,
      hpBase: 62,
      ataqueBase: 68,
      defensaBase: 68,
      velocidadBase: 100,
      tasaCaptura: 0.55,
      esEspecial: false,
      descripcion: 'Vórtice de viento huracanado.',
    },
    {
      slug: 'behir-abismo',
      nombre: 'Behir del Abismo',
      tipo: 'monstrosity',
      challengeRating: 11,
      hpBase: 85,
      ataqueBase: 95,
      defensaBase: 90,
      velocidadBase: 85,
      tasaCaptura: 0.15,
      esEspecial: true,
      esLegendaria: true,
      elemento: 'sombra',
      descripcion: 'Serpentina criatura colosal de relámpagos oscuros.',
    },
  ];

  // Filtro por tipo
  const soloConstruct = filtrarEspeciesCatalogo(listaPrueba, { tipo: 'construct' });
  assert.strictEqual(soloConstruct.length, 1);
  assert.strictEqual(soloConstruct[0].slug, 'armadura-animada');

  // Filtro por arquetipo
  const soloTanques = filtrarEspeciesCatalogo(listaPrueba, { arquetipo: 'TANQUE' });
  assert.strictEqual(soloTanques.length, 2);

  // Filtro por criaturas especiales
  const soloEspeciales = filtrarEspeciesCatalogo(listaPrueba, { arquetipo: 'ESPECIALES' });
  assert.strictEqual(soloEspeciales.length, 2);

  // Filtro por criaturas legendarias
  const soloLegendarias = filtrarEspeciesCatalogo(listaPrueba, { arquetipo: 'LEGENDARIAS' });
  assert.strictEqual(soloLegendarias.length, 1);
  assert.strictEqual(soloLegendarias[0].slug, 'behir-abismo');

  // Filtro por búsqueda textual insensible a acentos
  const busquedaHura = filtrarEspeciesCatalogo(listaPrueba, { busqueda: 'huracanado' });
  assert.strictEqual(busquedaHura.length, 1);
  assert.strictEqual(busquedaHura[0].slug, 'elemental-de-aire');

  const busquedaHidra = filtrarEspeciesCatalogo(listaPrueba, { busqueda: 'hidra' });
  assert.strictEqual(busquedaHidra.length, 1);
  assert.strictEqual(busquedaHidra[0].slug, 'hidra-de-las-marismas');
});

test('Bitácora: resolverCategoriaEvento normaliza coherentemente todos los tipos del servidor', () => {
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '1', tipo: 'CAPTURA', descripcion: '', marcaTiempo: '' }), 'CAPTURA');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '2', tipo: 'COMERCIO', descripcion: '', marcaTiempo: '' }), 'TIENDA');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '3', tipo: 'TIENDA', descripcion: '', marcaTiempo: '' }), 'TIENDA');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '4', tipo: 'COMPRA', descripcion: '', marcaTiempo: '' }), 'TIENDA');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '5', tipo: 'CURACION', descripcion: '', marcaTiempo: '' }), 'CURACION');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '6', tipo: 'SANTUARIO', descripcion: '', marcaTiempo: '' }), 'CURACION');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '7', tipo: 'COMBATE', descripcion: '', marcaTiempo: '' }), 'COMBATE');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '8', tipo: 'VICTORIA_COMBATE', descripcion: '', marcaTiempo: '' }), 'COMBATE');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '9', tipo: 'DERROTA_COMBATE', descripcion: '', marcaTiempo: '' }), 'COMBATE');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '10', tipo: 'HUIDA', descripcion: '', marcaTiempo: '' }), 'COMBATE');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '11', tipo: 'PROGRESO', descripcion: '', marcaTiempo: '' }), 'COMBATE');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '12', tipo: 'EXPLORACION', descripcion: '', marcaTiempo: '' }), 'EXPLORACION');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '13', tipo: 'ENCUENTRO', descripcion: '', marcaTiempo: '' }), 'EXPLORACION');
  assert.strictEqual(resolverCategoriaEvento({ eventoId: '14', tipo: 'OBJETO', descripcion: '', marcaTiempo: '' }), 'EXPLORACION');
});

test('Bitácora: formatearFechaAmigable y filtrarEventosHistorial operan con robustez', () => {
  const tiempo = formatearFechaAmigable('2026-10-16T14:30:00.000Z');
  assert.ok(tiempo.hora.length === 5, 'Hora debe tener formato HH:mm');
  assert.ok(tiempo.fecha.length === 10, 'Fecha debe tener formato DD/MM/YYYY');

  // Degradación segura ante fecha inválida
  const degradada = formatearFechaAmigable('fecha-invalida');
  assert.strictEqual(degradada.hora, '--:--');
  assert.strictEqual(degradada.fecha, 'fecha-invalida');

  const eventos: EventoHistorial[] = [
    { eventoId: 'e-1', tipo: 'VICTORIA_COMBATE', descripcion: 'Victoria sobre Lobo Gris', marcaTiempo: '2026-10-16T12:00:00.000Z' },
    { eventoId: 'e-2', tipo: 'CAPTURA', descripcion: 'Capturado Grifo salvaje', marcaTiempo: '2026-10-16T12:10:00.000Z' },
    { eventoId: 'e-3', tipo: 'COMPRA', descripcion: 'Comprada Poción Mayor', marcaTiempo: '2026-10-16T12:20:00.000Z' },
  ];

  // Filtro por categoría
  const soloCombate = filtrarEventosHistorial(eventos, 'COMBATE', '');
  assert.strictEqual(soloCombate.length, 1);
  assert.strictEqual(soloCombate[0].eventoId, 'e-1');

  // Filtro por búsqueda
  const busquedaGrifo = filtrarEventosHistorial(eventos, 'TODOS', 'grifo');
  assert.strictEqual(busquedaGrifo.length, 1);
  assert.strictEqual(busquedaGrifo[0].eventoId, 'e-2');
});

test('Auditoría estática de código: PantallaCatalogo erradica N+1, usa sprites, 30 especies, legendarias y 4 slots', () => {
  const rutaCatalogo = join(__dirname, '../src/paginas/PantallaCatalogo.tsx');
  const codigo = readFileSync(rutaCatalogo, 'utf-8');

  // 1. Erradicación del patrón N+1
  assert.ok(
    !codigo.includes('Promise.all(res.especies.map') && !codigo.includes('api.obtenerEspecie(esp.slug)'),
    'PantallaCatalogo no debe ejecutar Promise.all iterando peticiones individuales obtenerEspecie (erradicación N+1)',
  );

  // 2. Uso de sprites pixel-art
  assert.ok(codigo.includes('obtenerImagenCriatura'), 'Debe utilizar obtenerImagenCriatura');
  assert.ok(codigo.includes('manejarErrorImagen'), 'Debe utilizar manejarErrorImagen');
  assert.ok(codigo.includes('pixelated'), 'Debe aplicar la clase retro pixelated');

  // 3. Modal sellado contra overflow
  assert.ok(codigo.includes('w-[calc(100vw-2rem)]'), 'Modal debe acotarse al ancho de pantalla móvil');
  assert.ok(codigo.includes('overflow-hidden'), 'Modal debe prevenir overflow horizontal');

  // 4. Hardening y accesibilidad
  assert.ok(codigo.includes('aria-busy={cargando}'), 'Botón de actualización debe tener aria-busy');
  assert.ok(!codigo.includes('<Link to') || !codigo.includes('<Button'), 'No debe anidar Button dentro de Link');

  // 5. Soporte de 30 especies canónicas, insignia Crown y 4 slots tácticos sin .slice(0, 3)
  assert.ok(codigo.includes('30 ESPECIES SRD 5.2'), 'Debe reflejar 30 especies canónicas');
  assert.ok(codigo.includes('Crown'), 'Debe importar y utilizar el icono Crown para legendarias');
  assert.ok(codigo.includes('LEGENDARIO'), 'Debe desplegar badge de LEGENDARIO');
  assert.ok(!codigo.includes('.slice(0, 3)'), 'No debe recortar movimientos con slice(0, 3), debe mostrar los 4 slots');
  assert.ok(codigo.includes('M{numSlot}'), 'Debe identificar los slots M1..M4');
});

test('Auditoría estática de código: PantallaCombate gestiona 4 slots con Furia bloqueada y hardening', () => {
  const rutaCombate = join(__dirname, '../src/paginas/PantallaCombate.tsx');
  const codigo = readFileSync(rutaCombate, 'utf-8');

  // 1. Despliegue de los 4 movimientos y slot de Furia bloqueado
  assert.ok(codigo.includes('esFuriaSlot4'), 'Debe identificar el slot 4 de Furia');
  assert.ok(codigo.includes('Furia (Bloqueado)'), 'Debe mostrar badge de Furia bloqueada');
  assert.ok(codigo.includes('aria-disabled={estaBloqueado}'), 'Debe incluir aria-disabled para accesibilidad');
  assert.ok(codigo.includes('aria-busy={procesandoAccion}'), 'Debe incluir aria-busy contra doble clic');
});

test('Auditoría estática de código: PantallaHistorial cuenta con iconos SVG, filtros y hardening', () => {
  const rutaHistorial = join(__dirname, '../src/paginas/PantallaHistorial.tsx');
  const codigo = readFileSync(rutaHistorial, 'utf-8');

  // 1. Iconos Lucide SVG
  assert.ok(codigo.includes('Swords'), 'Debe incluir icono Swords');
  assert.ok(codigo.includes('Sparkles'), 'Debe incluir icono Sparkles');
  assert.ok(codigo.includes('Compass'), 'Debe incluir icono Compass');
  assert.ok(codigo.includes('ShoppingBag'), 'Debe incluir icono ShoppingBag');
  assert.ok(codigo.includes('HeartPulse'), 'Debe incluir icono HeartPulse');

  // 2. Hardening y accesibilidad
  assert.ok(codigo.includes('aria-busy={actualizando}'), 'Botón de actualización debe incluir aria-busy');
  assert.ok(codigo.includes('Limpiar filtros'), 'Debe existir el botón Limpiar filtros');
  assert.ok(!codigo.includes('<Link to') || !codigo.includes('<Button'), 'No debe anidar Button dentro de Link');
});

test('Auditoría estática de código: PaginaCreditos incluye Salón de la Fama, homenaje y licencias', () => {
  const rutaCreditos = join(__dirname, '../src/paginas/PaginaCreditos.tsx');
  const codigo = readFileSync(rutaCreditos, 'utf-8');

  // 1. Homenaje al Ingeniero Claudio y cátedra ISC-305
  assert.ok(codigo.includes('Ingeniero Claudio'), 'Debe incluir homenaje al Ingeniero Claudio');
  assert.ok(codigo.includes('ISC-305'), 'Debe mencionar la asignatura ISC-305');

  // 2. Atribución obligatoria SRD 5.2 y CC BY 4.0
  assert.ok(codigo.includes('System Reference Document 5.2'), 'Debe incluir mención obligatoria al SRD 5.2');
  assert.ok(codigo.includes('Creative Commons Attribution 4.0 International'), 'Debe citar la licencia CC BY 4.0');
  assert.ok(codigo.includes('MIT License'), 'Debe incluir la licencia MIT de 8bitcn');

  // 3. Audio retro y retorno al Asentamiento
  assert.ok(codigo.includes('reproducirSonido("fanfarria")'), 'Debe incluir reproducción de fanfarria');
  assert.ok(codigo.includes('boton-volver-inicio-creditos'), 'Debe incluir el identificador del botón de retorno');
});

test('Regla R1: Cero emojis unicode en PantallaCatalogo, PantallaHistorial y PaginaCreditos', () => {
  const archivos = [
    join(__dirname, '../src/paginas/PantallaCatalogo.tsx'),
    join(__dirname, '../src/paginas/PantallaHistorial.tsx'),
    join(__dirname, '../src/paginas/PaginaCreditos.tsx'),
  ];

  const regexEmoji = /\p{Extended_Pictographic}/u;

  for (const archivo of archivos) {
    const contenido = readFileSync(archivo, 'utf-8');
    const lineas = contenido.split('\n');
    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i];
      assert.ok(
        !regexEmoji.test(linea),
        `Se encontró emoji unicode prohibido por Regla R1 en ${archivo}:${i + 1} -> ${linea.trim()}`,
      );
    }
  }
});
