import { Injectable, NotFoundException, Optional } from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { AdaptadorCriaturasExternas } from '../externo/adaptador-criaturas-externas.service';
import {
  CATALOGO_ESPECIES_PROPENSO,
  TRADUCCION_MOVIMIENTOS,
  calcularHpBase,
  calcularAtaqueBase,
  calcularDefensaBase,
  calcularVelocidadBase,
  calcularTasaCaptura,
} from '../externo/normalizador-criaturas.util';

export type ArquetipoEspecie = 'TANQUE' | 'ATACANTE' | 'VELOZ' | 'EQUILIBRADO';

export interface MovimientoEnriquecidoDto {
  nombre: string;
  nombreOriginal: string;
  tipoAccion: string;
  poder: number;
}

export interface EspecieEnriquecidaDto {
  slug: string;
  keyExterna: string;
  nombre: string;
  tipo: string;
  challengeRating: number;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  tasaCaptura: number;
  esEspecial: boolean;
  descripcion: string;
  arquetipo: ArquetipoEspecie;
  movimientos: MovimientoEnriquecidoDto[];
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
   * simplificacion: genera el catálogo normalizado de contingencia desde el snapshot local
   * si la base de datos aún no ha sido sembrada o en pruebas unitarias aisladas.
   */
  public cargarCatalogoFallback(): EspecieEnriquecidaDto[] {
    if (this.catalogoFallbackEnCache) {
      return this.catalogoFallbackEnCache;
    }

    const adaptador = this.adaptadorExterno ?? new AdaptadorCriaturasExternas();
    const crudos = adaptador.cargarSnapshotLocal();

    const resultado: EspecieEnriquecidaDto[] = crudos.map((c) => {
      const meta = CATALOGO_ESPECIES_PROPENSO[c.key];
      const dto = adaptador.mapearACriaturaExternaDto(c);
      const mejorAtaque = dto.ataques.reduce((max, a) => Math.max(max, a.poder), 3.5);

      const hpBase = calcularHpBase(dto.hitPoints);
      const ataqueBase = calcularAtaqueBase(mejorAtaque);
      const defensaBase = calcularDefensaBase(dto.armorClass);
      const velocidadBase = calcularVelocidadBase(dto.speedMax);
      const tasaCaptura = calcularTasaCaptura(dto.challengeRating);

      const movimientos: MovimientoEnriquecidoDto[] = dto.ataques.map((a) => {
        const traduccion = TRADUCCION_MOVIMIENTOS[meta?.slug ?? '']?.[a.nombreOriginal];
        return {
          nombre: traduccion?.nombre ?? a.nombreOriginal,
          nombreOriginal: a.nombreOriginal,
          tipoAccion: a.tipoAccion,
          poder: a.poder,
        };
      });

      return {
        slug: meta ? meta.slug : c.key,
        keyExterna: c.key,
        nombre: meta ? meta.nombre : c.name,
        tipo: dto.tipoExterno,
        challengeRating: dto.challengeRating,
        hpBase,
        ataqueBase,
        defensaBase,
        velocidadBase,
        tasaCaptura,
        esEspecial: meta?.esEspecial ?? false,
        descripcion: meta?.descripcion ?? '',
        arquetipo: determinarArquetipoEspecie({ hpBase, ataqueBase, defensaBase, velocidadBase }),
        movimientos,
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
   * Consulta las especies del compendio con sus movimientos embebidos en una sola llamada O(1),
   * erradicando el problema de ráfagas N+1 en el cliente.
   */
  async obtenerEspecies(tipo?: string): Promise<{ total: number; especies: EspecieEnriquecidaDto[] }> {
    let especiesDb = await this.prisma.especie.findMany({
      where: tipo ? { tipo: { equals: tipo, mode: 'insensitive' } } : undefined,
      include: { movimientos: true },
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

    const especies: EspecieEnriquecidaDto[] = especiesDb.map((esp) => ({
      slug: esp.slug,
      keyExterna: esp.idExterno,
      nombre: esp.nombre,
      tipo: esp.tipo,
      challengeRating: esp.challengeRating,
      hpBase: esp.hpBase,
      ataqueBase: esp.ataqueBase,
      defensaBase: esp.defensaBase,
      velocidadBase: esp.velocidadBase,
      tasaCaptura: esp.tasaCaptura,
      esEspecial: esp.esEspecial,
      descripcion:
        esp.descripcion || CATALOGO_ESPECIES_PROPENSO[esp.idExterno]?.descripcion || '',
      arquetipo: determinarArquetipoEspecie(esp),
      movimientos: esp.movimientos.map((m) => ({
        nombre: m.nombre,
        nombreOriginal: m.nombreOriginal,
        tipoAccion: m.tipoAccion,
        poder: m.poder,
      })),
    }));

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
      include: { movimientos: true },
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

    return {
      slug: esp.slug,
      keyExterna: esp.idExterno,
      nombre: esp.nombre,
      tipo: esp.tipo,
      challengeRating: esp.challengeRating,
      hpBase: esp.hpBase,
      ataqueBase: esp.ataqueBase,
      defensaBase: esp.defensaBase,
      velocidadBase: esp.velocidadBase,
      tasaCaptura: esp.tasaCaptura,
      esEspecial: esp.esEspecial,
      descripcion:
        esp.descripcion || CATALOGO_ESPECIES_PROPENSO[esp.idExterno]?.descripcion || '',
      arquetipo: determinarArquetipoEspecie(esp),
      movimientos: esp.movimientos.map((m) => ({
        nombre: m.nombre,
        nombreOriginal: m.nombreOriginal,
        tipoAccion: m.tipoAccion,
        poder: m.poder,
      })),
    };
  }
}
