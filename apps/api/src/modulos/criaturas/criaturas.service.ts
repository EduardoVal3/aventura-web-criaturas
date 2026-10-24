import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { AdaptadorCriaturasExternas } from '../externo/adaptador-criaturas-externas.service';
import {
  BESTIARIO,
  EspecieCanonica,
  TABLAS_APARICION,
} from '../externo/bestiario-canonico';
import {
  CATALOGO_ESPECIES_PROPENSO,
  calcularTasaCaptura,
} from '../externo/normalizador-criaturas.util';

export type ArquetipoEspecie = 'TANQUE' | 'ATACANTE' | 'VELOZ' | 'EQUILIBRADO';

export interface MovimientoEnriquecidoDto {
  nombre: string;
  nombreOriginal: string;
  tipoAccion: string;
  poder: number;
  slot: number;
  efecto?: string | null;
}

export interface EspecieEnriquecidaDto {
  slug: string;
  keyExterna: string;
  nombre: string;
  tipo: string;
  elemento: string;
  challengeRating: number;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  tasaCaptura: number;
  esEspecial: boolean;
  esLegendaria: boolean;
  descripcion: string;
  arquetipo: ArquetipoEspecie;
  movimientos: MovimientoEnriquecidoDto[];
  zona: { id: string; nombre: string } | null;
}

/**
 * Determina el arquetipo táctico de una especie según sus estadísticas base.
 * - TANQUE: defensaBase >= 75 o hpBase >= 65, siendo el atributo dominante.
 * - ATACANTE: ataqueBase >= 70 y supera o iguala a defensa y velocidad.
 * - VELOZ: velocidadBase >= 70 y supera a ataqueBase.
 * - EQUILIBRADO: en cualquier otro caso.
 */
export function determinarArquetipoEspecie(stats: {
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
}): ArquetipoEspecie {
  const { hpBase, ataqueBase, defensaBase, velocidadBase } = stats;
  const maximo = Math.max(hpBase, ataqueBase, defensaBase, velocidadBase);

  if ((defensaBase >= 75 || hpBase >= 65) && (defensaBase === maximo || hpBase === maximo)) {
    return 'TANQUE';
  }

  if (ataqueBase >= 70 && ataqueBase >= defensaBase && ataqueBase >= velocidadBase) {
    return 'ATACANTE';
  }

  if (velocidadBase >= 70 && velocidadBase > ataqueBase) {
    return 'VELOZ';
  }

  return 'EQUILIBRADO';
}

