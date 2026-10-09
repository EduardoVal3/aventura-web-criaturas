import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function sembrarZonas() {
  const zonas = [
    // Localidades seguras
    {
      id: 'LOC-01',
      nombre: 'Villa Serena',
      descripcion: 'Aldea pacífica en el valle donde inician los reclutas del gremio.',
      tipo: 'LOCALIDAD',
      esSegura: true,
      nivelMinimo: null,
      nivelMaximo: null,
      servicios: ['CURACION', 'ALMACEN', 'HISTORIAL'],
    },
    {
      id: 'LOC-02',
      nombre: 'Puesto Fronterizo del Río',
      descripcion: 'Cruce comercial ribereño resguardado por mercaderes y exploradores veteranos.',
      tipo: 'LOCALIDAD',
      esSegura: true,
      nivelMinimo: null,
      nivelMaximo: null,
      servicios: ['TIENDA', 'ALMACEN', 'CURACION'],
    },
    {
      id: 'LOC-03',
      nombre: 'Bastión del Norte',
      descripcion: 'Imponente fortaleza de piedra erigida sobre los riscos septentrionales.',
      tipo: 'LOCALIDAD',
      esSegura: true,
      nivelMinimo: null,
      nivelMaximo: null,
      servicios: ['TIENDA', 'CURACION', 'HISTORIAL'],
    },
    // Zonas silvestres
    {
      id: 'ZON-01',
      nombre: 'Praderas del Amanecer',
      descripcion: 'Extensas llanuras de hierba dorada habitadas por bestias menores.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 1,
      nivelMaximo: 3,
      servicios: [],
    },
    {
      id: 'ZON-02',
      nombre: 'Bosque Susurrante',
      descripcion: 'Espesura arbórea donde el viento silba entre ramas antiguas.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 2,
      nivelMaximo: 4,
      servicios: [],
    },
    {
      id: 'ZON-03',
      nombre: 'Riberas del Lago Espejo',
      descripcion: 'Aguas serenas que reflejan el cielo y albergan fauna ribereña.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 3,
      nivelMaximo: 5,
      servicios: [],
    },
    {
      id: 'ZON-04',
      nombre: 'Paso de los Riscos',
      descripcion: 'Senderos pedregosos y escarpados que ascienden hacia las alturas.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 5,
      nivelMaximo: 7,
      servicios: [],
    },
    {
      id: 'ZON-05',
      nombre: 'Cueva Umbría',
      descripcion: 'Caverna oscura con ecos ancestrales y criaturas nocturnas peligrosas.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 7,
      nivelMaximo: 10,
      servicios: [],
    },
    {
      id: 'ZON-06',
      nombre: 'Pico de la Cumbre',
      descripcion: 'Cima gélida azotada por tempestades donde moran seres primordiales.',
      tipo: 'ZONA',
      esSegura: false,
      nivelMinimo: 8,
      nivelMaximo: 12,
      servicios: [],
    },
  ];

  for (const z of zonas) {
    await prisma.zona.upsert({
      where: { id: z.id },
      update: {
        nombre: z.nombre,
        descripcion: z.descripcion,
        tipo: z.tipo,
        esSegura: z.esSegura,
        nivelMinimo: z.nivelMinimo,
        nivelMaximo: z.nivelMaximo,
        servicios: z.servicios,
      },
      create: z,
    });
  }
}

