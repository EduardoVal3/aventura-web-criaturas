import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

@Injectable()
export class MundoService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerUbicacionActual(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const zona = await this.prisma.zona.findUnique({
      where: { id: personaje.ubicacionActualId },
    });

    if (!zona) {
      throw new NotFoundException({
        codigo: 'ZONA_NO_ENCONTRADA',
        mensaje: 'La zona de ubicación actual no está registrada en el sistema.',
      });
    }

    const conexionesOrigen = await this.prisma.conexionZona.findMany({
      where: { zonaOrigenId: zona.id },
      include: { zonaDestino: true },
      orderBy: { zonaDestinoId: 'asc' },
    });

    const zonasDesbloqueadas = await this.prisma.zonaDesbloqueada.findMany({
      where: { personajeId: personaje.id },
    });

    const desbloqueadasSet = new Set(zonasDesbloqueadas.map((d) => d.zonaId));

    const conexiones = conexionesOrigen.map((c) => {
      const estaDesbloqueada = desbloqueadasSet.has(c.zonaDestinoId);
      const nivelSugerido =
        c.zonaDestino.nivelMinimo && c.zonaDestino.nivelMaximo
          ? `${c.zonaDestino.nivelMinimo}-${c.zonaDestino.nivelMaximo}`
          : null;

      return {
        ubicacionDestinoId: c.zonaDestinoId,
        nombre: c.zonaDestino.nombre,
        nivelSugerido,
        estaBloqueada: !estaDesbloqueada,
        requisito: !estaDesbloqueada ? 'Requiere progreso en el gremio o equipo' : null,
      };
    });

    const registroZonaActual = zonasDesbloqueadas.find(
      (d) => d.zonaId === zona.id,
    );
    const progresoZona = registroZonaActual?.progreso ?? (zona.esSegura ? 100 : 0);

    const slug = zona.nombre
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    return {
      ubicacionId: zona.id,
      nombre: zona.nombre,
      slug,
      tipo: zona.tipo,
      esSegura: zona.esSegura,
      descripcion: zona.descripcion,
      servicios: zona.servicios,
      progresoZona,
      conexiones,
    };
  }

  async viajar(usuarioId: string, destinoId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo.',
      });
    }

    const destino = await this.prisma.zona.findUnique({
      where: { id: destinoId },
    });

    if (!destino) {
      throw new BadRequestException({
        codigo: 'CONEXION_INVALIDA',
        mensaje: 'La zona de destino especificada no existe en el mundo.',
      });
    }

    // Validación 1: Conexión topológica directa en grafo
    const conexion = await this.prisma.conexionZona.findUnique({
      where: {
        zonaOrigenId_zonaDestinoId: {
          zonaOrigenId: personaje.ubicacionActualId,
          zonaDestinoId: destinoId,
        },
      },
    });

    if (!conexion) {
      throw new BadRequestException({
        codigo: 'CONEXION_INVALIDA',
        mensaje: 'El destino no está conectado directamente con tu ubicación actual.',
      });
    }

    // Validación 2: Zona desbloqueada (Regla S-2)
    const desbloqueada = await this.prisma.zonaDesbloqueada.findUnique({
      where: {
        personajeId_zonaId: {
          personajeId: personaje.id,
          zonaId: destinoId,
        },
      },
    });

    if (!desbloqueada) {
      throw new ForbiddenException({
        codigo: 'ZONA_BLOQUEADA',
        mensaje: 'La zona de destino requiere requisitos que aún no has desbloqueado.',
      });
    }

    // Validación 3: Ausencia de encuentro o combate activo pendiente
    const encuentroActivo = await this.prisma.encuentro.findFirst({
      where: {
        personajeId: personaje.id,
        estado: 'EN_CURSO',
      },
    });

    if (encuentroActivo) {
      throw new ConflictException({
        codigo: 'ENCUENTRO_PREVIO_ACTIVO',
        mensaje: 'No puedes desplazarte mientras tienes un encuentro activo pendiente de resolución.',
      });
    }

    const origenId = personaje.ubicacionActualId;

    await this.prisma.$transaction(async (tx) => {
      await tx.personaje.update({
        where: { id: personaje.id },
        data: { ubicacionActualId: destinoId },
      });

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'EXPLORACION',
          descripcion: `Viaje realizado desde ${origenId} hacia ${destino.nombre}.`,
          datosJson: { origen: origenId, destino: destinoId },
        },
      });
    });

    return {
      ubicacionActualId: destino.id,
      nombre: destino.nombre,
      mensaje: `Has llegado a ${destino.nombre}.`,
    };
  }
}
