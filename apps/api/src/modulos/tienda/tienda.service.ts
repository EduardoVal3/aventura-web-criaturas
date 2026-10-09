import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

@Injectable()
export class TiendaService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Consulta el catálogo de artículos disponibles en la tienda de la ubicación activa.
   */
  async obtenerCatalogo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: { ubicacionActual: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const servicios = personaje.ubicacionActual.servicios ?? [];
    if (!servicios.includes('TIENDA')) {
      throw new ForbiddenException({
        codigo: 'SERVICIO_NO_DISPONIBLE',
        mensaje: 'La ubicación actual no cuenta con una tienda comercial.',
      });
    }

    const objetos = await this.prisma.objeto.findMany({
      where: { precioCompra: { gt: 0 } },
      orderBy: { codigo: 'asc' },
    });

    return {
      saldoMonedas: personaje.monedas,
      items: objetos.map((o) => ({
        codigo: o.codigo,
        nombre: o.nombre,
        descripcion: o.descripcion,
        tipo: o.tipo,
        precioCompra: o.precioCompra,
      })),
    };
  }

  /**
   * Procesa la compra atómica de objetos en la tienda descontando monedas (S-4, S-6).
   */
  async comprar(usuarioId: string, itemCodigo: string, cantidad: number = 1) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: { ubicacionActual: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const servicios = personaje.ubicacionActual.servicios ?? [];
    if (!servicios.includes('TIENDA')) {
      throw new ForbiddenException({
        codigo: 'SERVICIO_NO_DISPONIBLE',
        mensaje: 'La ubicación actual no cuenta con una tienda comercial.',
      });
    }

    const objeto = await this.prisma.objeto.findUnique({
      where: { codigo: itemCodigo },
    });

    if (!objeto) {
      throw new NotFoundException({
        codigo: 'OBJETO_NO_ENCONTRADO',
        mensaje: 'El objeto solicitado no se encuentra en el catálogo.',
      });
    }

    const unidades = Math.max(1, cantidad);
    // Servidor calcula unilateralmente el costo oficial (S-6)
    const costoTotal = objeto.precioCompra * unidades;

    return this.prisma.$transaction(async (tx) => {
      const personajeActual = await tx.personaje.findUnique({
        where: { id: personaje.id },
      });

      if (!personajeActual || personajeActual.monedas < costoTotal) {
        throw new BadRequestException({
          codigo: 'MONEDAS_INSUFICIENTES',
          mensaje: `Monedas insuficientes. Requieres ${costoTotal} monedas y posees ${
            personajeActual?.monedas ?? 0
          }.`,
        });
      }

      // Descontar saldo
      const personajeActualizado = await tx.personaje.update({
        where: { id: personaje.id },
        data: { monedas: { decrement: costoTotal } },
      });

      // Acreditar objetos en inventario mediante upsert aditivo
      await tx.inventarioPersonaje.upsert({
        where: {
          personajeId_objetoId: {
            personajeId: personaje.id,
            objetoId: objeto.id,
          },
        },
        update: { cantidad: { increment: unidades } },
        create: {
          personajeId: personaje.id,
          objetoId: objeto.id,
          cantidad: unidades,
        },
      });

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'COMERCIO',
          descripcion: `Compra de ${unidades}x ${objeto.nombre} por ${costoTotal} monedas.`,
          datosJson: {
            objetoCodigo: objeto.codigo,
            cantidad: unidades,
            costoTotal,
            saldoRestante: personajeActualizado.monedas,
          },
        },
      });

      return {
        itemCodigo: objeto.codigo,
        cantidadComprada: unidades,
        costoTotal,
        saldoRestante: personajeActualizado.monedas,
      };
    });
  }
}
