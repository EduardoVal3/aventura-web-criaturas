import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { HistorialService } from '../historial/historial.service';
import { SelectorPonderado } from '../../comun/azar/selector-ponderado.util';
import { GeneradorAleatorio, GeneradorAleatorioNativo } from '../../comun/azar/generador-aleatorio.interface';

@Injectable()
export class ExploracionService {
  private readonly generador: GeneradorAleatorio;

  constructor(
    private readonly prisma: PrismaService,
    private readonly historialService: HistorialService,
    @Optional() generador?: GeneradorAleatorio,
  ) {
    this.generador = generador ?? new GeneradorAleatorioNativo();
  }

  /**
   * Ejecuta la tirada probabilística de exploración en la zona activa del explorador.
   */
  async explorar(usuarioId: string) {
    // 1. Resolver personaje autenticado
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
      include: { ubicacionActual: true },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const zona = personaje.ubicacionActual;
    if (!zona) {
      throw new NotFoundException({
        codigo: 'ZONA_NO_ENCONTRADA',
        mensaje: 'La ubicación actual del explorador no es válida.',
      });
    }

    // Validación 1: No explorar en localidades seguras
    if (zona.esSegura) {
      throw new ForbiddenException({
        codigo: 'ZONA_NO_EXPLORABLE',
        mensaje: 'No es posible explorar dentro de un asentamiento seguro o localidad.',
      });
    }

    // Validación 2: No explorar si ya existe un combate activo pendiente de resolución
    const encuentroActivo = await this.prisma.encuentro.findFirst({
      where: {
        personajeId: personaje.id,
        estado: 'EN_CURSO',
      },
    });

    if (encuentroActivo) {
      throw new ConflictException({
        codigo: 'ENCUENTRO_PREVIO_ACTIVO',
        mensaje: 'Tienes un encuentro activo pendiente de resolución en esta zona.',
      });
    }

    // 2. ETAPA 1 DEL SORTEO: Evento de la zona (tabla evento_zona)
    const eventosDisponibles = await this.prisma.eventoZona.findMany({
      where: { zonaId: zona.id },
    });

    if (!eventosDisponibles || eventosDisponibles.length === 0) {
      throw new NotFoundException({
        codigo: 'TABLA_EVENTOS_NO_CONFIGURADA',
        mensaje: `La zona ${zona.nombre} no posee eventos de exploración configurados en la base de datos.`,
      });
    }

    const selectorEvento = new SelectorPonderado(
      eventosDisponibles.map((e) => ({ elemento: e.tipo, peso: e.peso })),
      this.generador,
    );
    const tipoEventoSeleccionado = selectorEvento.seleccionar();

    // 3. RESOLUCIÓN SEGÚN EL TIPO DE EVENTO SORTEADO
    switch (tipoEventoSeleccionado) {
      case 'ENCUENTRO':
        return this.resolverEncuentro(personaje, zona);

      case 'OBJETO':
        return this.resolverObjeto(personaje, zona);

      case 'SIN_EVENTO':
      default:
        return this.resolverSinEvento(personaje, zona);
    }
  }

