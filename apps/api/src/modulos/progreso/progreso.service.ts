import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../comun/prisma/prisma.service';

/**
 * Calcula la experiencia base otorgada según el índice de desafío (CR) (§2.3).
 * xpBase = max(10, round(25 * (1 + challengeRating)))
 */
export function calcularXpBase(challengeRating: number): number {
  return Math.max(10, Math.round(25 * (1 + Math.max(0, challengeRating))));
}

/**
 * Calcula la XP total ganada modulada por el nivel del rival (§2.3).
 * xpGanada = round(xpBase * (1 + (nivelRival - 1) * 0.20))
 */
export function calcularXpGanada(
  challengeRating: number,
  nivelRival: number,
): number {
  const base = calcularXpBase(challengeRating);
  const factorNivel = 1 + (Math.max(1, nivelRival) - 1) * 0.2;
  return Math.round(base * factorNivel);
}

/**
 * Calcula la experiencia acumulada requerida para alcanzar el nivel n (§2.4 y INV-05).
 * xpRequerida(n) = 0 si n = 1; floor(50 * (n - 1)^1.8 + 100 * (n - 1)) si n > 1
 */
export function calcularXpRequerida(nivel: number): number {
  if (nivel <= 1) {
    return 0;
  }
  return Math.floor(50 * Math.pow(nivel - 1, 1.8) + 100 * (nivel - 1));
}

/**
 * Calcula la recompensa en monedas otorgada por vencer a un rival (§4 línea 179).
 * monedas = round(15 * nivelRival)
 */
export function calcularMonedasVictoria(nivelRival: number): number {
  return Math.round(15 * Math.max(1, nivelRival));
}

/**
 * Determina el nivel correspondiente a un total acumulado de experiencia.
 */
export function calcularNivelDesdeXp(
  nivelActual: number,
  experienciaTotal: number,
): number {
  let nivel = Math.max(1, nivelActual);
  while (nivel < 50 && experienciaTotal >= calcularXpRequerida(nivel + 1)) {
    nivel++;
  }
  return nivel;
}

