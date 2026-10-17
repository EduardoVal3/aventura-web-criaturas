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

import { TABLAS_APARICION } from '../src/modulos/externo/bestiario-canonico';


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
    const especieId = mapaEspeciesPorSlug.get(aparicion.especieSlug);
    if (!especieId) {
      console.warn(`Especie no encontrada para slug: ${aparicion.especieSlug}`);
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
