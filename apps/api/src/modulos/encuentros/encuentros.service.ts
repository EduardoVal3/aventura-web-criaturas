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
      },
    });

    if (!encuentro) {
      throw new NotFoundException({
        codigo: 'ENCUENTRO_NO_ENCONTRADO',
        mensaje: 'No tienes ningún encuentro o combate activo en este momento.',
      });
    }

    const aliadaLider = personaje.criaturas[0];

    return {
      encuentroId: encuentro.id,
      estado: encuentro.estado,
      turno: 1,
      esTurnoJugador: true,
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
            nombre: aliadaLider.apodo || 'Compañero',
            nivel: aliadaLider.nivel,
            hpActual: aliadaLider.hpActual,
            hpMaximo: aliadaLider.hpMaximo,
          }
        : null,
    };
  }
}
