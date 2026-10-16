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
      // simplificacion: bloqueo pesimista por fila de personaje para serializar la restauracion del santuario; suficiente en monolito conectado a una instancia PostgreSQL.
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE`;
      }

      const criaturasEquipo = await tx.criatura.findMany({
        where: {
          personajeId: personaje.id,
          enEquipo: true,
        },
        include: {
          especie: true,
        },
        orderBy: {
          ordenEquipo: 'asc',
        },
      });

      const detalles: {
        criaturaId: string;
        nombre: string;
        hpPrevio: number;
        hpNuevo: number;
        hpMaximo: number;
        hpRestaurado: number;
        fueRevivida: boolean;
      }[] = [];

      let criaturasCuradas = 0;
      let criaturasRevividas = 0;
      let hpTotalRestaurado = 0;

      for (const criatura of criaturasEquipo) {
        const hpMaximo = Math.max(1, criatura.hpMaximo);
        const hpPrevio = Math.max(0, Math.min(hpMaximo, criatura.hpActual));
        const hpNuevo = hpMaximo;
        const hpRestaurado = Math.max(0, hpNuevo - hpPrevio);
        const fueRevivida = hpPrevio === 0 && hpNuevo > 0;

        if (criatura.hpActual !== hpNuevo) {
          await tx.criatura.update({
            where: { id: criatura.id },
            data: { hpActual: hpNuevo },
          });
        }

        if (hpRestaurado > 0) {
          criaturasCuradas += 1;
          hpTotalRestaurado += hpRestaurado;
        }
        if (fueRevivida) {
          criaturasRevividas += 1;
        }

        detalles.push({
          criaturaId: criatura.id,
          nombre: criatura.apodo || criatura.especie?.nombre || 'Criatura',
          hpPrevio,
          hpNuevo,
          hpMaximo,
          hpRestaurado,
          fueRevivida,
        });
      }

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'CURACION',
          descripcion: `Restauración en el santuario de ${personaje.ubicacionActual.nombre}: ${criaturasCuradas} sanadas, ${criaturasRevividas} revividas (+${hpTotalRestaurado} HP).`,
          datosJson: {
            ubicacionId: personaje.ubicacionActual.id,
            totalRestauradas: criaturasEquipo.length,
            criaturasCuradas,
            criaturasRevividas,
            hpTotalRestaurado,
          },
        },
      });

      return {
        mensaje:
          'Todas las criaturas de tu equipo han sido completamente restauradas.',
        criaturasRestauradas: criaturasEquipo.length,
        criaturasCuradas,
        criaturasRevividas,
        hpTotalRestaurado,
        ubicacionNombre: personaje.ubicacionActual.nombre,
        detalles,
      };
    });
  }
}