  /**
   * Resuelve la Etapa 2 de combate: sorteo de especie rival, nivel y persistencia de criatura y encuentro.
   */
  private async resolverEncuentro(personaje: any, zona: any) {
    // 2. ETAPA 2 DEL SORTEO: Especie salvaje según tabla aparicion_zona
    const apariciones = await this.prisma.aparicionZona.findMany({
      where: { zonaId: zona.id },
      include: { especie: true },
    });

    if (!apariciones || apariciones.length === 0) {
      throw new NotFoundException({
        codigo: 'TABLA_APARICIONES_NO_CONFIGURADA',
        mensaje: `La zona ${zona.nombre} no cuenta con criaturas salvajes en su tabla de aparición.`,
      });
    }

    const selectorAparicion = new SelectorPonderado(
      apariciones.map((a) => ({ elemento: a, peso: a.peso })),
      this.generador,
    );
    const aparicionElegida = selectorAparicion.seleccionar();
    const especie = aparicionElegida.especie;

    // Sorteo uniforme de nivel en el rango [nivelMinimo, nivelMaximo]
    const rangoNivel = aparicionElegida.nivelMaximo - aparicionElegida.nivelMinimo + 1;
    const nivelSorteado =
      Math.floor(this.generador.generar() * rangoNivel) + aparicionElegida.nivelMinimo;

    // Escalado matemático determinista de estadísticas para la criatura rival
    // simplificacion: incremento lineal del 10% de base por cada nivel por encima de 1
    const factorEscalado = 1 + (nivelSorteado - 1) * 0.1;
    const factorVelocidad = 1 + (nivelSorteado - 1) * 0.05;

    const hpMaximo = Math.round(especie.hpBase * factorEscalado);
    const ataque = Math.round(especie.ataqueBase * factorEscalado);
    const defensa = Math.round(especie.defensaBase * factorEscalado);
    const velocidad = Math.round(especie.velocidadBase * factorVelocidad);

    // Persistencia atómica de criatura rival y encuentro en estado EN_CURSO
    return this.prisma.$transaction(async (tx) => {
      const criaturaRival = await tx.criatura.create({
        data: {
          personajeId: null, // Criatura salvaje no vinculada aún al jugador
          especieId: especie.id,
          apodo: null,
          nivel: nivelSorteado,
          experiencia: 0,
          hpActual: hpMaximo,
          hpMaximo,
          ataque,
          defensa,
          velocidad,
          enEquipo: false,
          ordenEquipo: null,
        },
      });

      const encuentro = await tx.encuentro.create({
        data: {
          personajeId: personaje.id,
          zonaId: zona.id,
          criaturaRivalId: criaturaRival.id,
          estado: 'EN_CURSO',
        },
      });

      await this.historialService.registrar(
        personaje.id,
        'ENCUENTRO',
        `Avistamiento de criatura salvaje: ${especie.nombre} (Nv. ${nivelSorteado}) en ${zona.nombre}.`,
        { encuentroId: encuentro.id, especieSlug: especie.slug, nivel: nivelSorteado },
      );

      return {
        tipoEvento: 'ENCUENTRO',
        mensaje: `¡Una criatura salvaje te desafía en el camino: ${especie.nombre} (Nivel ${nivelSorteado})!`,
        encuentro: {
          encuentroId: encuentro.id,
          estado: encuentro.estado,
          especie: {
            slug: especie.slug,
            nombre: especie.nombre,
            nivel: criaturaRival.nivel,
            hpActual: criaturaRival.hpActual,
            hpMaximo: criaturaRival.hpMaximo,
            ataque: criaturaRival.ataque,
            defensa: criaturaRival.defensa,
            velocidad: criaturaRival.velocidad,
          },
        },
      };
    });
  }

  /**
   * Resuelve el hallazgo de botín (monedas o consumible) y lo acredita al personaje.
   */
  private async resolverObjeto(personaje: any, zona: any) {
    const daMonedas = this.generador.generar() < 0.5;

    if (daMonedas) {
      // 15 a 35 monedas
      const monedasGanadas = Math.floor(this.generador.generar() * 21) + 15;

      await this.prisma.$transaction(async (tx) => {
        await tx.personaje.update({
          where: { id: personaje.id },
          data: { monedas: { increment: monedasGanadas } },
        });

        await this.historialService.registrar(
          personaje.id,
          'OBJETO',
          `Has encontrado un alijo oculto con ${monedasGanadas} monedas en ${zona.nombre}.`,
          { tipoRecompensa: 'MONEDAS', cantidad: monedasGanadas },
        );
      });

      return {
        tipoEvento: 'OBJETO',
        mensaje: `Has encontrado un cofre oculto en la maleza con ${monedasGanadas} monedas.`,
        recompensa: {
          tipo: 'MONEDAS',
          cantidad: monedasGanadas,
        },
      };
    } else {
      // Consumible: poción menor o talismán básico
      const codigoItem = this.generador.generar() < 0.6 ? 'pocion-menor' : 'talisman-basico';
      const objeto = await this.prisma.objeto.findUnique({
        where: { codigo: codigoItem },
      });

      if (!objeto) {
        throw new NotFoundException(`Objeto de recompensa ${codigoItem} no encontrado.`);
      }

      await this.prisma.$transaction(async (tx) => {
        await tx.inventarioPersonaje.upsert({
          where: {
            personajeId_objetoId: {
              personajeId: personaje.id,
              objetoId: objeto.id,
            },
          },
          update: { cantidad: { increment: 1 } },
          create: {
            personajeId: personaje.id,
            objetoId: objeto.id,
            cantidad: 1,
          },
        });

        await this.historialService.registrar(
          personaje.id,
          'OBJETO',
          `Has recogido un consumible: ${objeto.nombre} en ${zona.nombre}.`,
          { tipoRecompensa: 'ITEM', itemCodigo: objeto.codigo },
        );
      });

      return {
        tipoEvento: 'OBJETO',
        mensaje: `Has descubierto un objeto abandonado: ${objeto.nombre}.`,
        recompensa: {
          tipo: 'ITEM',
          cantidad: 1,
          itemCodigo: objeto.codigo,
        },
      };
    }
  }

  /**
   * Resuelve el caso de exploración tranquila sin novedades.
   */
  private async resolverSinEvento(personaje: any, zona: any) {
    await this.historialService.registrar(
      personaje.id,
      'EXPLORACION',
      `Recorrido pacífico por ${zona.nombre} sin contratiempos.`,
    );

    return {
      tipoEvento: 'SIN_EVENTO',
      mensaje: 'Recorres la senda con tranquilidad; el viento sopla apacible.',
      recompensa: null,
    };
  }
}
