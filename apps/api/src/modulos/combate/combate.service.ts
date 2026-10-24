import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { HistorialService } from '../historial/historial.service';
import {
  GeneradorAleatorio,
  GeneradorAleatorioNativo,
} from '../../comun/azar/generador-aleatorio.interface';
import { ESTADOS_ENCUENTRO, esEstadoTerminal } from './dominio/estado-encuentro';
import { ProgresoService } from '../progreso/progreso.service';
import {
  calcularDano,
  aplicarDano,
  calcularDanoElemental,
  multiplicadorAfinidad,
  etiquetaEfectividad,
  TABLA_AFINIDADES,
  ELEMENTOS,
  Elemento,
  EtiquetaEfectividad,
  CodigoEstado,
  EstadoActivo,
  EstadoBatalla,
  leerEstadoBatalla,
  resolverRonda,
  Combatiente,
} from './dominio/motor-combate';

export {
  calcularDano,
  aplicarDano,
  calcularDanoElemental,
  multiplicadorAfinidad,
  etiquetaEfectividad,
  TABLA_AFINIDADES,
  ELEMENTOS,
  Elemento,
  EtiquetaEfectividad,
  CodigoEstado,
  EstadoActivo,
  EstadoBatalla,
  leerEstadoBatalla,
  resolverRonda,
  Combatiente,
};

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
    @Optional() private readonly progresoService?: ProgresoService,
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
              include: {
                movimientos: {
                  orderBy: { slot: 'asc' },
                },
              },
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
   * Bloquea pesimistamente el personaje y verifica que el turno no haya avanzado concurrentemente.
   */
  // simplificacion: bloqueo pesimista por fila de personaje para serializar turnos concurrentes; suficiente para sesiones individuales sin migrar a Serializable.
  private async bloquearYVerificarTurno(
    tx: any,
    personajeId: string,
    encuentroId: string,
    turnoEsperado: number,
  ): Promise<void> {
    if (typeof tx.$queryRaw === 'function') {
      await tx.$queryRaw`SELECT id FROM personaje WHERE id = ${personajeId} FOR UPDATE`;
    }

    if (typeof tx.combate?.findFirst === 'function') {
      const ultimoEnTx = await tx.combate.findFirst({
        where: { encuentroId },
        orderBy: { turno: 'desc' },
        select: { turno: true },
      });

      const turnoActualEnTx = (ultimoEnTx?.turno ?? 0) + 1;
      if (turnoActualEnTx !== turnoEsperado) {
        throw new ConflictException({
          codigo: 'TURNO_DESACTUALIZADO',
          mensaje:
            'El turno del combate ya ha sido resuelto por otra acción concurrente.',
        });
      }
    }
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
          include: {
            movimientos: {
              orderBy: { slot: 'asc' },
            },
          },
        },
      },
    });

    if (!criaturaAliada) {
      throw new BadRequestException({
        codigo: 'EQUIPO_DEBILITADO',
        mensaje:
          'No tienes ninguna criatura activa con puntos de golpe disponibles.',
      });
    }

    // Leer snapshot previo de estado y resonancia
    const estadoBatallaPrevio = leerEstadoBatalla(
      ultimoCombate?.detalleJson,
      criaturaAliada.id,
    );
    const resonanciaPrevia = estadoBatallaPrevio.aliada.resonancia;

    // Validación y desbloqueo de Movimiento Insignia (slot 4, índice 3) con Resonancia 100%
    if (movimientoIndice === 3 && resonanciaPrevia < 100) {
      throw new BadRequestException({
        codigo: 'MOVIMIENTO_BLOQUEADO',
        mensaje: 'La Resonancia aún no llegó al 100 %.',
      });
    }

    const movimientosAliados = criaturaAliada.especie?.movimientos ?? [];
    const aliadaCombatiente: Combatiente = {
      id: criaturaAliada.id,
      nombre: (criaturaAliada as any).apodo ?? criaturaAliada.especie?.nombre ?? 'Aliada',
      nivel: criaturaAliada.nivel,
      ataque: criaturaAliada.ataque,
      defensa: criaturaAliada.defensa,
      velocidad: criaturaAliada.velocidad,
      hpActual: criaturaAliada.hpActual,
      hpMaximo: criaturaAliada.hpMaximo,
      elemento: criaturaAliada.especie?.elemento ?? 'fisico',
      movimientos: movimientosAliados.map((m: any) => ({
        nombre: m.nombre,
        poder: m.poder ?? 10,
        tipoAccion: m.tipoAccion ?? 'Ataque melé',
        slot: m.slot,
        efecto: m.efecto,
      })),
    };

    const movimientosRivales = encuentro.criaturaRival.especie?.movimientos ?? [];
    const rivalCombatiente: Combatiente = {
      id: encuentro.criaturaRival.id,
      nombre: (encuentro.criaturaRival as any).apodo ?? encuentro.criaturaRival.especie?.nombre ?? 'Rival',
      nivel: encuentro.criaturaRival.nivel,
      ataque: encuentro.criaturaRival.ataque,
      defensa: encuentro.criaturaRival.defensa,
      velocidad: encuentro.criaturaRival.velocidad,
      hpActual: encuentro.criaturaRival.hpActual,
      hpMaximo: encuentro.criaturaRival.hpMaximo,
      elemento: encuentro.criaturaRival.especie?.elemento ?? 'fisico',
      movimientos: movimientosRivales.map((m: any) => ({
        nombre: m.nombre,
        poder: m.poder ?? 10,
        tipoAccion: m.tipoAccion ?? 'Ataque melé',
        slot: m.slot,
        efecto: m.efecto,
      })),
    };

    const resultadoRonda = resolverRonda(
      aliadaCombatiente,
      rivalCombatiente,
      estadoBatallaPrevio,
      { indiceMovimiento: movimientoIndice },
      this.generador,
    );

    const turnoActual = (ultimoCombate?.turno ?? 0) + 1;

    return this.prisma.$transaction(async (tx) => {
      await this.bloquearYVerificarTurno(tx, personaje.id, encuentro.id, turnoActual);

      await tx.criatura.update({
        where: { id: encuentro.criaturaRivalId },
        data: { hpActual: resultadoRonda.hpRestanteRival },
      });

      await tx.criatura.update({
        where: { id: criaturaAliada.id },
        data: { hpActual: resultadoRonda.hpRestanteAliada },
      });

      let estadoEncuentroFinal: string = ESTADOS_ENCUENTRO.ACTIVO;
      let resultadoFinal: string | null = null;
      let progresoVictoria: any = null;

      if (resultadoRonda.resultado === 'VICTORIA') {
        estadoEncuentroFinal = ESTADOS_ENCUENTRO.VICTORIA;
        resultadoFinal = ESTADOS_ENCUENTRO.VICTORIA;

        await tx.encuentro.update({
          where: { id: encuentro.id },
          data: {
            estado: ESTADOS_ENCUENTRO.VICTORIA,
            fechaResolucion: new Date(),
          },
        });

        if (this.progresoService) {
          progresoVictoria = await this.progresoService.aplicarRecompensaVictoria(
            tx,
            personaje.id,
            criaturaAliada.id,
            encuentro.criaturaRival,
          );
        }

        if (encuentro.zonaId) {
          const regZona = await tx.zonaDesbloqueada.findUnique({
            where: {
              personajeId_zonaId: {
                personajeId: personaje.id,
                zonaId: encuentro.zonaId,
              },
            },
          });
          const progresoActualizado = Math.min(100, (regZona?.progreso ?? 0) + 20);
          await tx.zonaDesbloqueada.upsert({
            where: {
              personajeId_zonaId: {
                personajeId: personaje.id,
                zonaId: encuentro.zonaId,
              },
            },
            update: { progreso: progresoActualizado },
            create: {
              personajeId: personaje.id,
              zonaId: encuentro.zonaId,
              progreso: progresoActualizado,
            },
          });
        }

        await this.historialService.registrar(
          personaje.id,
          'COMBATE',
          `Victoria sobre ${encuentro.criaturaRival.especie?.nombre ?? 'Rival'} en el turno ${turnoActual}.`,
          {
            encuentroId: encuentro.id,
            danoFinal: resultadoRonda.accionJugador?.danoCausado ?? 0,
          },
        );
      } else if (resultadoRonda.resultado === 'ALIADA_DEBILITADA') {
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
            `Tu equipo ha sido debilitado por ${encuentro.criaturaRival.especie?.nombre ?? 'Rival'}.`,
            { encuentroId: encuentro.id, derrota: true },
          );
        } else {
          resultadoFinal = 'ALIADA_DEBILITADA';
        }
      }

      const accionRivalFormateada = resultadoRonda.accionRival
        ? {
            ...resultadoRonda.accionRival,
            hpRestanteAliado: resultadoRonda.accionRival.hpRestanteRival,
          }
        : null;

      const detalleJsonPersistido = {
        movimientoJugador: resultadoRonda.accionJugador?.movimiento ?? 'Ninguno',
        danoJugador: resultadoRonda.accionJugador?.danoCausado ?? 0,
        hpRestanteRival: resultadoRonda.hpRestanteRival,
        movimientoRival: resultadoRonda.accionRival?.movimiento ?? null,
        danoRival: resultadoRonda.accionRival?.danoCausado ?? null,
        hpRestanteAliado: resultadoRonda.hpRestanteAliada,
        resultadoFinal,
        progreso: progresoVictoria,
        victoria: resultadoRonda.resultado === 'VICTORIA',
        estadoBatalla: resultadoRonda.estadoBatalla,
        efectosFinDeTurno: resultadoRonda.efectosFinDeTurno,
        mensajes: resultadoRonda.mensajes,
      };

      await tx.combate.create({
        data: {
          encuentroId: encuentro.id,
          turno: turnoActual,
          esTurnoJugador: true,
          accionUltima: resultadoRonda.accionJugador?.esInsignia ? 'RESONANCIA' : 'ATACAR',
          detalleJson: detalleJsonPersistido as any,
        },
      });

      return {
        encuentroId: encuentro.id,
        estado: estadoEncuentroFinal,
        turno: resultadoRonda.resultado === 'EN_CURSO' ? turnoActual + 1 : turnoActual,
        accionJugador: resultadoRonda.accionJugador,
        accionRival: accionRivalFormateada,
        resultadoFinal,
        progreso: progresoVictoria,
        efectosFinDeTurno: resultadoRonda.efectosFinDeTurno,
        resonancia: {
          aliada: resultadoRonda.estadoBatalla.aliada.resonancia,
          rival: resultadoRonda.estadoBatalla.rival.resonancia,
        },
        estados: {
          aliada: resultadoRonda.estadoBatalla.aliada.estados,
          rival: resultadoRonda.estadoBatalla.rival.estados,
        },
        mensajes: resultadoRonda.mensajes,
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
          include: {
            movimientos: {
              orderBy: { slot: 'asc' },
            },
          },
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

    // Huida fallida: contraataque rival (slots 1-3, D-4)
    const movimientosRivalesDisponibles = encuentro.criaturaRival.especie.movimientos.filter(
      (m) => m.slot <= 3,
    );
    const poolRivales =
      movimientosRivalesDisponibles.length > 0
        ? movimientosRivalesDisponibles
        : encuentro.criaturaRival.especie.movimientos;
    const indiceRival =
      poolRivales.length > 0
        ? Math.floor(this.generador.generar() * poolRivales.length)
        : 0;
    const movimientoRival = poolRivales[indiceRival] ?? {
      nombre: 'Ataque Salvaje',
      poder: 10,
    };

    const factorRival = 0.85 + this.generador.generar() * 0.30;
    const danoRival = calcularDano(
      encuentro.criaturaRival.ataque,
      criaturaAliada.defensa,
      movimientoRival.poder,
      encuentro.criaturaRival.nivel,
      factorRival,
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
