import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

export interface ParametrosPaginacionHistorial {
  pagina?: number;
  limite?: number;
}

@Injectable()
export class HistorialService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Registra una entrada en la bitácora del explorador.
   */
  async registrar(
    personajeId: string,
    tipo: string,
    descripcion: string,
    datosJson?: Record<string, any>,
  ) {
    return this.prisma.historial.create({
      data: {
        personajeId,
        tipo,
        descripcion,
        datosJson: datosJson ?? {},
      },
    });
  }

  /**
   * Consulta el historial cronológico del explorador activo de forma paginada.
   */
  async obtenerHistorial(
    usuarioId: string,
    paginacion: ParametrosPaginacionHistorial = {},
  ) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      select: { id: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para el usuario autenticado.',
      });
    }

    const pagina = Math.max(1, Number(paginacion.pagina) || 1);
    const limite = Math.min(100, Math.max(1, Number(paginacion.limite) || 20));
    const salto = (pagina - 1) * limite;

    const [total, registros] = await Promise.all([
      this.prisma.historial.count({
        where: { personajeId: personaje.id },
      }),
      this.prisma.historial.findMany({
        where: { personajeId: personaje.id },
        orderBy: { fechaRegistro: 'desc' },
        skip: salto,
        take: limite,
      }),
    ]);

    return {
      total,
      pagina,
      limite,
      eventos: registros.map((r) => ({
        eventoId: r.id,
        tipo: r.tipo,
        descripcion: r.descripcion,
        marcaTiempo: r.fechaRegistro.toISOString(),
      })),
    };
  }
}
