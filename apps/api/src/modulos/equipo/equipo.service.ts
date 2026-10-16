import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { MoverCriaturaEquipoDto } from './dto/mover-criatura-equipo.dto';
import { ActualizarOrdenEquipoDto } from './dto/actualizar-orden-equipo.dto';
import { calcularProgresoXp, calcularXpRequerida } from '../progreso/progreso.service';

@Injectable()
export class EquipoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerEquipo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const criaturas = await this.prisma.criatura.findMany({
      where: {
        personajeId: personaje.id,
        enEquipo: true,
      },
      include: { especie: true },
      orderBy: { ordenEquipo: 'asc' },
      take: 6,
    });

    return {
      criaturas: criaturas.map((c) => {
        const xpBase = calcularXpRequerida(c.nivel);
        const xpReal = c.experiencia < xpBase ? xpBase + c.experiencia : c.experiencia;
        const progreso = calcularProgresoXp(c.nivel, xpReal);
        return {
          criaturaId: c.id,
          slug: c.especie.slug,
          nombre: c.especie.nombre,
          apodo: c.apodo,
          nivel: c.nivel,
          hpActual: c.hpActual,
          hpMaximo: c.hpMaximo,
          ataque: c.ataque,
          defensa: c.defensa,
          velocidad: c.velocidad,
          experiencia: xpReal,
          porcentajeXp: progreso.porcentajeXp,
          xpSiguienteNivel: progreso.xpSiguienteNivel,
          xpNivelActual: progreso.xpNivelActual,
          orden: c.ordenEquipo ?? 1,
        };
      }),
    };
  }

  async obtenerAlmacen(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const criaturas = await this.prisma.criatura.findMany({
      where: {
        personajeId: personaje.id,
        enEquipo: false,
      },
      include: { especie: true },
      orderBy: { fechaCaptura: 'asc' },
    });

    return {
      criaturas: criaturas.map((c) => ({
        criaturaId: c.id,
        slug: c.especie.slug,
        nombre: c.especie.nombre,
        apodo: c.apodo,
        nivel: c.nivel,
        hpActual: c.hpActual,
        hpMaximo: c.hpMaximo,
      })),
    };
  }

  async actualizarOrden(usuarioId: string, dto: ActualizarOrdenEquipoDto) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo.',
      });
    }

    let paresOrden: { criaturaId: string; orden: number }[] = [];

    if (dto.orden && Array.isArray(dto.orden)) {
      paresOrden = dto.orden;
    } else if (dto.criaturaIds && Array.isArray(dto.criaturaIds)) {
      paresOrden = dto.criaturaIds.map((id, index) => ({
        criaturaId: id,
        orden: index + 1,
      }));
    } else {
      throw new BadRequestException({
        codigo: 'DATOS_INVALIDOS',
        mensaje: 'Debe proveer una lista de posiciones o IDs de criaturas para ordenar.',
      });
    }

    const criaturaIds = paresOrden.map((p) => p.criaturaId);
    const setIds = new Set(criaturaIds);
    if (setIds.size !== criaturaIds.length) {
      throw new BadRequestException({
        codigo: 'ORDEN_INVALIDO',
        mensaje: 'Hay IDs de criatura duplicados en la lista de orden.',
      });
    }

    await this.prisma.$transaction(async (tx) => {
      // simplificacion: bloqueo pesimista por fila de personaje; serializa toda la gestión de equipo de un mismo jugador. Suficiente con un jugador por sesión; si crece la concurrencia, migrar a aislamiento Serializable con reintentos (P2034).
      await tx.$queryRaw`SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE`;

      const criaturasEnEquipo = await tx.criatura.findMany({
        where: {
          personajeId: personaje.id,
          enEquipo: true,
        },
      });

      if (paresOrden.length !== criaturasEnEquipo.length) {
        throw new BadRequestException({
          codigo: 'ORDEN_INVALIDO',
          mensaje: 'La lista de orden debe incluir a todas las criaturas del equipo activo.',
        });
      }

      const idsEquipo = new Set(criaturasEnEquipo.map((c) => c.id));
      const todasPertenecen = criaturaIds.every((id) => idsEquipo.has(id));
      if (!todasPertenecen) {
        throw new BadRequestException({
          codigo: 'ORDEN_INVALIDO',
          mensaje: 'Una o más criaturas no pertenecen al equipo activo de tu personaje.',
        });
      }

      const ordenes = paresOrden.map((p) => p.orden).sort((a, b) => a - b);
      const esPermutacionValida = ordenes.every((val, idx) => val === idx + 1);
      if (!esPermutacionValida) {
        throw new BadRequestException({
          codigo: 'ORDEN_INVALIDO',
          mensaje: `Los valores de orden deben ser consecutivos de 1 a ${criaturasEnEquipo.length} sin repetir.`,
        });
      }

      for (const p of paresOrden) {
        await tx.criatura.update({
          where: { id: p.criaturaId },
          data: { ordenEquipo: p.orden },
        });
      }
    });

    return this.obtenerEquipo(usuarioId);
  }

  async moverCriatura(usuarioId: string, dto: MoverCriaturaEquipoDto) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: { ubicacionActual: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo.',
      });
    }

    // Regla de negocio: La gestión de equipo requiere estar en una localidad segura
    if (!personaje.ubicacionActual || !personaje.ubicacionActual.esSegura) {
      throw new ForbiddenException({
        codigo: 'ACCION_NO_PERMITIDA',
        mensaje: 'Solo puedes gestionar tu equipo en una localidad segura.',
      });
    }

    const criatura = await this.prisma.criatura.findFirst({
      where: {
        id: dto.criaturaId,
        personajeId: personaje.id,
      },
    });

    if (!criatura) {
      throw new NotFoundException({
        codigo: 'CRIATURA_NO_ENCONTRADA',
        mensaje: 'No se encontró la criatura especificada en tus posesiones.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const totalEnEquipo = await tx.criatura.count({
        where: {
          personajeId: personaje.id,
          enEquipo: true,
        },
      });

      if (dto.haciaEquipo) {
        // Almacén -> Equipo
        if (criatura.enEquipo) {
          const totalEnAlmacen = await tx.criatura.count({
            where: { personajeId: personaje.id, enEquipo: false },
          });
          return {
            mensaje: 'La criatura ya se encuentra en el equipo activo.',
            totalEnEquipo,
            totalEnAlmacen,
          };
        }

        // Regla A-6: Invariable máximo de 6 criaturas en equipo
        if (totalEnEquipo >= 6) {
          throw new ConflictException({
            codigo: 'EQUIPO_COMPLETO',
            mensaje: 'El equipo ya cuenta con el límite máximo de 6 criaturas.',
          });
        }

        await tx.criatura.update({
          where: { id: criatura.id },
          data: {
            enEquipo: true,
            ordenEquipo: totalEnEquipo + 1,
          },
        });
      } else {
        // Equipo -> Almacén
        if (!criatura.enEquipo) {
          const totalEnAlmacen = await tx.criatura.count({
            where: { personajeId: personaje.id, enEquipo: false },
          });
          return {
            mensaje: 'La criatura ya se encuentra en el almacén de reserva.',
            totalEnEquipo,
            totalEnAlmacen,
          };
        }

        // Regla: No vaciar el equipo por completo (al menos 1 criatura requerida)
        if (totalEnEquipo <= 1) {
          throw new BadRequestException({
            codigo: 'EQUIPO_MINIMO_REQUERIDO',
            mensaje: 'No puedes enviar al almacén la única criatura de tu equipo.',
          });
        }

        await tx.criatura.update({
          where: { id: criatura.id },
          data: {
            enEquipo: false,
            ordenEquipo: null,
          },
        });

        // Reajustar orden consecutivo de los miembros restantes
        const restantes = await tx.criatura.findMany({
          where: {
            personajeId: personaje.id,
            enEquipo: true,
            id: { not: criatura.id },
          },
          orderBy: { ordenEquipo: 'asc' },
        });

        for (let i = 0; i < restantes.length; i++) {
          await tx.criatura.update({
            where: { id: restantes[i].id },
            data: { ordenEquipo: i + 1 },
          });
        }
      }

      const totalFinalEquipo = await tx.criatura.count({
        where: { personajeId: personaje.id, enEquipo: true },
      });
      const totalFinalAlmacen = await tx.criatura.count({
        where: { personajeId: personaje.id, enEquipo: false },
      });

      return {
        mensaje: 'Criatura transferida exitosamente.',
        totalEnEquipo: totalFinalEquipo,
        totalEnAlmacen: totalFinalAlmacen,
      };
    });
  }
}
