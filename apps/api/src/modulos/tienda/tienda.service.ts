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

    const servicioDisponible = (personaje.ubicacionActual.servicios ?? []).includes('TIENDA');

    const [objetos, posesiones] = await Promise.all([
      this.prisma.objeto.findMany({
        where: { precioCompra: { gt: 0 } },
        orderBy: { precioCompra: 'asc' },
      }),
      this.prisma.inventarioPersonaje.findMany({
        where: { personajeId: personaje.id },
      }),
    ]);

    const cantidadesPorObjeto = new Map<string, number>();
    for (const p of posesiones) {
      cantidadesPorObjeto.set(p.objetoId, p.cantidad);
    }

    return {
      saldoMonedas: personaje.monedas,
      servicioDisponible,
      ubicacionActual: {
        id: personaje.ubicacionActual.id,
        nombre: personaje.ubicacionActual.nombre,
        esSegura: personaje.ubicacionActual.esSegura,
      },
      items: objetos.map((o) => ({
        codigo: o.codigo,
        nombre: o.nombre,
        descripcion: o.descripcion,
        tipo: o.tipo,
        precioCompra: o.precioCompra,
        efectoValor: o.efectoValor,
        cantidadEnInventario: cantidadesPorObjeto.get(o.id) ?? 0,
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

    if (!objeto || objeto.precioCompra <= 0) {
      throw new NotFoundException({
        codigo: 'OBJETO_NO_ENCONTRADO',
        mensaje: 'El objeto solicitado no se encuentra en el catálogo.',
      });
    }

    const unidades = Math.max(1, Math.min(99, Math.trunc(cantidad)));
    // Servidor calcula unilateralmente el costo oficial (S-6)
    const costoTotal = objeto.precioCompra * unidades;

    return this.prisma.$transaction(async (tx) => {
      // simplificacion: bloqueo pesimista por fila de personaje para serializar compras concurrentes; suficiente para sesiones individuales sin migrar a aislamiento Serializable.
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE`;
      }

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
      const registroInventario = await tx.inventarioPersonaje.upsert({
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
        nombre: objeto.nombre,
        cantidadComprada: unidades,
        precioUnitario: objeto.precioCompra,
        costoTotal,
        saldoRestante: personajeActualizado.monedas,
        cantidadEnInventario: registroInventario?.cantidad ?? unidades,
      };
    });
  }
}