@Injectable()
export class CriaturasService {
  private catalogoFallbackEnCache: EspecieEnriquecidaDto[] | null = null;

  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly adaptadorExterno?: AdaptadorCriaturasExternas,
  ) {}

  /**
   * simplificacion: genera el catálogo normalizado de contingencia desde BESTIARIO y snapshot local
   * si la base de datos aún no ha sido sembrada o en pruebas unitarias aisladas.
   */
  public cargarCatalogoFallback(): EspecieEnriquecidaDto[] {
    if (this.catalogoFallbackEnCache) {
      return this.catalogoFallbackEnCache;
    }

    const adaptador = this.adaptadorExterno ?? new AdaptadorCriaturasExternas();
    let mapaCrudos: Map<string, { challenge_rating?: number; type?: any }> = new Map();
    try {
      const crudos = adaptador.cargarSnapshotLocal();
      mapaCrudos = new Map(crudos.map((c) => [c.key, c]));
    } catch {
      // Si no existe snapshot en la ruta de ejecución, se usan valores por defecto canónicos
    }

    const resultado: EspecieEnriquecidaDto[] = BESTIARIO.map((esp) => {
      const crudo = mapaCrudos.get(esp.idExterno);
      const challengeRating =
        crudo?.challenge_rating ??
        (esp.esLegendaria ? 11 : esp.esEspecial ? 5 : 1);
      const tipo =
        (typeof crudo?.type === 'object' ? crudo.type.key : crudo?.type) || esp.tipo;
      const tasaCaptura = calcularTasaCaptura(challengeRating);
      const aparicion = TABLAS_APARICION.find((a) => a.especieSlug === esp.slug);
      const zona = aparicion ? { id: aparicion.zonaId, nombre: aparicion.zonaId } : null;

      return {
        slug: esp.slug,
        keyExterna: esp.idExterno,
        nombre: esp.nombre,
        tipo,
        elemento: esp.elemento,
        challengeRating,
        hpBase: esp.statsBase.hpBase,
        ataqueBase: esp.statsBase.ataqueBase,
        defensaBase: esp.statsBase.defensaBase,
        velocidadBase: esp.statsBase.velocidadBase,
        tasaCaptura,
        esEspecial: esp.esEspecial,
        esLegendaria: esp.esLegendaria,
        descripcion: esp.descripcion,
        arquetipo: determinarArquetipoEspecie(esp.statsBase),
        movimientos: esp.movimientos.map((m) => ({
          nombre: m.nombre,
          nombreOriginal: m.nombreOriginal,
          tipoAccion: m.tipoAccion,
          poder: m.poder,
          slot: m.slot,
          efecto: m.efecto,
        })),
        zona,
      };
    });

    resultado.sort((a, b) => {
      if (a.challengeRating !== b.challengeRating) {
        return a.challengeRating - b.challengeRating;
      }
      return a.nombre.localeCompare(b.nombre, 'es');
    });

    this.catalogoFallbackEnCache = resultado;
    return resultado;
  }

  /**
   * Consulta las 30 especies del compendio con sus movimientos embebidos en una sola llamada O(1),
   * erradicando el problema de ráfagas N+1 en el cliente.
   */
  async obtenerEspecies(tipo?: string): Promise<{ total: number; especies: EspecieEnriquecidaDto[] }> {
    let especiesDb = await this.prisma.especie.findMany({
      where: tipo ? { tipo: { equals: tipo, mode: 'insensitive' } } : undefined,
      include: {
        movimientos: {
          orderBy: { slot: 'asc' },
        },
        apariciones: {
          include: { zona: true },
          orderBy: { zonaId: 'asc' },
          take: 1,
        },
      },
      orderBy: [{ challengeRating: 'asc' }, { nombre: 'asc' }],
    });

    if (especiesDb.length === 0) {
      const totalEnDb = await this.prisma.especie.count();
      if (totalEnDb === 0) {
        const catalogo = this.cargarCatalogoFallback();
        const filtradas = tipo
          ? catalogo.filter((e) => e.tipo.toLowerCase() === tipo.toLowerCase())
          : catalogo;
        return {
          total: filtradas.length,
          especies: filtradas,
        };
      }
    }

    const especies: EspecieEnriquecidaDto[] = especiesDb.map((esp) => {
      const aparicion = (esp as any).apariciones?.[0];
      const zona = aparicion?.zona
        ? { id: aparicion.zona.id, nombre: aparicion.zona.nombre }
        : null;

      return {
        slug: esp.slug,
        keyExterna: esp.idExterno,
        nombre: esp.nombre,
        tipo: esp.tipo,
        elemento: esp.elemento,
        challengeRating: esp.challengeRating,
        hpBase: esp.hpBase,
        ataqueBase: esp.ataqueBase,
        defensaBase: esp.defensaBase,
        velocidadBase: esp.velocidadBase,
        tasaCaptura: esp.tasaCaptura,
        esEspecial: esp.esEspecial,
        esLegendaria: esp.esLegendaria,
        descripcion:
          esp.descripcion || CATALOGO_ESPECIES_PROPENSO[esp.idExterno]?.descripcion || '',
        arquetipo: determinarArquetipoEspecie(esp),
        movimientos: esp.movimientos.map((m) => ({
          nombre: m.nombre,
          nombreOriginal: m.nombreOriginal,
          tipoAccion: m.tipoAccion,
          poder: m.poder,
          slot: m.slot,
          efecto: m.efecto,
        })),
        zona,
      };
    });

    return {
      total: especies.length,
      especies,
    };
  }

  /**
   * Obtiene la ficha técnica detallada de una especie por su slug.
   */
  async obtenerEspeciePorSlug(slug: string): Promise<EspecieEnriquecidaDto> {
    const esp = await this.prisma.especie.findUnique({
      where: { slug },
      include: {
        movimientos: {
          orderBy: { slot: 'asc' },
        },
        apariciones: {
          include: { zona: true },
          orderBy: { zonaId: 'asc' },
          take: 1,
        },
      },
    });

    if (!esp) {
      const totalEnDb = await this.prisma.especie.count();
      if (totalEnDb === 0) {
        const catalogo = this.cargarCatalogoFallback();
        const encontrada = catalogo.find((e) => e.slug === slug);
        if (encontrada) {
          return encontrada;
        }
      }

      throw new NotFoundException({
        codigo: 'ESPECIE_NO_ENCONTRADA',
        mensaje: 'No se encontró la especie solicitada en el compendio.',
      });
    }

    const aparicion = (esp as any).apariciones?.[0];
    const zona = aparicion?.zona
      ? { id: aparicion.zona.id, nombre: aparicion.zona.nombre }
      : null;

    return {
      slug: esp.slug,
      keyExterna: esp.idExterno,
      nombre: esp.nombre,
      tipo: esp.tipo,
      elemento: esp.elemento,
      challengeRating: esp.challengeRating,
      hpBase: esp.hpBase,
      ataqueBase: esp.ataqueBase,
      defensaBase: esp.defensaBase,
      velocidadBase: esp.velocidadBase,
      tasaCaptura: esp.tasaCaptura,
      esEspecial: esp.esEspecial,
      esLegendaria: esp.esLegendaria,
      descripcion:
        esp.descripcion || CATALOGO_ESPECIES_PROPENSO[esp.idExterno]?.descripcion || '',
      arquetipo: determinarArquetipoEspecie(esp),
      movimientos: esp.movimientos.map((m) => ({
        nombre: m.nombre,
        nombreOriginal: m.nombreOriginal,
        tipoAccion: m.tipoAccion,
        poder: m.poder,
        slot: m.slot,
        efecto: m.efecto,
      })),
      zona,
    };
  }
}
