import { Injectable, NotFoundException } from '@nestjs/common';
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
}
