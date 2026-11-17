import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  TRADUCCION_TIPOS_ESPECIE,
  TRADUCCION_ELEMENTOS,
  calcularArquetipoCriatura,
  calcularPresupuestoCriatura,
  resolverRarezaEspecie,
  ordenarEspeciesCatalogo,
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
    calcularArquetipoCriatura({ hpBase: 38, ataqueBase: 44, defensaBase: 38, velocidadBase: 52 }),
    'EQUILIBRADO',
  );
});

test('Compendio: filtrarEspeciesCatalogo combina tipo, arquetipo, rareza especial y búsqueda textual', () => {
  const listaPrueba: EspecieCatalogo[] = [
    {
      slug: 'lobo-estepario',
      nombre: 'Lobo Estepario',
      tipo: 'beast',
      challengeRating: 0.25,
      hpBase: 38,
      ataqueBase: 44,
      defensaBase: 38,
      velocidadBase: 52,
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

  // 6. Subfase 10m: Jerarquía BST y selector de ordenamiento
  assert.ok(
    codigo.includes('Ordenar especies del catálogo'),
    'Debe contener el selector accesible "Ordenar especies del catálogo"',
  );
  assert.ok(
    codigo.includes('BST:'),
    'Debe contener el indicador de presupuesto base BST en tarjeta y modal',
  );
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


test('Hardening, Ergonomía y Estética Retro-Brutalist: PantallaCatalogo cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y confinamiento sin overflow', () => {
  const rutaCatalogo = join(__dirname, '../src/paginas/PantallaCatalogo.tsx');
  const codigo = readFileSync(rutaCatalogo, 'utf-8');

  // 1. Confinamiento de pantalla contra overflow horizontal
  assert.ok(
    codigo.includes('overflow-x-hidden'),
    'PantallaCatalogo debe confinar el contenedor raíz con overflow-x-hidden',
  );
  assert.ok(
    codigo.includes('w-full max-w-5xl mx-auto px-2 sm:px-4'),
    'PantallaCatalogo debe utilizar márgenes y relleno responsivo contenido',
  );

  // 2. Marcos 8bitcn brutalistas y sombras ortogonales sólidas
  assert.ok(
    codigo.includes('border-2 border-black') && codigo.includes('shadow-[4px_4px_0_0_#000]'),
    'PantallaCatalogo debe implementar marcos gruesos negros border-2 border-black y sombras sólidas shadow-[4px_4px_0_0_#000]',
  );
  assert.ok(
    codigo.includes('shadow-[2px_2px_0_0_#000]'),
    'PantallaCatalogo debe incorporar sombras ortogonales táctiles shadow-[2px_2px_0_0_#000] en botones y badges',
  );

  // 3. Separación de botones de acción
  assert.ok(
    codigo.includes('gap-4 sm:gap-5 flex-wrap'),
    'Los botones de cabecera deben contar con separación desahogada gap-2.5 sm:gap-3',
  );
  assert.ok(
    codigo.includes('gap-3 sm:gap-3.5 flex-wrap'),
    'Los filtros de arquetipo deben disponer de separación holgada gap-2 sm:gap-2.5 flex-wrap',
  );

  // 4. Modal con borde brutalista sellado
  assert.ok(
    codigo.includes('border-4 border-black') && codigo.includes('shadow-[8px_8px_0_0_#000]'),
    'El modal táctico de inspección debe estar sellado con border-4 border-black y sombra shadow-[8px_8px_0_0_#000]',
  );

  // 5. Tipografía retro 100% integral
  assert.ok(
    codigo.includes('retro text-lg sm:text-xl font-bold text-primary'),
    'El título principal debe utilizar tipografía retro Press Start 2P',
  );
  assert.ok(
    codigo.includes('Atributos Base (Escala 100)'),
    'El modal debe incluir la escala comparativa de atributos base',
  );
  assert.ok(
    codigo.includes('INSPECCIONAR FICHA'),
    'La tarjeta debe presentar el botón de acción INSPECCIONAR FICHA',
  );
});


test('Hardening, Ergonomía y Estética Retro-Brutalist: PaginaCreditos cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y botones táctiles separados', () => {
  const rutaCreditos = join(__dirname, '../src/paginas/PaginaCreditos.tsx');
  const codigo = readFileSync(rutaCreditos, 'utf-8');

  // 1. Confinamiento contra desbordamiento horizontal en móvil
  assert.ok(
    codigo.includes('overflow-x-hidden') && codigo.includes('max-w-5xl mx-auto px-2 sm:px-4'),
    'PaginaCreditos debe confinar el contenedor raíz con overflow-x-hidden y márgenes adaptativos',
  );

  // 2. Marco retro-brutalist ceremonial en la cabecera (Salón de la Fama)
  assert.ok(
    codigo.includes('border-4 border-black') && codigo.includes('shadow-[6px_6px_0_0_#000]'),
    'La cabecera ceremonial debe utilizar marco retro-brutalist border-4 border-black y sombra shadow-[6px_6px_0_0_#000]',
  );

  // 3. Separación holgada y táctil en los botones de acción
  assert.ok(
    codigo.includes('gap-5 sm:gap-4 flex-wrap'),
    'Los botones de cabecera deben contar con separación holgada gap-3 sm:gap-4 flex-wrap',
  );
  assert.ok(
    codigo.includes('border-2 border-black shadow-[2px_2px_0_0_#000]') &&
      codigo.includes('active:translate-y-0.5 active:shadow-none'),
    'Los botones de acción deben poseer relieve retro-brutalist con feedback táctil activo',
  );

  // 4. Eliminación de clases truncate rígidas en nombres de criaturas
  assert.ok(
    !codigo.includes('truncate'),
    'No debe contener clases truncate rígidas que corten nombres de criaturas en móviles',
  );

  // 5. Cajas de licencias con scroll vertical interno y relieve hundido
  assert.ok(
    codigo.includes('max-h-48 overflow-y-auto overflow-x-hidden') &&
      codigo.includes('shadow-[inset_2px_2px_0_0_rgba(0,0,0,0.6)]'),
    'Las cajas de licencia deben contar con scroll vertical contenido y relieve hundido retro',
  );

  // 6. Hardening y prevención de pulsaciones superpuestas
  assert.ok(
    codigo.includes('if (celebrando) return;') && codigo.includes('aria-busy={celebrando}'),
    'Debe evitar pulsaciones superpuestas de fanfarria con guarda y aria-busy',
  );

  // 7. Especies verdaderas existentes en el catálogo canónico (sin especies obsoletas o inexistentes)
  assert.ok(
    codigo.includes('lobo-estepario') &&
      codigo.includes('golem-granito') &&
      codigo.includes('quimera-tricefala') &&
      codigo.includes('remorhaz-glaciar'),
    'Debe incluir especies verdaderas del compendio canónico (Lobo Estepario, Golem Granito, Quimera Tricéfala, Remorhaz Glaciar)',
  );
  assert.ok(
    !codigo.includes('"grifo"') && !codigo.includes('"hidra-de-las-marismas"'),
    'No debe incluir criaturas inexistentes en el catálogo canónico como grifo o hidra-de-las-marismas',
  );
});


test('Hardening, Ergonomía y Estética Retro-Brutalist: PantallaHistorial cuenta con marcos 8bitcn, sombras sólidas, tipografía retro integral y confinamiento sin overflow', () => {
  const rutaHistorial = join(__dirname, '../src/paginas/PantallaHistorial.tsx');
  const codigo = readFileSync(rutaHistorial, 'utf-8');

  // 1. Confinamiento de pantalla contra overflow horizontal y diseño adaptativo
  assert.ok(
    codigo.includes('overflow-x-hidden'),
    'PantallaHistorial debe confinar el contenedor raíz con overflow-x-hidden',
  );
  assert.ok(
    codigo.includes('w-full max-w-5xl mx-auto px-2 sm:px-4'),
    'PantallaHistorial debe utilizar márgenes y relleno responsivo contenido',
  );

  // 2. Erradicación de truncate destructivo
  assert.ok(
    !codigo.includes('truncate'),
    'PantallaHistorial no debe contener clases truncate que corten texto en móviles',
  );
  assert.ok(
    codigo.includes('break-words') && codigo.includes('break-all'),
    'PantallaHistorial debe utilizar ajuste flexible de texto con break-words y break-all',
  );

  // 3. Marcos negros 8bitcn brutalistas y sombras sólidas ortogonales
  assert.ok(
    codigo.includes('border-2 border-black') && codigo.includes('shadow-[4px_4px_0_0_#000]'),
    'PantallaHistorial debe implementar marcos negros border-2 border-black y sombras sólidas shadow-[4px_4px_0_0_#000]',
  );
  assert.ok(
    codigo.includes('border-4 border-black') && codigo.includes('shadow-[6px_6px_0_0_#000]'),
    'La cabecera o tarjeta de estado vacío debe usar marco grueso border-4 border-black y sombra shadow-[6px_6px_0_0_#000]',
  );
  assert.ok(
    codigo.includes('shadow-[2px_2px_0_0_#000]'),
    'PantallaHistorial debe incluir sombras ortogonales shadow-[2px_2px_0_0_#000] en botones, inputs y sellos de tiempo',
  );

  // 4. Separación ergonómica y táctil de botones de acción
  assert.ok(
    (codigo.includes('grid-cols-1 sm:grid-cols-2') || codigo.includes('gap-3 sm:gap-4') || codigo.includes('gap-4 sm:gap-5')) &&
      codigo.includes('sm:w-auto'),
    'Los botones de cabecera deben contar con separación desahogada y cuadrícula adaptativa',
  );
  assert.ok(
    codigo.includes('grid grid-cols-2') || codigo.includes('gap-2.5 sm:gap-3'),
    'La botonera de filtros rápidos debe organizarse en una rejilla simétrica con separación uniforme',
  );

  // 5. Tipografía retro 100% integral
  assert.ok(
    codigo.includes('BITÁCORA DE EXPEDICIONES') && codigo.includes('retro'),
    'El título principal debe utilizar tipografía retro Press Start 2P',
  );
  assert.ok(
    codigo.includes('retro text-[8px] sm:text-[9px]') || codigo.includes('retro text-[9px] sm:text-[10px]'),
    'Las descripciones y etiquetas deben utilizar tipografía retro escalada',
  );

  // 6. Higiene de código: erradicación de duplicación de import/export de catalogo-historial
  const coincidenciasImport = codigo.match(/from ["']@\/lib\/catalogo-historial["']/g);
  assert.strictEqual(
    coincidenciasImport?.length,
    1,
    'No debe existir importación duplicada de catalogo-historial',
  );

  // 7. Barra de búsqueda: placeholder conciso que previene truncamiento en pantallas estrechas
  assert.ok(
    codigo.includes('placeholder="Buscar crónica..."'),
    'La barra de búsqueda debe utilizar placeholder conciso "Buscar crónica..." para prevenir truncamiento en móviles',
  );
});

test('Subfase 10m: calcularPresupuestoCriatura calcula fielmente el BST sumando atributos base o respetando precalculado', () => {
  const criaturaSinPresupuesto = {
    hpBase: 40,
    ataqueBase: 45,
    defensaBase: 35,
    velocidadBase: 40,
  };
  assert.strictEqual(calcularPresupuestoCriatura(criaturaSinPresupuesto), 160);

  const criaturaConPresupuesto = {
    presupuestoTotal: 380,
    hpBase: 95,
    ataqueBase: 100,
    defensaBase: 95,
    velocidadBase: 90,
  };
  assert.strictEqual(calcularPresupuestoCriatura(criaturaConPresupuesto), 380);
});

test('Subfase 10m: resolverRarezaEspecie clasifica con precisión las 5 rarezas canónicas y sus etiquetas', () => {
  const legendaria = resolverRarezaEspecie({ esLegendaria: true });
  assert.strictEqual(legendaria.codigo, 'LEGENDARIA');
  assert.strictEqual(legendaria.etiqueta, 'LEGENDARIA (5%)');
  assert.strictEqual(legendaria.peso, 5);

  const especial = resolverRarezaEspecie({ esEspecial: true });
  assert.strictEqual(especial.codigo, 'ESPECIAL');
  assert.strictEqual(especial.etiqueta, 'ESPECIAL (5%)');
  assert.strictEqual(especial.peso, 5);

  const rara = resolverRarezaEspecie({ pesoAparicion: 10 });
  assert.strictEqual(rara.codigo, 'RARA');
  assert.strictEqual(rara.etiqueta, 'RARA (10%)');
  assert.strictEqual(rara.peso, 10);

  const frecuente = resolverRarezaEspecie({ pesoAparicion: 15 });
  assert.strictEqual(frecuente.codigo, 'FRECUENTE');
  assert.strictEqual(frecuente.etiqueta, 'FRECUENTE (15%)');
  assert.strictEqual(frecuente.peso, 15);

  const comun = resolverRarezaEspecie({ pesoAparicion: 35 });
  assert.strictEqual(comun.codigo, 'COMUN');
  assert.strictEqual(comun.etiqueta, 'COMÚN (35%)');
  assert.strictEqual(comun.peso, 35);
});

test('Subfase 10m: ordenarEspeciesCatalogo ordena fielmente por BST, Captura, Rareza y Alfabético', () => {
  const muestra: EspecieCatalogo[] = [
    {
      slug: 'lobo-estepario',
      nombre: 'Lobo Estepario',
      tipo: 'beast',
      challengeRating: 0.25,
      hpBase: 34,
      ataqueBase: 39,
      defensaBase: 32,
      velocidadBase: 45,
      tasaCaptura: 0.85,
      presupuestoTotal: 150,
      pesoAparicion: 35,
      rareza: 'COMUN',
      esEspecial: false,
      esLegendaria: false,
    },
    {
      slug: 'ciervo-lunar',
      nombre: 'Ciervo Lunar',
      tipo: 'beast',
      challengeRating: 0.5,
      hpBase: 46,
      ataqueBase: 44,
      defensaBase: 45,
      velocidadBase: 75,
      tasaCaptura: 0.65,
      presupuestoTotal: 210,
      pesoAparicion: 15,
      rareza: 'FRECUENTE',
      esEspecial: false,
      esLegendaria: false,
    },
    {
      slug: 'halcon-ceniza',
      nombre: 'Halcón Ceniza',
      tipo: 'beast',
      challengeRating: 1.0,
      hpBase: 54,
      ataqueBase: 66,
      defensaBase: 51,
      velocidadBase: 90,
      tasaCaptura: 0.48,
      presupuestoTotal: 261,
      pesoAparicion: 10,
      rareza: 'RARA',
      esEspecial: false,
      esLegendaria: false,
    },
    {
      slug: 'golem-granito',
      nombre: 'Golem Granito',
      tipo: 'construct',
      challengeRating: 1.0,
      hpBase: 94,
      ataqueBase: 86,
      defensaBase: 98,
      velocidadBase: 67,
      tasaCaptura: 0.20, // Soberana erradicando 0.83
      presupuestoTotal: 345,
      pesoAparicion: 5,
      rareza: 'ESPECIAL',
      esEspecial: true,
      esLegendaria: false,
    },
    {
      slug: 'remorhaz-glaciar',
      nombre: 'Remorhaz Glaciar',
      tipo: 'monstrosity',
      challengeRating: 11,
      hpBase: 97,
      ataqueBase: 99,
      defensaBase: 93,
      velocidadBase: 86,
      tasaCaptura: 0.10,
      presupuestoTotal: 375,
      pesoAparicion: 5,
      rareza: 'LEGENDARIA',
      esEspecial: false,
      esLegendaria: true,
    },
  ];

  // Verificación soberana explícita de Golem Granito
  const golem = muestra.find((e) => e.slug === 'golem-granito')!;
  assert.strictEqual(golem.presupuestoTotal, 345);
  assert.strictEqual(golem.tasaCaptura, 0.20);
  assert.strictEqual(golem.rareza, 'ESPECIAL');

  // 1. BST descendente
  const porBstDesc = ordenarEspeciesCatalogo(muestra, 'BST_DESC');
  assert.deepStrictEqual(
    porBstDesc.map((e) => e.slug),
    ['remorhaz-glaciar', 'golem-granito', 'halcon-ceniza', 'ciervo-lunar', 'lobo-estepario'],
  );

  // 2. BST ascendente
  const porBstAsc = ordenarEspeciesCatalogo(muestra, 'BST_ASC');
  assert.deepStrictEqual(
    porBstAsc.map((e) => e.slug),
    ['lobo-estepario', 'ciervo-lunar', 'halcon-ceniza', 'golem-granito', 'remorhaz-glaciar'],
  );

  // 3. Captura ascendente (más difícil primero = menor tasa)
  const porCaptura = ordenarEspeciesCatalogo(muestra, 'CAPTURA_ASC');
  assert.deepStrictEqual(
    porCaptura.map((e) => e.slug),
    ['remorhaz-glaciar', 'golem-granito', 'halcon-ceniza', 'ciervo-lunar', 'lobo-estepario'],
  );

  // 4. Rareza descendente (LEGENDARIA > ESPECIAL > RARA > FRECUENTE > COMUN)
  const porRareza = ordenarEspeciesCatalogo(muestra, 'RAREZA_DESC');
  assert.deepStrictEqual(
    porRareza.map((e) => e.slug),
    ['remorhaz-glaciar', 'golem-granito', 'halcon-ceniza', 'ciervo-lunar', 'lobo-estepario'],
  );

  // 5. Alfabético NOMBRE_ASC (A-Z)
  const porNombre = ordenarEspeciesCatalogo(muestra, 'NOMBRE_ASC');
  assert.deepStrictEqual(
    porNombre.map((e) => e.nombre),
    ['Ciervo Lunar', 'Golem Granito', 'Halcón Ceniza', 'Lobo Estepario', 'Remorhaz Glaciar'],
  );
});
