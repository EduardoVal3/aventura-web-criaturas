import { ConflictException } from '@nestjs/common';

export interface CriaturaSaludMinima {
  hpActual?: number;
}

/**
 * Determina si el equipo activo del personaje existe y tiene todas sus criaturas en 0 HP.
 * Si el mock o consulta no provee hpActual, evita falsos positivos devolviendo false.
 */
async function equipoCompletamenteDebilitado(
  prisma: any,
  personajeId: string,
  criaturasEquipo?: CriaturaSaludMinima[],
): Promise<boolean> {
  if (Array.isArray(criaturasEquipo) && criaturasEquipo.length > 0) {
    const todasTienenHp = criaturasEquipo.every(
      (c) => typeof c.hpActual === 'number',
    );
    if (todasTienenHp) {
      return criaturasEquipo.every((c) => (c.hpActual ?? 0) <= 0);
    }
  }

  if (typeof prisma?.criatura?.count !== 'function') {
    return false;
  }

  try {
    const [totalEquipo, vivasEquipo] = await Promise.all([
      prisma.criatura.count({
        where: { personajeId, enEquipo: true },
      }),
      prisma.criatura.count({
        where: { personajeId, enEquipo: true, hpActual: { gt: 0 } },
      }),
    ]);

    return (
      typeof totalEquipo === 'number' &&
      typeof vivasEquipo === 'number' &&
      totalEquipo > 0 &&
      vivasEquipo === 0
    );
  } catch {
    return false;
  }
}

/**
 * Obtiene el encuentro EN_CURSO del personaje.
 * Si detecta un estado inconsistente (encuentro EN_CURSO con todo el equipo en 0 HP),
 * reconcilia automáticamente el encuentro a DERROTA para evitar bloqueos permanentes.
 */
export async function obtenerOReconciliarEncuentroActivo(
  prisma: any,
  personajeId: string,
  criaturasEquipo?: CriaturaSaludMinima[],
): Promise<{ id: string } | null> {
  if (typeof prisma?.encuentro?.findFirst !== 'function') {
    return null;
  }

  const encuentro = await prisma.encuentro.findFirst({
    where: {
      personajeId,
      estado: 'EN_CURSO',
    },
    select: { id: true },
  });

  if (!encuentro) {
    return null;
  }

  const debilitado = await equipoCompletamenteDebilitado(
    prisma,
    personajeId,
    criaturasEquipo,
  );

  if (debilitado) {
    // simplificacion: autorreparación síncrona de encuentros huérfanos en 0 HP; evita bloqueos permanentes heredados sin requerir tarea cron externa.
    if (typeof prisma?.encuentro?.update === 'function') {
      await prisma.encuentro.update({
        where: { id: encuentro.id },
        data: {
          estado: 'DERROTA',
          fechaResolucion: new Date(),
        },
      });
    }
    return null;
  }

  return encuentro;
}

/**
 * Rechaza operaciones fuera de combate con 409 ENCUENTRO_PREVIO_ACTIVO
 * si el personaje mantiene un encuentro EN_CURSO válido.
 */
export async function asegurarSinEncuentroActivo(
  prisma: any,
  personajeId: string,
  mensaje = 'No puedes realizar esta acción mientras tienes un combate activo pendiente de resolución.',
): Promise<void> {
  const encuentroActivo = await obtenerOReconciliarEncuentroActivo(
    prisma,
    personajeId,
  );

  if (encuentroActivo) {
    throw new ConflictException({
      codigo: 'ENCUENTRO_PREVIO_ACTIVO',
      mensaje,
    });
  }
}
