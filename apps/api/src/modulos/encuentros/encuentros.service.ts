import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

@Injectable()
export class EncuentrosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerEncuentroActivo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: {
        criaturas: {
          where: { enEquipo: true },
          orderBy: { ordenEquipo: 'asc' },
          take: 1,
          include: {
            especie: {
              include: { movimientos: true },
            },
          },
        },
      },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const encuentro = await this.prisma.encuentro.findFirst({
      where: {
        personajeId: personaje.id,
        estado: 'EN_CURSO',
      },
      include: {
        criaturaRival: {
          include: { especie: true },
        },
        combates: {
          orderBy: { turno: 'asc' },
        },
      },
    });

    if (!encuentro) {
      throw new NotFoundException({
        codigo: 'ENCUENTRO_NO_ENCONTRADO',
        mensaje: 'No tienes ningún encuentro o combate activo en este momento.',
      });
    }

    const aliadaLider = personaje.criaturas[0];
    const ultimoCombate =
      encuentro.combates.length > 0
        ? encuentro.combates[encuentro.combates.length - 1]
        : null;
    const turnoActual = ultimoCombate ? ultimoCombate.turno + 1 : 1;

    // simplificacion: reconstrucción cronológica inversa de la bitácora para reanudar la UI fielmente
    const bitacora: string[] = [
      aliadaLider
        ? `¡Tu aliada es ${aliadaLider.apodo || aliadaLider.especie.nombre} (Nv. ${aliadaLider.nivel})!`
        : '',
      `Turno 1: ¡Un ${encuentro.criaturaRival.especie.nombre} salvaje (Nv. ${encuentro.criaturaRival.nivel}) está frente a ti!`,
    ].filter(Boolean);

    for (const c of encuentro.combates) {
      const detalle = c.detalleJson as Record<string, unknown> | null;
      if (detalle?.movimientoRival) {
        bitacora.unshift(
          `El rival respondió con ${detalle.movimientoRival} causando ${detalle.danoRival} de daño.`,
        );
      }
      if (detalle?.movimientoJugador) {
        bitacora.unshift(
          `Tu criatura usó ${detalle.movimientoJugador} causando ${detalle.danoJugador} de daño.`,
        );
      }
      if (c.accionUltima === 'CAPTURAR' || detalle?.exito !== undefined) {
        if (detalle?.exito) {
          bitacora.unshift(
            `¡Captura exitosa enviada a ${detalle?.destino === 'EQUIPO' ? 'tu equipo activo' : 'el almacén'}!`,
          );
        } else {
          bitacora.unshift(`La criatura se resistió a la captura.`);
        }
      }
    }

    return {
      encuentroId: encuentro.id,
      estado: encuentro.estado,
      turno: turnoActual,
      esTurnoJugador: ultimoCombate?.esTurnoJugador ?? true,
      criaturaRival: {
        slug: encuentro.criaturaRival.especie.slug,
        nombre: encuentro.criaturaRival.especie.nombre,
        nivel: encuentro.criaturaRival.nivel,
        hpActual: encuentro.criaturaRival.hpActual,
        hpMaximo: encuentro.criaturaRival.hpMaximo,
        ataque: encuentro.criaturaRival.ataque,
        defensa: encuentro.criaturaRival.defensa,
        velocidad: encuentro.criaturaRival.velocidad,
      },
      criaturaAliada: aliadaLider
        ? {
            criaturaId: aliadaLider.id,
            slug: aliadaLider.especie?.slug,
            nombre: aliadaLider.apodo || aliadaLider.especie?.nombre || 'Compañero',
            nombreEspecie: aliadaLider.especie?.nombre,
            nivel: aliadaLider.nivel,
            hpActual: aliadaLider.hpActual,
            hpMaximo: aliadaLider.hpMaximo,
            ataque: aliadaLider.ataque,
            defensa: aliadaLider.defensa,
            velocidad: aliadaLider.velocidad,
            experiencia: aliadaLider.experiencia,
            movimientos: aliadaLider.especie?.movimientos?.length
              ? aliadaLider.especie.movimientos.map((m) => ({
                  nombre: m.nombre,
                  poder: m.poder,
                  tipoAccion: m.tipoAccion,
                }))
              : [{ nombre: 'Golpe Firme', poder: 12, tipoAccion: 'ATAQUE' }],
          }
        : null,
      bitacora,
    };
  }
}
