import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { HistorialService } from '../historial/historial.service';
import {
  GeneradorAleatorio,
  GeneradorAleatorioNativo,
} from '../../comun/azar/generador-aleatorio.interface';
import { ESTADOS_ENCUENTRO, esEstadoTerminal } from './dominio/estado-encuentro';

/**
 * Calcula el daño final según la fórmula de equilibrio del juego (§2.1).
 * danoBruto = floor((ataque / max(1, defensa)) * poder * 0.8 + nivel * 0.5)
 * danoFinal = max(1, danoBruto) -> Cumple INV-04
 */
export function calcularDano(
  ataque: number,
  defensa: number,
  poder: number,
  nivel: number,
): number {
  const danoBruto = Math.floor(
    (ataque / Math.max(1, defensa)) * poder * 0.8 + nivel * 0.5,
  );
  return Math.max(1, danoBruto);
}

/**
 * Aplica daño al HP respetando el intervalo [0, hpMaximo] (§2.1 y INV-03).
 */
export function aplicarDano(
  hpPrevio: number,
  danoFinal: number,
  hpMaximo: number,
): number {
  return Math.max(0, Math.min(hpMaximo, hpPrevio - danoFinal));
}

/**
 * Calcula la probabilidad final de huida acotada (§2.5).
 * probHuidaBruta = (velJugador / (velJugador + velRival)) + 0.10 * (intentos - 1)
 * probHuidaFinal = clamp(0.10, 0.90, probHuidaBruta)
 */
export function calcularProbabilidadHuida(
  velJugador: number,
  velRival: number,
  intentos: number = 1,
): number {
  const intentosSeguros = Math.max(1, intentos);
  const denominador = Math.max(1, velJugador + velRival);
  const probBruta = velJugador / denominador + 0.1 * (intentosSeguros - 1);
  return Math.max(0.1, Math.min(0.9, probBruta));
}

@Injectable()
export class CombateService {
  private readonly generador: GeneradorAleatorio;

  constructor(
    private readonly prisma: PrismaService,
    private readonly historialService: HistorialService,
    @Optional() generador?: GeneradorAleatorio,
  ) {
    this.generador = generador ?? new GeneradorAleatorioNativo();
  }

