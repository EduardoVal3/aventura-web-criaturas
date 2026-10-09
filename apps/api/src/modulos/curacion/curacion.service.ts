import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

@Injectable()
export class CuracionService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Restaura completamente los puntos de golpe de todo el equipo en una localidad autorizada (§2.9).
   */
  async restaurarEquipo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: {
        ubicacionActual: true,
      },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró el personaje activo del explorador.',
      });
    }

    const servicios = personaje.ubicacionActual.servicios ?? [];
    const tieneServicioCuracion =
      servicios.includes('CURACION') || servicios.includes('CENTRO_CURACION');

    if (!personaje.ubicacionActual.esSegura || !tieneServicioCuracion) {
      throw new ForbiddenException({
        codigo: 'SERVICIO_NO_DISPONIBLE',
        mensaje:
          'La ubicación actual no cuenta con un centro de curación autorizado.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const criaturasEquipo = await tx.criatura.findMany({
        where: {
          personajeId: personaje.id,
          enEquipo: true,
        },
      });

      for (const criatura of criaturasEquipo) {
        await tx.criatura.update({
          where: { id: criatura.id },
          data: { hpActual: criatura.hpMaximo },
        });
      }

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'CURACION',
          descripcion: `Restauración completa de ${criaturasEquipo.length} criaturas en el centro médico de ${personaje.ubicacionActual.nombre}.`,
          datosJson: {
            ubicacionId: personaje.ubicacionActual.id,
            totalRestauradas: criaturasEquipo.length,
          },
        },
      });

      return {
        mensaje:
          'Todas las criaturas de tu equipo han sido completamente restauradas.',
        criaturasRestauradas: criaturasEquipo.length,
      };
    });
  }
}