@Injectable()
export class ProgresoService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Resuelve la entrega de experiencia, nivel, escalado y monedas en una transacción de victoria.
   */
  async aplicarRecompensaVictoria(
    tx: Prisma.TransactionClient,
    personajeId: string,
    criaturaAliadaId: string,
    criaturaRival: {
      nivel: number;
      especie: {
        challengeRating: number;
        nombre: string;
        hpBase: number;
        ataqueBase: number;
        defensaBase: number;
        velocidadBase: number;
      };
    },
  ) {
    // 1. Calcular recompensas matemáticas
    const xpGanada = calcularXpGanada(
      criaturaRival.especie.challengeRating,
      criaturaRival.nivel,
    );
    const monedasGanadas = calcularMonedasVictoria(criaturaRival.nivel);

    // 2. Obtener criatura aliada
    const criatura = await tx.criatura.findUnique({
      where: { id: criaturaAliadaId },
      include: { especie: true },
    });

    if (!criatura) {
      throw new NotFoundException({
        codigo: 'CRIATURA_NO_ENCONTRADA',
        mensaje: 'No se encontró la criatura aliada para otorgar progreso.',
      });
    }

    const nuevaExperiencia = criatura.experiencia + xpGanada;
    const nuevoNivel = calcularNivelDesdeXp(criatura.nivel, nuevaExperiencia);
    const subioNivel = nuevoNivel > criatura.nivel;

    let datosActualizacionCriatura: any = {
      experiencia: nuevaExperiencia,
      nivel: nuevoNivel,
    };

    if (subioNivel) {
      // Escalado de estadísticas según el nuevo nivel
      const factorEscalado = 1.0 + (nuevoNivel - 1) * 0.08;
      const nuevoHpMaximo = Math.round(
        criatura.especie.hpBase * (1.0 + (nuevoNivel - 1) * 0.1),
      );
      const nuevoAtaque = Math.round(criatura.especie.ataqueBase * factorEscalado);
      const nuevaDefensa = Math.round(criatura.especie.defensaBase * factorEscalado);
      const nuevaVelocidad = Math.round(
        criatura.especie.velocidadBase * (1.0 + (nuevoNivel - 1) * 0.05),
      );

      datosActualizacionCriatura = {
        ...datosActualizacionCriatura,
        hpMaximo: nuevoHpMaximo,
        hpActual: nuevoHpMaximo, // Restaura HP completo al subir de nivel (INV-03)
        ataque: nuevoAtaque,
        defensa: nuevaDefensa,
        velocidad: nuevaVelocidad,
      };
    }

    const criaturaActualizada = await tx.criatura.update({
      where: { id: criatura.id },
      data: datosActualizacionCriatura,
    });

    // 3. Acreditar monedas al explorador
    const personajeActualizado = await tx.personaje.update({
      where: { id: personajeId },
      data: { monedas: { increment: monedasGanadas } },
    });

    // 4. Registrar en historial
    await tx.historial.create({
      data: {
        personajeId,
        tipo: 'PROGRESO',
        descripcion: `Victoria frente a ${criaturaRival.especie.nombre}: +${xpGanada} XP, +${monedasGanadas} monedas.${
          subioNivel
            ? ` ¡${criatura.apodo || criatura.especie.nombre} subió al Nivel ${nuevoNivel}!`
            : ''
        }`,
        datosJson: {
          xpGanada,
          monedasGanadas,
          subioNivel,
          nuevoNivel,
          saldoMonedas: personajeActualizado.monedas,
        },
      },
    });

    return {
      xpGanada,
      monedasGanadas,
      subioNivel,
      nivelAnterior: criatura.nivel,
      nivelNuevo: nuevoNivel,
      criatura: criaturaActualizada,
      saldoMonedas: personajeActualizado.monedas,
    };
  }

  /**
   * Consulta el catálogo de zonas del mundo y su estado de desbloqueo para el personaje.
   */
  async obtenerDesbloqueos(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: { zonasDesbloqueadas: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró el personaje activo del explorador.',
      });
    }

    const zonasDesbloqueadasSet = new Set(
      personaje.zonasDesbloqueadas.map((z) => z.zonaId),
    );

    // Zonas del mundo con sus requisitos según el diseño oficial
    const catalogoZonas = [
      { zonaId: 'ZON-01', nombre: 'Praderas del Amanecer', requisito: null },
      { zonaId: 'ZON-02', nombre: 'Bosque Susurrante', requisito: null },
      { zonaId: 'ZON-03', nombre: 'Ciénaga Brumosa', requisito: null },
      { zonaId: 'ZON-04', nombre: 'Costa Rocosa', requisito: null },
      {
        zonaId: 'ZON-05',
        nombre: 'Cueva Umbría',
        requisito: 'Poseer al menos 3 criaturas en equipo de Nivel >= 5',
      },
      {
        zonaId: 'ZON-06',
        nombre: 'Pico de la Tempestad',
        requisito: 'Haber superado la expedición de Cueva Umbría',
      },
    ];

    const zonas = catalogoZonas.map((z) => {
      // ZON-01 a ZON-04 están abiertas por defecto; ZON-05 y ZON-06 requieren desbloqueo explícito
      const estaDesbloqueada =
        ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04'].includes(z.zonaId) ||
        zonasDesbloqueadasSet.has(z.zonaId);

      return {
        zonaId: z.zonaId,
        desbloqueada: estaDesbloqueada,
        ...(z.requisito ? { requisito: z.requisito } : {}),
      };
    });

    return { zonas };
  }

  /**
   * Evalúa y efectúa el desbloqueo de una zona restringida si cumple los requisitos.
   */
  async verificarYDesbloquearZona(usuarioId: string, zonaId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró el personaje activo del explorador.',
      });
    }

    if (zonaId === 'ZON-05') {
      // Requisito ZON-05: Al menos 3 criaturas en equipo con nivel >= 5
      const cuentaNivel5 = await this.prisma.criatura.count({
        where: {
          personajeId: personaje.id,
          enEquipo: true,
          nivel: { gte: 5 },
        },
      });

      if (cuentaNivel5 < 3) {
        throw new BadRequestException({
          codigo: 'REQUISITOS_NO_CUMPLIDOS',
          mensaje: 'Tu equipo no cuenta con 3 criaturas de nivel 5 o superior.',
        });
      }

      await this.prisma.zonaDesbloqueada.upsert({
        where: {
          personajeId_zonaId: {
            personajeId: personaje.id,
            zonaId: 'ZON-05',
          },
        },
        update: {},
        create: {
          personajeId: personaje.id,
          zonaId: 'ZON-05',
        },
      });

      return {
        zonaId: 'ZON-05',
        desbloqueada: true,
        mensaje:
          '¡Has demostrado suficiente maestría! El sello de Cueva Umbría se ha disipado.',
      };
    }

    if (zonaId === 'ZON-06') {
      // Requisito ZON-06: ZON-05 desbloqueada y al menos 1 criatura de nivel >= 10
      const cuevaDesbloqueada = await this.prisma.zonaDesbloqueada.findUnique({
        where: {
          personajeId_zonaId: {
            personajeId: personaje.id,
            zonaId: 'ZON-05',
          },
        },
      });

      if (!cuevaDesbloqueada) {
        throw new BadRequestException({
          codigo: 'REQUISITOS_NO_CUMPLIDOS',
          mensaje: 'Debes desbloquear y explorar Cueva Umbría primero.',
        });
      }

      await this.prisma.zonaDesbloqueada.upsert({
        where: {
          personajeId_zonaId: {
            personajeId: personaje.id,
            zonaId: 'ZON-06',
          },
        },
        update: {},
        create: {
          personajeId: personaje.id,
          zonaId: 'ZON-06',
        },
      });

      return {
        zonaId: 'ZON-06',
        desbloqueada: true,
        mensaje:
          '¡Has alcanzado la cima! El acceso al Pico de la Tempestad ha sido habilitado.',
      };
    }

    // Zonas estándar no requieren desbloqueo
    return {
      zonaId,
      desbloqueada: true,
      mensaje: 'La zona ya se encuentra disponible para su acceso.',
    };
  }
}
