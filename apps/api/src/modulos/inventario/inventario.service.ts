import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';

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

    return {
      monedas: personaje.monedas,
      items: posesiones.map((p) => ({
        codigo: p.objeto.codigo,
        nombre: p.objeto.nombre,
        tipo: p.objeto.tipo,
        cantidad: p.cantidad,
      })),
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

    return this.prisma.$transaction(async (tx) => {
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
      const hpPrevio = criatura.hpActual;
      const hpNuevo = Math.min(criatura.hpMaximo, hpPrevio + objeto.efectoValor);

      await tx.criatura.update({
        where: { id: criatura.id },
        data: { hpActual: hpNuevo },
      });

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'OBJETO',
          descripcion: `Uso de ${objeto.nombre} en ${criatura.apodo || 'criatura'} (+${hpNuevo - hpPrevio} HP).`,
          datosJson: {
            objetoCodigo: itemCodigo,
            criaturaId: criatura.id,
            hpPrevio,
            hpNuevo,
            cantidadRestante,
          },
        },
      });

      return {
        criaturaId: criatura.id,
        hpPrevio,
        hpNuevo,
        cantidadRestante,
      };
    });
  }
}
