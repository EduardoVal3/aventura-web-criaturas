import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

export type CategoriaHistorial = 'COMBATE' | 'CAPTURA' | 'EXPLORACION' | 'TIENDA' | 'CURACION';

export const MAPA_CATEGORIA_A_TIPOS: Record<CategoriaHistorial, string[]> = {
  CAPTURA: ['CAPTURA'],
  TIENDA: ['COMERCIO', 'TIENDA', 'COMPRA'],
  CURACION: ['CURACION', 'SANTUARIO'],
  COMBATE: ['COMBATE', 'VICTORIA_COMBATE', 'DERROTA_COMBATE', 'HUIDA', 'PROGRESO'],
  EXPLORACION: ['EXPLORACION', 'ENCUENTRO', 'OBJETO', 'VIAJE', 'SIN_EVENTO'],
};

/**
 * Normaliza cualquier tipo interno de evento registrado por los módulos del servidor
 * a una de las 5 categorías canónicas de la bitácora del explorador.
 */
export function normalizarCategoriaHistorial(tipo: string): CategoriaHistorial {
  const tipoUpper = (tipo || '').toUpperCase().trim();

  if (tipoUpper === 'CAPTURA') {
    return 'CAPTURA';
  }

  if (['COMERCIO', 'TIENDA', 'COMPRA'].includes(tipoUpper)) {
    return 'TIENDA';
  }

  if (['CURACION', 'SANTUARIO'].includes(tipoUpper)) {
    return 'CURACION';
  }

  if (
    ['COMBATE', 'VICTORIA_COMBATE', 'DERROTA_COMBATE', 'HUIDA', 'PROGRESO'].includes(tipoUpper)
  ) {
    return 'COMBATE';
  }

  return 'EXPLORACION';
}

export interface ParametrosPaginacionHistorial {
  pagina?: number;
  limite?: number;
  categoria?: string;
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
   * Consulta el historial cronológico del explorador activo de forma paginada y categorizada.
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

    let filtroTipo: any = undefined;
    if (paginacion.categoria) {
      const catUpper = paginacion.categoria.toUpperCase().trim() as CategoriaHistorial;
      if (MAPA_CATEGORIA_A_TIPOS[catUpper]) {
        filtroTipo = { in: MAPA_CATEGORIA_A_TIPOS[catUpper] };
      } else {
        filtroTipo = { equals: paginacion.categoria };
      }
    }

    const where = {
      personajeId: personaje.id,
      ...(filtroTipo ? { tipo: filtroTipo } : {}),
    };

    const [total, registros] = await Promise.all([
      this.prisma.historial.count({ where }),
      this.prisma.historial.findMany({
        where,
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
        categoria: normalizarCategoriaHistorial(r.tipo),
        descripcion: r.descripcion,
        marcaTiempo: r.fechaRegistro.toISOString(),
        datosJson: (r.datosJson as Record<string, unknown>) ?? {},
      })),
    };
  }
}
