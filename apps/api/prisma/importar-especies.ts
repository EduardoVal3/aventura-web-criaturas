import { PrismaClient } from '@prisma/client';
import { AdaptadorCriaturasExternas } from '../src/modulos/externo/adaptador-criaturas-externas.service';
import {
  calcularHpBase,
  calcularAtaqueBase,
  calcularDefensaBase,
  calcularVelocidadBase,
  calcularTasaCaptura,
  CATALOGO_ESPECIES_PROPENSO,
  TRADUCCION_MOVIMIENTOS,
} from '../src/modulos/externo/normalizador-criaturas.util';

const prisma = new PrismaClient();
const adaptador = new AdaptadorCriaturasExternas();

const TABLAS_APARICION = [
  // ZON-01: Praderas del Amanecer (Nivel 1–3)
  { zonaId: 'ZON-01', slug: 'lobo-gris', peso: 40, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', slug: 'pico-de-hacha', peso: 35, nivelMinimo: 1, nivelMaximo: 3 },
  { zonaId: 'ZON-01', slug: 'arana-lobo-gigante', peso: 20, nivelMinimo: 1, nivelMaximo: 2 },
  { zonaId: 'ZON-01', slug: 'lobo-huargo', peso: 5, nivelMinimo: 3, nivelMaximo: 4 },

  // ZON-02: Bosque Susurrante (Nivel 2–4)
  { zonaId: 'ZON-02', slug: 'oso-negro', peso: 40, nivelMinimo: 2, nivelMaximo: 3 },
  { zonaId: 'ZON-02', slug: 'cocatriza', peso: 35, nivelMinimo: 2, nivelMaximo: 4 },
  { zonaId: 'ZON-02', slug: 'arbol-despierto', peso: 20, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-02', slug: 'osobuho', peso: 5, nivelMinimo: 4, nivelMaximo: 5 },

  // ZON-03: Riberas del Lago Espejo (Nivel 3–5)
  { zonaId: 'ZON-03', slug: 'oso-pardo', peso: 40, nivelMinimo: 3, nivelMaximo: 4 },
  { zonaId: 'ZON-03', slug: 'tigre-dientes-de-sable', peso: 35, nivelMinimo: 3, nivelMaximo: 5 },
  { zonaId: 'ZON-03', slug: 'alosaurio', peso: 20, nivelMinimo: 4, nivelMaximo: 5 },
  { zonaId: 'ZON-03', slug: 'hidra-de-las-marismas', peso: 5, nivelMinimo: 5, nivelMaximo: 6 },

  // ZON-04: Paso de los Riscos (Nivel 5–7)
  { zonaId: 'ZON-04', slug: 'grifo', peso: 40, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', slug: 'gargola', peso: 35, nivelMinimo: 5, nivelMaximo: 6 },
  { zonaId: 'ZON-04', slug: 'manticora', peso: 20, nivelMinimo: 6, nivelMaximo: 7 },
  { zonaId: 'ZON-04', slug: 'quimera-tricefala', peso: 5, nivelMinimo: 7, nivelMaximo: 8 },

  // ZON-05: Cueva Umbría (Nivel 7–10)
  { zonaId: 'ZON-05', slug: 'esqueleto-guerrero', peso: 35, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', slug: 'zombi-putrefacto', peso: 30, nivelMinimo: 7, nivelMaximo: 8 },
  { zonaId: 'ZON-05', slug: 'necrofago', peso: 20, nivelMinimo: 8, nivelMaximo: 9 },
  { zonaId: 'ZON-05', slug: 'basilisco', peso: 10, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-05', slug: 'hombre-lobo', peso: 5, nivelMinimo: 9, nivelMaximo: 10 },

  // ZON-06: Pico de la Cumbre (Nivel 8–12)
  { zonaId: 'ZON-06', slug: 'lobo-invernal', peso: 35, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-06', slug: 'armadura-animada', peso: 30, nivelMinimo: 8, nivelMaximo: 10 },
  { zonaId: 'ZON-06', slug: 'elemental-de-fuego', peso: 18, nivelMinimo: 9, nivelMaximo: 11 },
  { zonaId: 'ZON-06', slug: 'elemental-de-aire', peso: 12, nivelMinimo: 9, nivelMaximo: 11 },
  { zonaId: 'ZON-06', slug: 'quimera-tricefala', peso: 5, nivelMinimo: 11, nivelMaximo: 12 },
];

async function importarEspecies() {
  console.log('Iniciando importación batch de especies desde proveedor externo...');
  const claves = Object.keys(CATALOGO_ESPECIES_PROPENSO);
  const criaturasExternas = await adaptador.obtenerEspeciesSeleccionadas(claves);

  console.log(`Se obtuvieron ${criaturasExternas.length} criaturas externas.`);

  const mapaEspeciesPorSlug = new Map<string, string>();

  for (const c of criaturasExternas) {
    const meta = CATALOGO_ESPECIES_PROPENSO[c.idExterno];
    if (!meta) {
      console.warn(`Sin metadatos para la clave ${c.idExterno}`);
      continue;
    }

    // Mejor ataque (poder máximo entre sus ataques)
    const mejorAtaque =
      c.ataques.length > 0 ? Math.max(...c.ataques.map((a) => a.poder)) : 3.5;

    const hpBase = calcularHpBase(c.hitPoints);
    const ataqueBase = calcularAtaqueBase(mejorAtaque);
    const defensaBase = calcularDefensaBase(c.armorClass);
    const velocidadBase = calcularVelocidadBase(c.speedMax);
    const tasaCaptura = calcularTasaCaptura(c.challengeRating);

    const especieDb = await prisma.especie.upsert({
      where: { slug: meta.slug },
      update: {
        idExterno: c.idExterno,
        nombre: meta.nombre,
        tipo: c.tipoExterno,
        challengeRating: c.challengeRating,
        hpBase,
        ataqueBase,
        defensaBase,
        velocidadBase,
        tasaCaptura,
        esEspecial: meta.esEspecial,
        descripcion: meta.descripcion,
      },
      create: {
        idExterno: c.idExterno,
        nombre: meta.nombre,
        slug: meta.slug,
        tipo: c.tipoExterno,
        challengeRating: c.challengeRating,
        hpBase,
        ataqueBase,
        defensaBase,
        velocidadBase,
        tasaCaptura,
        esEspecial: meta.esEspecial,
        descripcion: meta.descripcion,
      },
    });

    mapaEspeciesPorSlug.set(meta.slug, especieDb.id);

    // Movimientos: eliminar existentes y recrear para garantizar consistencia e idempotencia
    await prisma.movimiento.deleteMany({
      where: { especieId: especieDb.id },
    });

    for (const atk of c.ataques) {
      const traduccion = TRADUCCION_MOVIMIENTOS[meta.slug]?.[atk.nombreOriginal];
      const nombreEnEspanol = traduccion ? traduccion.nombre : atk.nombreOriginal;
      const tipoAccion = traduccion ? traduccion.tipoAccion : atk.tipoAccion;

      await prisma.movimiento.create({
        data: {
          especieId: especieDb.id,
          nombreOriginal: atk.nombreOriginal,
          nombre: nombreEnEspanol,
          tipoAccion,
          poder: atk.poder,
        },
      });
    }
  }

  console.log('Sembrando tablas de aparición por zona (AparicionZona)...');
  for (const aparicion of TABLAS_APARICION) {
    const especieId = mapaEspeciesPorSlug.get(aparicion.slug);
    if (!especieId) {
      console.warn(`Especie no encontrada para slug: ${aparicion.slug}`);
      continue;
    }

    await prisma.aparicionZona.upsert({
      where: {
        zonaId_especieId: {
          zonaId: aparicion.zonaId,
          especieId,
        },
      },
      update: {
        peso: aparicion.peso,
        nivelMinimo: aparicion.nivelMinimo,
        nivelMaximo: aparicion.nivelMaximo,
      },
      create: {
        zonaId: aparicion.zonaId,
        especieId,
        peso: aparicion.peso,
        nivelMinimo: aparicion.nivelMinimo,
        nivelMaximo: aparicion.nivelMaximo,
      },
    });
  }

  console.log('Importación batch y tablas de aparición completadas exitosamente.');
}

importarEspecies()
  .catch((e) => {
    console.error('Error durante la importación de especies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
