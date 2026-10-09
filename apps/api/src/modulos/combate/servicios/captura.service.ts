import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../../comun/prisma/prisma.service';
import { HistorialService } from '../../historial/historial.service';
import {
  GeneradorAleatorio,
  GeneradorAleatorioNativo,
} from '../../../comun/azar/generador-aleatorio.interface';
import { ESTADOS_ENCUENTRO, esEstadoTerminal } from '../dominio/estado-encuentro';
import { calcularDano, aplicarDano } from '../combate.service';

export const MULTIPLICADORES_TALISMAN: Record<string, number> = {
  'talisman-basico': 1.0,
  'talisman-resonante': 1.5,
};

/**
 * Calcula la probabilidad final de captura según las reglas de equilibrio (§2.2).
 * factorSalud = 1.0 - 0.5 * (hpActual / hpMaximo)
 * probBruta = tasaCaptura * factorSalud * multiplicadorTalisman
 * probFinal = clamp(0.05, 0.95, probBruta) -> Cumple INV-02
 */
export function calcularProbabilidadCaptura(
  tasaCaptura: number,
  hpActual: number,
  hpMaximo: number,
  multiplicadorTalisman: number = 1.0,
): number {
  const hpSeguro = Math.max(1, hpActual);
  const maxSeguro = Math.max(1, hpMaximo);
  const factorSalud = 1.0 - 0.5 * (hpSeguro / maxSeguro);
  const probBruta = tasaCaptura * factorSalud * multiplicadorTalisman;
  return Math.max(0.05, Math.min(0.95, probBruta));
}

@Injectable()
export class CapturaService {
  private readonly generador: GeneradorAleatorio;

  constructor(
    private readonly prisma: PrismaService,
    private readonly historialService: HistorialService,
    @Optional() generador?: GeneradorAleatorio,
  ) {
    this.generador = generador ?? new GeneradorAleatorioNativo();
  }

  /**
   * Valida precondiciones y calcula la probabilidad de captura en servidor.
   */
  async validarYCalcularProbabilidad(
    usuarioId: string,
    encuentroId: string,
    itemCodigo: string,
  ) {
    // 1. Validar personaje
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });
    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró el personaje activo del jugador.',
      });
    }

    // 2. Validar encuentro (S-3)
    const encuentro = await this.prisma.encuentro.findUnique({
      where: { id: encuentroId },
      include: {
        criaturaRival: {
          include: {
            especie: {
              include: { movimientos: true },
            },
          },
        },
      },
    });

    if (!encuentro) {
      throw new NotFoundException({
        codigo: 'ENCUENTRO_NO_ENCONTRADO',
        mensaje: 'No se encontró el encuentro especificado.',
      });
    }

    if (encuentro.personajeId !== personaje.id) {
      throw new ForbiddenException({
        codigo: 'ENCUENTRO_NO_AUTORIZADO',
        mensaje: 'El encuentro no pertenece al personaje autenticado.',
      });
    }

    if (esEstadoTerminal(encuentro.estado)) {
      throw new BadRequestException({
        codigo: 'ENCUENTRO_NO_ACTIVO',
        mensaje: 'El encuentro ya no se encuentra activo.',
      });
    }

    // 3. Validar objeto y posesión en inventario (S-4)
    const objeto = await this.prisma.objeto.findUnique({
      where: { codigo: itemCodigo },
    });

    if (!objeto || !MULTIPLICADORES_TALISMAN[itemCodigo]) {
      throw new BadRequestException({
        codigo: 'ITEM_NO_DISPONIBLE',
        mensaje: 'El objeto indicado no es un talismán de captura válido.',
      });
    }

    const itemInventario = await this.prisma.inventarioPersonaje.findUnique({
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
        mensaje: 'No posees este talismán en tu inventario.',
      });
    }

    const multiplicador = MULTIPLICADORES_TALISMAN[itemCodigo] ?? 1.0;
    const probabilidadFinal = calcularProbabilidadCaptura(
      encuentro.criaturaRival.especie.tasaCaptura,
      encuentro.criaturaRival.hpActual,
      encuentro.criaturaRival.hpMaximo,
      multiplicador,
    );

    return {
      personaje,
      encuentro,
      objeto,
      itemInventario,
      probabilidadFinal,
    };
  }
}