async function sembrarConexiones() {
  const paresBidireccionales: [string, string][] = [
    ['LOC-01', 'ZON-01'],
    ['LOC-01', 'ZON-02'],
    ['ZON-01', 'LOC-02'],
    ['ZON-02', 'ZON-03'],
    ['ZON-03', 'LOC-02'],
    ['LOC-02', 'ZON-04'],
    ['ZON-04', 'LOC-03'],
    ['ZON-04', 'ZON-05'],
    ['LOC-03', 'ZON-06'],
    ['ZON-05', 'ZON-06'],
  ];

  for (const [origen, destino] of paresBidireccionales) {
    // Origen -> Destino
    await prisma.conexionZona.upsert({
      where: {
        zonaOrigenId_zonaDestinoId: {
          zonaOrigenId: origen,
          zonaDestinoId: destino,
        },
      },
      update: {},
      create: {
        zonaOrigenId: origen,
        zonaDestinoId: destino,
      },
    });

    // Destino -> Origen (bidireccional)
    await prisma.conexionZona.upsert({
      where: {
        zonaOrigenId_zonaDestinoId: {
          zonaOrigenId: destino,
          zonaDestinoId: origen,
        },
      },
      update: {},
      create: {
        zonaOrigenId: destino,
        zonaDestinoId: origen,
      },
    });
  }
}

async function sembrarEventosZona() {
  const eventosPorZona: { zonaId: string; eventos: { tipo: string; peso: number }[] }[] = [
    {
      zonaId: 'ZON-01',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
    {
      zonaId: 'ZON-02',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
    {
      zonaId: 'ZON-03',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
    {
      zonaId: 'ZON-04',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
    {
      zonaId: 'ZON-05',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
    {
      zonaId: 'ZON-06',
      eventos: [
        { tipo: 'ENCUENTRO', peso: 50 },
        { tipo: 'OBJETO', peso: 30 },
        { tipo: 'SIN_EVENTO', peso: 20 },
      ],
    },
  ];

  for (const { zonaId, eventos } of eventosPorZona) {
    for (const e of eventos) {
      await prisma.eventoZona.upsert({
        where: {
          zonaId_tipo: {
            zonaId,
            tipo: e.tipo,
          },
        },
        update: {
          peso: e.peso,
        },
        create: {
          zonaId,
          tipo: e.tipo,
          peso: e.peso,
        },
      });
    }
  }
}

async function sembrarObjetos() {
  const objetos = [
    {
      codigo: 'talisman-basico',
      nombre: 'Talismán Básico de Captura',
      descripcion: 'Talismán estándar para sintonizar y capturar criaturas salvajes.',
      tipo: 'CAPTURA',
      precioCompra: 50,
      precioVenta: 25,
      efectoValor: 1,
    },
    {
      codigo: 'talisman-avanzado',
      nombre: 'Talismán Avanzado de Captura',
      descripcion: 'Talismán reforzado con mayor resonancia para criaturas de alto desafío.',
      tipo: 'CAPTURA',
      precioCompra: 150,
      precioVenta: 75,
      efectoValor: 2,
    },
    {
      codigo: 'pocion-menor',
      nombre: 'Poción de Curación Menor',
      descripcion: 'Brebaje medicinal que restaura 20 puntos de salud.',
      tipo: 'CURACION',
      precioCompra: 30,
      precioVenta: 15,
      efectoValor: 20,
    },
    {
      codigo: 'pocion-mayor',
      nombre: 'Poción de Curación Mayor',
      descripcion: 'Elixir reconstituyente que restaura 50 puntos de salud.',
      tipo: 'CURACION',
      precioCompra: 80,
      precioVenta: 40,
      efectoValor: 50,
    },
  ];

  for (const o of objetos) {
    await prisma.objeto.upsert({
      where: { codigo: o.codigo },
      update: {
        nombre: o.nombre,
        descripcion: o.descripcion,
        tipo: o.tipo,
        precioCompra: o.precioCompra,
        precioVenta: o.precioVenta,
        efectoValor: o.efectoValor,
      },
      create: o,
    });
  }
}

async function main() {
  console.log('Iniciando siembra de datos básica e idempotente...');
  await sembrarZonas();
  await sembrarConexiones();
  await sembrarEventosZona();
  await sembrarObjetos();
  console.log('Siembra básica completada con éxito.');
}

main()
  .catch((error) => {
    console.error('Error durante la siembra de datos:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
