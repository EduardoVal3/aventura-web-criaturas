import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
  Optional,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import {
  ProgresoService,
  calcularPoderEquipoDesdeCriaturas,
  PoderEquipoDto,
  RequisitoCartografiaDto,
  RequisitoNivelEquipoDto,
} from '../progreso/progreso.service';
import {
  BESTIARIO,
  TABLAS_APARICION,
} from '../externo/bestiario-canonico';

export interface EspecieHabitanteDto {
  slug: string;
  nombre: string;
  tipo: string;
  elemento: string;
  esEspecial: boolean;
  esLegendaria: boolean;
  pesoAparicion: number;
}

export interface NodoMapaTerritorialDto {
  id: string;
  nombre: string;
  tipo: 'LOCALIDAD' | 'ZONA';
  esSegura: boolean;
  faunaNivelMinimo: number | null;
  faunaNivelMaximo: number | null;
  desbloqueada: boolean;
  progreso: number;
  esActual: boolean;
  esAdyacente: boolean;
  conexionesIds: string[];
}

// simplificacion: resolución de hábitats y fauna en memoria a partir del catálogo canónico y tablas de aparición fijas; suficiente para el mundo actual de 6 zonas silvestres sin sobrecargar la base de datos con consultas N+1 en cada petición de ubicación.
export function obtenerEspeciesHabitantesZona(zonaId: string): EspecieHabitanteDto[] {
  const apariciones = TABLAS_APARICION.filter((t) => t.zonaId === zonaId);
  if (apariciones.length === 0) {
    return [];
  }
  const mapaBestiario = new Map(BESTIARIO.map((b) => [b.slug, b]));
  return apariciones.map((a) => {
    const b = mapaBestiario.get(a.especieSlug);
    return {
      slug: a.especieSlug,
      nombre: b?.nombre ?? a.especieSlug,
      tipo: b?.tipo ?? 'bestia',
      elemento: b?.elemento ?? 'fisico',
      esEspecial: Boolean(b?.esEspecial),
      esLegendaria: Boolean(b?.esLegendaria),
      pesoAparicion: a.peso,
    };
  });
}

export const NODOS_CANONICOS_MUNDO: {
  id: string;
  nombre: string;
  tipo: 'LOCALIDAD' | 'ZONA';
  esSegura: boolean;
  faunaNivelMinimo: number | null;
  faunaNivelMaximo: number | null;
  conexionesIds: string[];
}[] = [
  { id: 'LOC-01', nombre: 'Villa Serena', tipo: 'LOCALIDAD', esSegura: true, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ['ZON-01', 'ZON-02'] },
  { id: 'ZON-01', nombre: 'Praderas del Amanecer', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 1, faunaNivelMaximo: 3, conexionesIds: ['LOC-01', 'LOC-02'] },
  { id: 'ZON-02', nombre: 'Riberas del Lago Espejo', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 2, faunaNivelMaximo: 4, conexionesIds: ['LOC-01', 'ZON-03'] },
  { id: 'LOC-02', nombre: 'Puesto Fronterizo del Río', tipo: 'LOCALIDAD', esSegura: true, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ['ZON-01', 'ZON-03', 'ZON-04'] },
  { id: 'ZON-03', nombre: 'Bosque Susurrante', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 3, faunaNivelMaximo: 5, conexionesIds: ['ZON-02', 'LOC-02'] },
  { id: 'ZON-04', nombre: 'Paso de los Riscos', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 5, faunaNivelMaximo: 7, conexionesIds: ['LOC-02', 'LOC-03', 'ZON-05'] },
  { id: 'LOC-03', nombre: 'Bastión del Norte', tipo: 'LOCALIDAD', esSegura: true, faunaNivelMinimo: null, faunaNivelMaximo: null, conexionesIds: ['ZON-04', 'ZON-06'] },
  { id: 'ZON-05', nombre: 'Cueva Umbría', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 7, faunaNivelMaximo: 10, conexionesIds: ['ZON-04', 'ZON-06'] },
  { id: 'ZON-06', nombre: 'Pico de la Cumbre', tipo: 'ZONA', esSegura: false, faunaNivelMinimo: 8, faunaNivelMaximo: 12, conexionesIds: ['LOC-03', 'ZON-05'] },
];

