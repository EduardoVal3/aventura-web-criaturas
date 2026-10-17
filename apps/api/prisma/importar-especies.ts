import { PrismaClient } from '@prisma/client';
import { AdaptadorCriaturasExternas } from '../src/modulos/externo/adaptador-criaturas-externas.service';
import {
  BESTIARIO,
  TABLAS_APARICION,
  EspecieCanonica,
} from '../src/modulos/externo/bestiario-canonico';
import {
  calcularTasaCaptura,
  CATALOGO_ESPECIES_PROPENSO,
} from '../src/modulos/externo/normalizador-criaturas.util';

const prisma = new PrismaClient();
const adaptador = new AdaptadorCriaturasExternas();

async function importarEspecies() {
  console.log('Iniciando importación soberana de bestiario e idempotencia (Subfase 10j)...');

  // 1. Validar invariante INV-01 en memoria antes de tocar la base de datos
  const zonasMap = new Map<string, number>();
  for (const aparicion of TABLAS_APARICION) {
    const actual = zonasMap.get(aparicion.zonaId) ?? 0;
    zonasMap.set(aparicion.zonaId, actual + aparicion.peso);
  }

  for (const [zonaId, sumaPesos] of zonasMap.entries()) {
    if (sumaPesos !== 100) {
      throw new Error(
        `Violación de invariante INV-01: La zona ${zonaId} suma ${sumaPesos}%, debe sumar exactamente 100%`,
      );
    }
  }

  // 2. Obtener datos externos de Open5e (referencia de dados y lore)
  const claves = Object.keys(CATALOGO_ESPECIES_PROPENSO);
  const criaturasExternas = await adaptador.obtenerEspeciesSeleccionadas(claves);
  console.log(`Se obtuvieron ${criaturasExternas.length} criaturas del adaptador externo / snapshot.`);

  const mapaExterno = new Map(criaturasExternas.map((c) => [c.idExterno, c]));
  const mapaEspeciesPorSlug = new Map<string, string>();

  // 3. Sembrar o actualizar las 30 especies canónicas con upsert por idExterno
  for (const canonica of BESTIARIO) {
    const ext = mapaExterno.get(canonica.idExterno);
    const challengeRating = ext ? ext.challengeRating : 1.0;
    const tipo = ext?.tipoExterno || canonica.tipo;
    const tasaCaptura = calcularTasaCaptura(challengeRating);

    const especieDb = await prisma.especie.upsert({
      where: { idExterno: canonica.idExterno },
      update: {
        nombre: canonica.nombre,
        slug: canonica.slug,
        tipo,
        elemento: canonica.elemento,
        challengeRating,
        hpBase: canonica.statsBase.hpBase,
        ataqueBase: canonica.statsBase.ataqueBase,
        defensaBase: canonica.statsBase.defensaBase,
        velocidadBase: canonica.statsBase.velocidadBase,
        tasaCaptura,
        esEspecial: canonica.esEspecial,
        esLegendaria: canonica.esLegendaria,
        descripcion: canonica.descripcion,
      },
      create: {
        idExterno: canonica.idExterno,
        nombre: canonica.nombre,
        slug: canonica.slug,
        tipo,
        elemento: canonica.elemento,
        challengeRating,
        hpBase: canonica.statsBase.hpBase,
        ataqueBase: canonica.statsBase.ataqueBase,
        defensaBase: canonica.statsBase.defensaBase,
        velocidadBase: canonica.statsBase.velocidadBase,
        tasaCaptura,
        esEspecial: canonica.esEspecial,
        esLegendaria: canonica.esLegendaria,
        descripcion: canonica.descripcion,
      },
    });

    mapaEspeciesPorSlug.set(canonica.slug, especieDb.id);

    // Movimientos soberanos: eliminar existentes y recrear exactamente los 4 slots tácticos
    await prisma.movimiento.deleteMany({
      where: { especieId: especieDb.id },
    });

    for (const mov of canonica.movimientos) {
      await prisma.movimiento.create({
        data: {
          especieId: especieDb.id,
          nombreOriginal: mov.nombreOriginal,
          nombre: mov.nombre,
          tipoAccion: mov.tipoAccion,
          poder: mov.poder,
          slot: mov.slot,
          efecto: mov.efecto,
        },
      });
    }
  }

  // 4. Limpieza de especies obsoletas sin criaturas asociadas
  const idsCanonicos = new Set(BESTIARIO.map((b) => b.idExterno));
  const especiesObsoletas = await prisma.especie.findMany({
    where: { idExterno: { notIn: Array.from(idsCanonicos) } },
    include: { criaturas: true },
  });

  for (const obsoleta of especiesObsoletas) {
    if (obsoleta.criaturas.length === 0) {
      console.log(`Eliminando especie obsoleta sin criaturas: ${obsoleta.slug} (${obsoleta.idExterno})`);
      await prisma.aparicionZona.deleteMany({ where: { especieId: obsoleta.id } });
      await prisma.movimiento.deleteMany({ where: { especieId: obsoleta.id } });
      await prisma.especie.delete({ where: { id: obsoleta.id } });
    } else {
      console.warn(
        `Atención: No se eliminó la especie obsoleta ${obsoleta.slug} debido a ${obsoleta.criaturas.length} criaturas activas vinculadas.`,
      );
    }
  }

  // 5. Sembrado transaccional atómico de tablas de aparición (AparicionZona)
  await prisma.$transaction(async (tx) => {
    // Borrado previo para garantizar idempotencia estricta
    await tx.aparicionZona.deleteMany({});

    for (const aparicion of TABLAS_APARICION) {
      const especieId = mapaEspeciesPorSlug.get(aparicion.especieSlug);
      if (!especieId) {
        throw new Error(`Especie no encontrada para slug: ${aparicion.especieSlug}`);
      }

      await tx.aparicionZona.create({
        data: {
          zonaId: aparicion.zonaId,
          especieId,
          peso: aparicion.peso,
          nivelMinimo: aparicion.nivelMinimo,
          nivelMaximo: aparicion.nivelMaximo,
        },
      });
    }
  });

  console.log('Importación soberana y tablas de aparición completadas exitosamente.');
}

importarEspecies()
  .catch((e) => {
    console.error('Error durante la importación de especies:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