  /**
   * Resuelve el personaje activo del usuario autenticado.
   */
  private async obtenerPersonajeAutenticado(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });
    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para el usuario autenticado.',
      });
    }
    return personaje;
  }

  /**
   * Valida la existencia, pertenencia y estado activo de un encuentro.
   */
  private async validarEncuentroActivo(encuentroId: string, personajeId: string) {
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
        combates: {
          orderBy: { turno: 'desc' },
          take: 1,
        },
      },
    });

    if (!encuentro) {
      throw new NotFoundException({
        codigo: 'ENCUENTRO_NO_ENCONTRADO',
        mensaje: 'No se encontró el encuentro especificado.',
      });
    }

    if (encuentro.personajeId !== personajeId) {
      throw new ForbiddenException({
        codigo: 'ENCUENTRO_NO_AUTORIZADO',
        mensaje: 'El encuentro no pertenece al personaje autenticado.',
      });
    }

    if (esEstadoTerminal(encuentro.estado)) {
      throw new BadRequestException({
        codigo: 'ENCUENTRO_NO_ACTIVO',
        mensaje: 'El encuentro ya no se encuentra activo o ha finalizado.',
      });
    }

    const ultimoCombate = encuentro.combates[0];
    if (ultimoCombate && !ultimoCombate.esTurnoJugador) {
      throw new BadRequestException({
        codigo: 'ACCION_FUERA_DE_TURNO',
        mensaje: 'No es el turno del jugador en este combate.',
      });
    }

    return { encuentro, ultimoCombate };
  }

  /**
   * Ejecuta una acción de ataque en el combate por turnos.
   */
  async atacar(
    usuarioId: string,
    encuentroId: string,
    movimientoIndice: number = 0,
  ) {
    const personaje = await this.obtenerPersonajeAutenticado(usuarioId);
    const { encuentro, ultimoCombate } = await this.validarEncuentroActivo(
      encuentroId,
      personaje.id,
    );

    // Obtener criatura aliada activa en el equipo
    const criaturaAliada = await this.prisma.criatura.findFirst({
      where: {
        personajeId: personaje.id,
        enEquipo: true,
        hpActual: { gt: 0 },
      },
      orderBy: { ordenEquipo: 'asc' },
      include: {
        especie: {
          include: { movimientos: true },
        },
      },
    });

    if (!criaturaAliada) {
      throw new BadRequestException({
        codigo: 'EQUIPO_DEBILITADO',
        mensaje: 'No tienes ninguna criatura activa con puntos de golpe disponibles.',
      });
    }

    // Determinar movimiento del jugador
    const movimientosAliados = criaturaAliada.especie.movimientos;
    const movimientoAliado =
      movimientosAliados[movimientoIndice] ??
      movimientosAliados[0] ?? {
        nombre: 'Golpe Firme',
        poder: 12,
      };

    const turnoActual = (ultimoCombate?.turno ?? 0) + 1;

    // 1. Daño del jugador al rival
    const danoJugador = calcularDano(
      criaturaAliada.ataque,
      encuentro.criaturaRival.defensa,
      movimientoAliado.poder,
      criaturaAliada.nivel,
    );
    const nuevoHpRival = aplicarDano(
      encuentro.criaturaRival.hpActual,
      danoJugador,
      encuentro.criaturaRival.hpMaximo,
    );

    // Si el rival se debilita: VICTORIA
    if (nuevoHpRival <= 0) {
      return this.prisma.$transaction(async (tx) => {
        await tx.criatura.update({
          where: { id: encuentro.criaturaRivalId },
          data: { hpActual: 0 },
        });

        await tx.encuentro.update({
          where: { id: encuentro.id },
          data: {
            estado: ESTADOS_ENCUENTRO.VICTORIA,
            fechaResolucion: new Date(),
          },
        });

        await tx.combate.create({
          data: {
            encuentroId: encuentro.id,
            turno: turnoActual,
            esTurnoJugador: true,
            accionUltima: 'ATACAR',
            detalleJson: {
              movimientoJugador: movimientoAliado.nombre,
              danoJugador,
              hpRestanteRival: 0,
              victoria: true,
            },
          },
        });

        await this.historialService.registrar(
          personaje.id,
          'COMBATE',
          `Victoria sobre ${encuentro.criaturaRival.especie.nombre} en el turno ${turnoActual}.`,
          { encuentroId: encuentro.id, danoFinal: danoJugador },
        );

        return {
          encuentroId: encuentro.id,
          estado: ESTADOS_ENCUENTRO.VICTORIA,
          turno: turnoActual,
          accionJugador: {
            movimiento: movimientoAliado.nombre,
            danoCausado: danoJugador,
            hpRestanteRival: 0,
          },
          accionRival: null,
          resultadoFinal: ESTADOS_ENCUENTRO.VICTORIA,
        };
      });
    }

    // 2. Si el rival sobrevive: contraataque rival
    const movimientosRivales = encuentro.criaturaRival.especie.movimientos;
    const movimientoRival =
      movimientosRivales[0] ?? {
        nombre: 'Ataque Salvaje',
        poder: 10,
      };

    const danoRival = calcularDano(
      encuentro.criaturaRival.ataque,
      criaturaAliada.defensa,
      movimientoRival.poder,
      encuentro.criaturaRival.nivel,
    );
    const nuevoHpAliado = aplicarDano(
      criaturaAliada.hpActual,
      danoRival,
      criaturaAliada.hpMaximo,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.criatura.update({
        where: { id: encuentro.criaturaRivalId },
        data: { hpActual: nuevoHpRival },
      });

      await tx.criatura.update({
        where: { id: criaturaAliada.id },
        data: { hpActual: nuevoHpAliado },
      });

      let estadoEncuentroFinal: string = ESTADOS_ENCUENTRO.ACTIVO;
      let resultadoFinal: string | null = null;

      // Evaluar si todo el equipo aliado fue derrotado
      if (nuevoHpAliado <= 0) {
        const criaturasVivasRestantes = await tx.criatura.count({
          where: {
            personajeId: personaje.id,
            enEquipo: true,
            hpActual: { gt: 0 },
            id: { not: criaturaAliada.id },
          },
        });

        if (criaturasVivasRestantes === 0) {
          estadoEncuentroFinal = ESTADOS_ENCUENTRO.DERROTA;
          resultadoFinal = ESTADOS_ENCUENTRO.DERROTA;

          await tx.encuentro.update({
            where: { id: encuentro.id },
            data: {
              estado: ESTADOS_ENCUENTRO.DERROTA,
              fechaResolucion: new Date(),
            },
          });

          await this.historialService.registrar(
            personaje.id,
            'COMBATE',
            `Tu equipo ha sido debilitado por ${encuentro.criaturaRival.especie.nombre}.`,
            { encuentroId: encuentro.id, derrota: true },
          );
        }
      }

      await tx.combate.create({
        data: {
          encuentroId: encuentro.id,
          turno: turnoActual,
          esTurnoJugador: true,
          accionUltima: 'ATACAR',
          detalleJson: {
            movimientoJugador: movimientoAliado.nombre,
            danoJugador,
            hpRestanteRival: nuevoHpRival,
            movimientoRival: movimientoRival.nombre,
            danoRival,
            hpRestanteAliado: nuevoHpAliado,
            resultadoFinal,
          },
        },
      });

      return {
        encuentroId: encuentro.id,
        estado: estadoEncuentroFinal,
        turno: turnoActual + 1,
        accionJugador: {
          movimiento: movimientoAliado.nombre,
          danoCausado: danoJugador,
          hpRestanteRival: nuevoHpRival,
        },
        accionRival: {
          movimiento: movimientoRival.nombre,
          danoCausado: danoRival,
          hpRestanteAliado: nuevoHpAliado,
        },
        resultadoFinal,
      };
    });
  }

  /**
   * Resuelve el intento de huida del encuentro.
   */
  async huir(usuarioId: string, encuentroId: string) {
    const personaje = await this.obtenerPersonajeAutenticado(usuarioId);
    const { encuentro, ultimoCombate } = await this.validarEncuentroActivo(
      encuentroId,
      personaje.id,
    );

    const criaturaAliada = await this.prisma.criatura.findFirst({
      where: {
        personajeId: personaje.id,
        enEquipo: true,
        hpActual: { gt: 0 },
      },
      orderBy: { ordenEquipo: 'asc' },
      include: {
        especie: {
          include: { movimientos: true },
        },
      },
    });

    if (!criaturaAliada) {
      throw new BadRequestException({
        codigo: 'EQUIPO_DEBILITADO',
        mensaje: 'No tienes criaturas activas en el equipo.',
      });
    }

    const intentosPrevios = await this.prisma.combate.count({
      where: {
        encuentroId: encuentro.id,
        accionUltima: { in: ['HUIR', 'HUIR_FALLIDO'] },
      },
    });

    const probHuida = calcularProbabilidadHuida(
      criaturaAliada.velocidad,
      encuentro.criaturaRival.velocidad,
      intentosPrevios + 1,
    );

    const exitoHuida = this.generador.generar() < probHuida;
    const turnoActual = (ultimoCombate?.turno ?? 0) + 1;

    if (exitoHuida) {
      return this.prisma.$transaction(async (tx) => {
        await tx.encuentro.update({
          where: { id: encuentro.id },
          data: {
            estado: ESTADOS_ENCUENTRO.HUIDO,
            fechaResolucion: new Date(),
          },
        });

        await tx.combate.create({
          data: {
            encuentroId: encuentro.id,
            turno: turnoActual,
            esTurnoJugador: true,
            accionUltima: 'HUIR',
            detalleJson: { exito: true },
          },
        });

        await this.historialService.registrar(
          personaje.id,
          'COMBATE',
          `Huida exitosa de combate frente a ${encuentro.criaturaRival.especie.nombre}.`,
          { encuentroId: encuentro.id },
        );

        return {
          exito: true,
          mensaje: '¡Lograste huir del combate con éxito!',
          estado: ESTADOS_ENCUENTRO.HUIDO,
        };
      });
    }

    // Huida fallida: contraataque rival
    const movimientosRivales = encuentro.criaturaRival.especie.movimientos;
    const movimientoRival =
      movimientosRivales[0] ?? {
        nombre: 'Ataque Salvaje',
        poder: 10,
      };

    const danoRival = calcularDano(
      encuentro.criaturaRival.ataque,
      criaturaAliada.defensa,
      movimientoRival.poder,
      encuentro.criaturaRival.nivel,
    );
    const nuevoHpAliado = aplicarDano(
      criaturaAliada.hpActual,
      danoRival,
      criaturaAliada.hpMaximo,
    );

    return this.prisma.$transaction(async (tx) => {
      await tx.criatura.update({
        where: { id: criaturaAliada.id },
        data: { hpActual: nuevoHpAliado },
      });

      let estadoFinal: string = ESTADOS_ENCUENTRO.ACTIVO;

      if (nuevoHpAliado <= 0) {
        const vivasRestantes = await tx.criatura.count({
          where: {
            personajeId: personaje.id,
            enEquipo: true,
            hpActual: { gt: 0 },
            id: { not: criaturaAliada.id },
          },
        });

        if (vivasRestantes === 0) {
          estadoFinal = ESTADOS_ENCUENTRO.DERROTA;
          await tx.encuentro.update({
            where: { id: encuentro.id },
            data: {
              estado: ESTADOS_ENCUENTRO.DERROTA,
              fechaResolucion: new Date(),
            },
          });
        }
      }

      await tx.combate.create({
        data: {
          encuentroId: encuentro.id,
          turno: turnoActual,
          esTurnoJugador: true,
          accionUltima: 'HUIR_FALLIDO',
          detalleJson: {
            exito: false,
            danoRival,
            hpRestanteAliado: nuevoHpAliado,
          },
        },
      });

      return {
        exito: false,
        mensaje:
          '¡No pudiste escapar! La criatura rival bloquea tu paso y contraataca.',
        estado: estadoFinal,
        contraataqueRival: {
          movimiento: movimientoRival.nombre,
          danoCausado: danoRival,
          hpRestanteAliado: nuevoHpAliado,
        },
      };
    });
  }
}
