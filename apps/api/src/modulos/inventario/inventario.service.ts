import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

export const CAPACIDAD_INVENTARIO = 20;

@Injectable()
export class InventarioService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerInventario(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const posesiones = await this.prisma.inventarioPersonaje.findMany({
      where: { personajeId: personaje.id },
      include: { objeto: true },
      orderBy: { objeto: { codigo: 'asc' } },
    });

    const items = posesiones.map((p) => ({
      codigo: p.objeto.codigo,
      nombre: p.objeto.nombre,
      descripcion: p.objeto.descripcion,
      tipo: p.objeto.tipo,
      efectoValor: p.objeto.efectoValor,
      precioCompra: p.objeto.precioCompra,
      cantidad: p.cantidad,
    }));

    return {
      monedas: personaje.monedas,
      capacidadMaxima: CAPACIDAD_INVENTARIO,
      ranurasOcupadas: items.length,
      totalUnidades: items.reduce((acc, i) => acc + i.cantidad, 0),
      items,
    };
  }

  /**
   * Aplica un objeto consumible de curación sobre una criatura aliada respetando INV-03 y S-4.
   */
  async usarObjeto(usuarioId: string, itemCodigo: string, criaturaId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const criatura = await this.prisma.criatura.findUnique({
      where: { id: criaturaId },
      include: { especie: true },
    });

    if (!criatura || criatura.personajeId !== personaje.id) {
      throw new NotFoundException({
        codigo: 'CRIATURA_NO_ENCONTRADA',
        mensaje: 'No se encontró la criatura aliada en tus posesiones.',
      });
    }

    const objeto = await this.prisma.objeto.findUnique({
      where: { codigo: itemCodigo },
    });

    if (!objeto) {
      throw new BadRequestException({
        codigo: 'ITEM_NO_DISPONIBLE',
        mensaje: 'El objeto especificado no existe.',
      });
    }

    if (objeto.tipo && objeto.tipo !== 'CURACION') {
      throw new BadRequestException({
        codigo: 'OBJETO_NO_CONSUMIBLE',
        mensaje: 'Este objeto no puede aplicarse directamente fuera de combate.',
      });
    }

    return this.prisma.$transaction(async (tx) => {
      // simplificacion: bloqueo pesimista por fila de personaje para serializar consumo de objetos y curacion; suficiente para sesiones individuales sin migrar a aislamiento Serializable.
      if (typeof tx.$queryRaw === 'function') {
        await tx.$queryRaw`SELECT id FROM personaje WHERE id = ${personaje.id} FOR UPDATE`;
      }

      const criaturaActual =
        (await tx.criatura.findUnique?.({
          where: { id: criaturaId },
          include: { especie: true },
        })) ?? criatura;

      if (criaturaActual.hpActual >= criaturaActual.hpMaximo) {
        throw new BadRequestException({
          codigo: 'SALUD_COMPLETA',
          mensaje: 'La criatura seleccionada ya tiene sus puntos de golpe al máximo.',
        });
      }

      const itemInventario = await tx.inventarioPersonaje.findUnique({
        where: {
          personajeId_objetoId: {
            personajeId: personaje.id,
            objetoId: objeto.id,
          },
        },
      });

      if (!itemInventario || itemInventario.cantidad < 1) {
        throw new BadRequestException({
          codigo: 'ITEM_NO_DISPONIBLE',
          mensaje: 'No posees este objeto en tu inventario.',
        });
      }

      // Descontar objeto del inventario
      const cantidadRestante = itemInventario.cantidad - 1;
      if (cantidadRestante === 0) {
        await tx.inventarioPersonaje.delete({
          where: { id: itemInventario.id },
        });
      } else {
        await tx.inventarioPersonaje.update({
          where: { id: itemInventario.id },
          data: { cantidad: { decrement: 1 } },
        });
      }

      // Curar respetando invariante INV-03: hpNuevo = min(hpMaximo, hpActual + efectoValor)
      const hpPrevio = criaturaActual.hpActual;
      const hpNuevo = Math.min(criaturaActual.hpMaximo, hpPrevio + objeto.efectoValor);
      const curacionAplicada = hpNuevo - hpPrevio;

      await tx.criatura.update({
        where: { id: criaturaActual.id },
        data: { hpActual: hpNuevo },
      });

      const criaturaNombre =
        criaturaActual.apodo ||
        ('especie' in criaturaActual && criaturaActual.especie?.nombre) ||
        'criatura';

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'OBJETO',
          descripcion: `Uso de ${objeto.nombre} en ${criaturaNombre} (+${curacionAplicada} HP).`,
          datosJson: {
            objetoCodigo: itemCodigo,
            criaturaId: criaturaActual.id,
            hpPrevio,
            hpNuevo,
            cantidadRestante,
          },
        },
      });

      return {
        criaturaId: criaturaActual.id,
        criaturaNombre,
        hpPrevio,
        hpNuevo,
        hpMaximo: criaturaActual.hpMaximo,
        curacionAplicada,
        cantidadRestante,
      };
    });
  }
}
