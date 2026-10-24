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
import {
  calcularDano,
  aplicarDano,
  leerEstadoBatalla,
  resolverRonda,
  construirCombatiente,
  tieneEstadoAlterado,
  bloquearYVerificarTurno,
} from '../combate.service';
import { calcularXpRequerida } from '../../progreso/progreso.service';

export const MULTIPLICADORES_TALISMAN: Record<string, number> = {
  'talisman-basico': 1.0,
  'talisman-resonante': 1.5,
  'talisman-avanzado': 1.5,
};

/**
 * Calcula la probabilidad final de captura según las reglas de equilibrio (§2.2).
 * factorSalud = 1.0 - 0.5 * (hpActual / hpMaximo)
 * probBruta = tasaCaptura * factorSalud * multiplicadorTalisman * multiplicadorEstado
 * probFinal = clamp(0.05, 0.95, probBruta) -> Cumple INV-02
 */
export function calcularProbabilidadCaptura(
  tasaCaptura: number,
  hpActual: number,
  hpMaximo: number,
  multiplicadorTalisman: number = 1.0,
  multiplicadorEstado: number = 1.0,
): number {
  const hpSeguro = Math.max(1, hpActual);
  const maxSeguro = Math.max(1, hpMaximo);
  const factorSalud = 1.0 - 0.5 * (hpSeguro / maxSeguro);
  const probBruta =
    tasaCaptura * factorSalud * multiplicadorTalisman * multiplicadorEstado;
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
   * Resuelve el intento de captura dentro de una transacción atómica estricta (prisma.$transaction).
   */
  async capturar(
    usuarioId: string,
    encuentroId: string,
    itemCodigo: string,
    turnoEsperado?: number,
  ) {
    // 1. Validar personaje autenticado
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });
    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró el personaje activo del jugador.',
      });
    }

    // 2. Validar encuentro y pertenencia (S-3)
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

    const ultimoCombatePre = (encuentro as any).combates?.[0] ?? null;
    const estadoBatallaPrevio = leerEstadoBatalla(
      ultimoCombatePre?.detalleJson,
    );
    const rivalConEstado = tieneEstadoAlterado(
      estadoBatallaPrevio.rival.estados,
    );
    const multiplicadorEstado = rivalConEstado ? 1.25 : 1.0;

    const multiplicador = MULTIPLICADORES_TALISMAN[itemCodigo] ?? 1.0;
    const probabilidadFinal = calcularProbabilidadCaptura(
      encuentro.criaturaRival.especie.tasaCaptura,
      encuentro.criaturaRival.hpActual,
      encuentro.criaturaRival.hpMaximo,
      multiplicador,
      multiplicadorEstado,
    );

    const capturaExitosa = this.generador.generar() < probabilidadFinal;

    // Ejecución atómica de la resolución completa
    return this.prisma.$transaction(async (tx) => {
      // Descontar talismán en inventario
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
          mensaje: 'No posees este talismán en tu inventario.',
        });
      }

      if (itemInventario.cantidad === 1) {
        await tx.inventarioPersonaje.delete({
          where: { id: itemInventario.id },
        });
      } else {
        await tx.inventarioPersonaje.update({
          where: { id: itemInventario.id },
          data: { cantidad: { decrement: 1 } },
        });
      }

      const ultimoCombate = tx.combate?.findFirst
        ? await tx.combate.findFirst({
            where: { encuentroId: encuentro.id },
            orderBy: { turno: 'desc' },
          })
        : ultimoCombatePre;
      const turnoActual = (ultimoCombate?.turno ?? 0) + 1;

      await bloquearYVerificarTurno(
        tx,
        personaje.id,
        encuentro.id,
        turnoEsperado,
      );

      if (capturaExitosa) {
        // Actualizar encuentro a CAPTURADO
        await tx.encuentro.update({
          where: { id: encuentro.id },
          data: {
            estado: ESTADOS_ENCUENTRO.CAPTURADO,
            fechaResolucion: new Date(),
          },
        });

        // Evaluar cupo de equipo (A-6: máximo 6 en equipo)
        const criaturasEquipo = await tx.criatura.count({
          where: { personajeId: personaje.id, enEquipo: true },
        });
        const vaAlEquipo = criaturasEquipo < 6;

        const criaturaCapturada = await tx.criatura.update({
          where: { id: encuentro.criaturaRivalId },
          data: {
            personajeId: personaje.id,
            enEquipo: vaAlEquipo,
            ordenEquipo: vaAlEquipo ? criaturasEquipo + 1 : null,
            fechaCaptura: new Date(),
            experiencia: Math.max(
              encuentro.criaturaRival.experiencia,
              calcularXpRequerida(encuentro.criaturaRival.nivel),
            ),
          },
          include: {
            especie: true,
          },
        });

        await tx.combate.create({
          data: {
            encuentroId: encuentro.id,
            turno: turnoActual,
            esTurnoJugador: true,
            accionUltima: 'CAPTURAR',
            detalleJson: {
              exito: true,
              itemCodigo,
              destino: vaAlEquipo ? 'EQUIPO' : 'ALMACEN',
              multiplicadorEstado,
            } as any,
          },
        });

        // Actualizar progreso de zona por captura exitosa (+20% hasta 100%)
        if (encuentro.zonaId) {
          const regZona = await tx.zonaDesbloqueada.findUnique({
            where: {
              personajeId_zonaId: {
                personajeId: personaje.id,
                zonaId: encuentro.zonaId,
              },
            },
          });
          const progresoActualizado = Math.min(
            100,
            (regZona?.progreso ?? 0) + 20,
          );
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

        await tx.historial.create({
          data: {
            personajeId: personaje.id,
            tipo: 'CAPTURA',
            descripcion: `Captura exitosa de ${encuentro.criaturaRival.especie.nombre} con ${objeto.nombre}.`,
            datosJson: {
              criaturaId: criaturaCapturada.id,
              destino: vaAlEquipo ? 'EQUIPO' : 'ALMACEN',
            },
          },
        });

        return {
          exito: true,
          mensaje: `¡Captura exitosa! ${encuentro.criaturaRival.especie.nombre} ha sido incorporado a tu ${vaAlEquipo ? 'equipo' : 'almacén'}.`,
          encuentroId: encuentro.id,
          estado: ESTADOS_ENCUENTRO.CAPTURADO,
          destinoCaptura: vaAlEquipo ? 'EQUIPO' : 'ALMACEN',
          criaturaCapturada: {
            criaturaId: criaturaCapturada.id,
            nombre: criaturaCapturada.apodo || criaturaCapturada.especie.nombre,
            nivel: criaturaCapturada.nivel,
            hpActual: criaturaCapturada.hpActual,
            hpMaximo: criaturaCapturada.hpMaximo,
          },
        };
      }

      // Fallo de captura: contraataque rival autoritativo
      const criaturaAliada = await tx.criatura.findFirst({
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

      let contraataqueRival: any = null;
      let efectosFinDeTurno: any[] = [];
      let mensajes: string[] = [];
      let resonanciaFinal = {
        aliada: 0,
        rival: 0,
      };
      let estadosFinales = {
        aliada: [] as any[],
        rival: [] as any[],
      };
      let estadoFinal: string = ESTADOS_ENCUENTRO.ACTIVO;

      if (criaturaAliada) {
        const snapshot = leerEstadoBatalla(
          ultimoCombate?.detalleJson,
          criaturaAliada.id,
        );
        const aliadaCombatiente = construirCombatiente(criaturaAliada, 'Aliada');
        const rivalCombatiente = construirCombatiente(
          encuentro.criaturaRival,
          'Rival',
        );

        const resultado = resolverRonda(
          aliadaCombatiente,
          rivalCombatiente,
          snapshot,
          null,
          this.generador,
        );

        await tx.criatura.update({
          where: { id: criaturaAliada.id },
          data: { hpActual: resultado.hpRestanteAliada },
        });

        if (resultado.hpRestanteRival !== encuentro.criaturaRival.hpActual) {
          await tx.criatura.update({
            where: { id: encuentro.criaturaRival.id },
            data: { hpActual: resultado.hpRestanteRival },
          });
        }

        if (resultado.hpRestanteAliada <= 0) {
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

        const accionRival = resultado.accionRival;
        contraataqueRival = accionRival
          ? {
              movimiento: accionRival.movimiento,
              danoCausado: accionRival.danoCausado,
              hpRestanteAliado: resultado.hpRestanteAliada,
              danoAbsorbido: accionRival.danoAbsorbido,
              estadoAplicado: accionRival.estadoAplicado,
              perdioTurno: accionRival.perdioTurno,
            }
          : null;

        efectosFinDeTurno = resultado.efectosFinDeTurno;
        mensajes = resultado.mensajes;
        resonanciaFinal = {
          aliada: resultado.estadoBatalla.aliada.resonancia,
          rival: resultado.estadoBatalla.rival.resonancia,
        };
        estadosFinales = {
          aliada: resultado.estadoBatalla.aliada.estados,
          rival: resultado.estadoBatalla.rival.estados,
        };

        await tx.combate.create({
          data: {
            encuentroId: encuentro.id,
            turno: turnoActual,
            esTurnoJugador: true,
            accionUltima: 'CAPTURAR_FALLIDO',
            detalleJson: {
              exito: false,
              itemCodigo,
              multiplicadorEstado,
              contraataqueRival,
              efectosFinDeTurno,
              mensajes,
              estadoBatalla: resultado.estadoBatalla,
            } as any,
          },
        });
      } else {
        await tx.combate.create({
          data: {
            encuentroId: encuentro.id,
            turno: turnoActual,
            esTurnoJugador: true,
            accionUltima: 'CAPTURAR_FALLIDO',
            detalleJson: {
              exito: false,
              itemCodigo,
              multiplicadorEstado,
              contraataqueRival: null,
            } as any,
          },
        });
      }

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'COMBATE',
          descripcion: `Intento de captura fallido con ${objeto.nombre}.`,
          datosJson: { encuentroId: encuentro.id },
        },
      });

      return {
        exito: false,
        mensaje: '¡El talismán no logró contener a la criatura! Se ha roto.',
        encuentroId: encuentro.id,
        estado: estadoFinal,
        contraataqueRival,
        efectosFinDeTurno,
        resonancia: resonanciaFinal,
        estados: estadosFinales,
        mensajes,
      };
    });
  }
}
