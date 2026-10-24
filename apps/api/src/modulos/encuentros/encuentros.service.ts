import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { calcularProgresoXp, calcularXpRequerida } from '../progreso/progreso.service';
import {
  leerEstadoBatalla,
  multiplicadorAfinidad,
  etiquetaEfectividad,
  Elemento,
} from '../combate/dominio/motor-combate';

@Injectable()
export class EncuentrosService {
  constructor(private readonly prisma: PrismaService) {}

  async obtenerEncuentroActivo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: {
        criaturas: {
          where: { enEquipo: true },
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
        },
      },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este usuario.',
      });
    }

    const encuentro = await this.prisma.encuentro.findFirst({
      where: {
        personajeId: personaje.id,
        estado: 'EN_CURSO',
      },
      include: {
        criaturaRival: {
          include: { especie: true },
        },
        combates: {
          orderBy: { turno: 'asc' },
        },
      },
    });

    if (!encuentro) {
      throw new NotFoundException({
        codigo: 'ENCUENTRO_NO_ENCONTRADO',
        mensaje: 'No tienes ningún encuentro o combate activo en este momento.',
      });
    }

    const aliadaLider =
      personaje.criaturas.find((c) => c.hpActual > 0) ?? personaje.criaturas[0];
    const ultimoCombate =
      encuentro.combates.length > 0
        ? encuentro.combates[encuentro.combates.length - 1]
        : null;
    const turnoActual = ultimoCombate ? ultimoCombate.turno + 1 : 1;

    const snapshot = leerEstadoBatalla(
      ultimoCombate?.detalleJson,
      aliadaLider?.id,
    );

    const elementoAliado =
      ((aliadaLider?.especie as any)?.elemento as Elemento) ?? 'fisico';
    const elementoRival =
      ((encuentro.criaturaRival?.especie as any)?.elemento as Elemento) ?? 'fisico';
    const multAfinidad = multiplicadorAfinidad(elementoAliado, elementoRival);
    const etiqAfinidad = etiquetaEfectividad(multAfinidad);

    // simplificacion: reconstrucción cronológica inversa de la bitácora para reanudar la UI fielmente
    const bitacora: string[] = [
      aliadaLider
        ? `¡Tu aliada es ${aliadaLider.apodo || aliadaLider.especie.nombre} (Nv. ${aliadaLider.nivel})!`
        : '',
      `Turno 1: ¡Un ${encuentro.criaturaRival.especie.nombre} salvaje (Nv. ${encuentro.criaturaRival.nivel}) está frente a ti!`,
    ].filter(Boolean);

    for (const c of encuentro.combates) {
      const detalle = c.detalleJson as Record<string, unknown> | null;
      if (Array.isArray(detalle?.mensajes) && detalle.mensajes.length > 0) {
        for (const msg of detalle.mensajes) {
          bitacora.unshift(String(msg));
        }
      } else {
        if (detalle?.movimientoRival) {
          bitacora.unshift(
            `El rival respondió con ${detalle.movimientoRival} causando ${detalle.danoRival} de daño.`,
          );
        }
        if (detalle?.movimientoJugador) {
          bitacora.unshift(
            `Tu criatura usó ${detalle.movimientoJugador} causando ${detalle.danoJugador} de daño.`,
          );
        }
        if (c.accionUltima === 'CAPTURAR' || detalle?.exito !== undefined) {
          if (detalle?.exito) {
            bitacora.unshift(
              `¡Captura exitosa enviada a ${detalle?.destino === 'EQUIPO' ? 'tu equipo activo' : 'el almacén'}!`,
            );
          } else {
            bitacora.unshift(`La criatura se resistió a la captura.`);
          }
        }
      }
    }

    const xpBaseAliada = aliadaLider ? calcularXpRequerida(aliadaLider.nivel) : 0;
    const xpRealAliada = aliadaLider
      ? (aliadaLider.experiencia < xpBaseAliada
          ? xpBaseAliada + aliadaLider.experiencia
          : aliadaLider.experiencia)
      : 0;
    const progresoAliada = aliadaLider
      ? calcularProgresoXp(aliadaLider.nivel, xpRealAliada)
      : null;

    return {
      encuentroId: encuentro.id,
      estado: encuentro.estado,
      turno: turnoActual,
      esTurnoJugador: ultimoCombate?.esTurnoJugador ?? true,
      efectividadAliadaSobreRival: {
        multiplicador: multAfinidad,
        etiqueta: etiqAfinidad,
      },
      criaturaRival: {
        slug: encuentro.criaturaRival.especie.slug,
        nombre: encuentro.criaturaRival.especie.nombre,
        nivel: encuentro.criaturaRival.nivel,
        hpActual: encuentro.criaturaRival.hpActual,
        hpMaximo: encuentro.criaturaRival.hpMaximo,
        ataque: encuentro.criaturaRival.ataque,
        defensa: encuentro.criaturaRival.defensa,
        velocidad: encuentro.criaturaRival.velocidad,
        afinidad: elementoRival,
        resonancia: snapshot.rival.resonancia,
        estados: snapshot.rival.estados,
      },
      criaturaAliada: aliadaLider
        ? {
            criaturaId: aliadaLider.id,
            slug: aliadaLider.especie?.slug,
            nombre: aliadaLider.apodo || aliadaLider.especie?.nombre || 'Compañero',
            nombreEspecie: aliadaLider.especie?.nombre,
            nivel: aliadaLider.nivel,
            hpActual: aliadaLider.hpActual,
            hpMaximo: aliadaLider.hpMaximo,
            ataque: aliadaLider.ataque,
            defensa: aliadaLider.defensa,
            velocidad: aliadaLider.velocidad,
            afinidad: elementoAliado,
            resonancia: snapshot.aliada.resonancia,
            estados: snapshot.aliada.estados,
            experiencia: aliadaLider.experiencia,
            porcentajeXp: progresoAliada?.porcentajeXp ?? 0,
            xpSiguienteNivel: progresoAliada?.xpSiguienteNivel ?? 0,
            xpNivelActual: progresoAliada?.xpNivelActual ?? 0,
            movimientos: aliadaLider.especie?.movimientos?.length
              ? aliadaLider.especie.movimientos.map((m, idx) => ({
                  nombre: m.nombre,
                  poder: m.poder,
                  tipoAccion: m.tipoAccion,
                  slot: m.slot,
                  efecto: m.efecto,
                  bloqueado:
                    (m.slot === 4 || idx === 3)
                      ? snapshot.aliada.resonancia < 100
                      : false,
                }))
              : [
                  {
                    nombre: 'Golpe Firme',
                    poder: 12,
                    tipoAccion: 'ATAQUE',
                    slot: 1,
                    efecto: null,
                    bloqueado: false,
                  },
                ],
          }
        : null,
      bitacora,
    };
  }
}