@Injectable()
export class MundoService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly progresoService?: ProgresoService,
  ) {}

  async obtenerUbicacionActual(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const zona = await this.prisma.zona.findUnique({
      where: { id: personaje.ubicacionActualId },
    });

    if (!zona) {
      throw new NotFoundException({
        codigo: 'ZONA_NO_ENCONTRADA',
        mensaje: 'La zona de ubicación actual no está registrada en el sistema.',
      });
    }

    let criaturas: { nivel: number; enEquipo: boolean }[] = [];
    if (this.prisma.criatura?.findMany) {
      try {
        criaturas = await this.prisma.criatura.findMany({
          where: { personajeId: personaje.id },
          select: { nivel: true, enEquipo: true },
        });
      } catch {
        criaturas = [];
      }
    }
    const poderEquipo: PoderEquipoDto = calcularPoderEquipoDesdeCriaturas(criaturas);

    const conexionesOrigen = await this.prisma.conexionZona.findMany({
      where: { zonaOrigenId: zona.id },
      include: { zonaDestino: true },
      orderBy: { zonaDestinoId: 'asc' },
    });

    const zonasDesbloqueadas = await this.prisma.zonaDesbloqueada.findMany({
      where: { personajeId: personaje.id },
    });

    const desbloqueadasSet = new Set(zonasDesbloqueadas.map((d) => d.zonaId));

    const conexiones = await Promise.all(
      conexionesOrigen.map(async (c) => {
        const estaDesbloqueada = desbloqueadasSet.has(c.zonaDestinoId);
        const nivelSugerido =
          c.zonaDestino.nivelMinimo && c.zonaDestino.nivelMaximo
            ? `${c.zonaDestino.nivelMinimo}-${c.zonaDestino.nivelMaximo}`
            : null;

        let requisito: string | null = null;
        let progresoActual = 0;
        let progresoObjetivo = 100;
        let cumpleRequisito = estaDesbloqueada;
        let detalleProgreso: string | null = null;
        let requisitoCartografia: RequisitoCartografiaDto | null = null;
        let requisitoNivelEquipo: RequisitoNivelEquipoDto | null = null;

        if (this.progresoService) {
          const evalReq = await this.progresoService.evaluarEstadoRequisitoZona(
            this.prisma,
            personaje.id,
            c.zonaDestinoId,
          );
          requisito = evalReq.requisito;
          progresoActual = estaDesbloqueada ? 100 : evalReq.progresoActual;
          progresoObjetivo = evalReq.progresoObjetivo;
          cumpleRequisito = estaDesbloqueada ? true : evalReq.cumple;
          detalleProgreso = estaDesbloqueada
            ? 'Sendas exploradas y cartografiadas.'
            : evalReq.detalleProgreso;
          requisitoCartografia = estaDesbloqueada ? null : evalReq.requisitoCartografia;
          requisitoNivelEquipo = estaDesbloqueada ? null : evalReq.requisitoNivelEquipo;
        } else {
          requisito = !estaDesbloqueada ? 'Requiere progreso en el gremio o equipo' : null;
          progresoActual = estaDesbloqueada ? 100 : 0;
          detalleProgreso = requisito;
        }

        return {
          ubicacionDestinoId: c.zonaDestinoId,
          nombre: c.zonaDestino.nombre,
          tipoDestino: c.zonaDestino.tipo as 'LOCALIDAD' | 'ZONA',
          esSegura: Boolean(c.zonaDestino.esSegura),
          faunaNivelMinimo: c.zonaDestino.nivelMinimo ?? null,
          faunaNivelMaximo: c.zonaDestino.nivelMaximo ?? null,
          especiesHabitantes: obtenerEspeciesHabitantesZona(c.zonaDestinoId),
          nivelSugerido,
          estaBloqueada: !estaDesbloqueada,
          requisito,
          progresoActual,
          progresoObjetivo,
          cumpleRequisito,
          detalleProgreso,
          requisitoCartografia,
          requisitoNivelEquipo,
        };
      }),
    );

    const registroZonaActual = zonasDesbloqueadas.find(
      (d) => d.zonaId === zona.id,
    );
    const progresoZona = registroZonaActual?.progreso ?? (zona.esSegura ? 100 : 0);

    const slug = zona.nombre
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const nivelSugerido =
      zona.nivelMinimo && zona.nivelMaximo
        ? `${zona.nivelMinimo}-${zona.nivelMaximo}`
        : zona.nivelMinimo
          ? `${zona.nivelMinimo}+`
          : null;

    const adyacentesSet = new Set(conexionesOrigen.map((c) => c.zonaDestinoId));
    const nodosMapa: NodoMapaTerritorialDto[] = NODOS_CANONICOS_MUNDO.map((nodo) => {
      const reg = zonasDesbloqueadas.find((z) => z.zonaId === nodo.id);
      const desbloqueada = desbloqueadasSet.has(nodo.id);
      const progreso = desbloqueada ? (reg?.progreso ?? (nodo.esSegura ? 100 : 0)) : 0;
      return {
        id: nodo.id,
        nombre: nodo.nombre,
        tipo: nodo.tipo,
        esSegura: nodo.esSegura,
        faunaNivelMinimo: nodo.faunaNivelMinimo,
        faunaNivelMaximo: nodo.faunaNivelMaximo,
        desbloqueada,
        progreso,
        esActual: nodo.id === zona.id,
        esAdyacente: adyacentesSet.has(nodo.id),
        conexionesIds: nodo.conexionesIds,
      };
    });

    return {
      ubicacionId: zona.id,
      nombre: zona.nombre,
      slug,
      tipo: zona.tipo,
      esSegura: zona.esSegura,
      descripcion: zona.descripcion,
      nivelMinimo: zona.nivelMinimo,
      nivelMaximo: zona.nivelMaximo,
      faunaNivelMinimo: zona.nivelMinimo ?? null,
      faunaNivelMaximo: zona.nivelMaximo ?? null,
      especiesHabitantes: obtenerEspeciesHabitantesZona(zona.id),
      nivelSugerido,
      servicios: zona.servicios,
      progresoZona,
      poderEquipo,
      nodosMapa,
      conexiones,
    };
  }

  async viajar(usuarioId: string, destinoId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo.',
      });
    }

    const destino = await this.prisma.zona.findUnique({
      where: { id: destinoId },
    });

    if (!destino) {
      throw new BadRequestException({
        codigo: 'CONEXION_INVALIDA',
        mensaje: 'La zona de destino especificada no existe en el mundo.',
      });
    }

    // Validación 1: Conexión topológica directa en grafo
    const conexion = await this.prisma.conexionZona.findUnique({
      where: {
        zonaOrigenId_zonaDestinoId: {
          zonaOrigenId: personaje.ubicacionActualId,
          zonaDestinoId: destinoId,
        },
      },
    });

    if (!conexion) {
      throw new BadRequestException({
        codigo: 'CONEXION_INVALIDA',
        mensaje: 'El destino no está conectado directamente con tu ubicación actual.',
      });
    }

    // Validación 2: Zona desbloqueada (Regla S-2)
    const desbloqueada = await this.prisma.zonaDesbloqueada.findUnique({
      where: {
        personajeId_zonaId: {
          personajeId: personaje.id,
          zonaId: destinoId,
        },
      },
    });

    if (!desbloqueada) {
      throw new ForbiddenException({
        codigo: 'ZONA_BLOQUEADA',
        mensaje: 'La zona de destino requiere requisitos que aún no has desbloqueado.',
      });
    }

    // Validación 3: Ausencia de encuentro o combate activo pendiente
    const encuentroActivo = await this.prisma.encuentro.findFirst({
      where: {
        personajeId: personaje.id,
        estado: 'EN_CURSO',
      },
    });

    if (encuentroActivo) {
      throw new ConflictException({
        codigo: 'ENCUENTRO_PREVIO_ACTIVO',
        mensaje: 'No puedes desplazarte mientras tienes un encuentro activo pendiente de resolución.',
      });
    }

    const origenId = personaje.ubicacionActualId;

    await this.prisma.$transaction(async (tx) => {
      await tx.personaje.update({
        where: { id: personaje.id },
        data: { ubicacionActualId: destinoId },
      });

      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'EXPLORACION',
          descripcion: `Viaje realizado desde ${origenId} hacia ${destino.nombre}.`,
          datosJson: { origen: origenId, destino: destinoId },
        },
      });
    });

    return {
      ubicacionActualId: destino.id,
      nombre: destino.nombre,
      mensaje: `Has llegado a ${destino.nombre}.`,
    };
  }
}
