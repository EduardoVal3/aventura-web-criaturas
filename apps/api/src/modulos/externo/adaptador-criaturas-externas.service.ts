import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import {
  ProveedorCriaturas,
  CriaturaExternaDto,
  AtaqueExternoDto,
} from './proveedor-criaturas.interface';
import {
  calcularPoderAtaque,
  extraerVelocidadMaxima,
  CATALOGO_ESPECIES_PROPENSO,
  TRADUCCION_MOVIMIENTOS,
} from './normalizador-criaturas.util';

interface Open5eAttackRaw {
  name?: string;
  attack_type?: string;
  damage_die_count?: number;
  damage_die_type?: string;
  damage_bonus?: number | null;
}

interface Open5eActionRaw {
  name: string;
  attacks?: Open5eAttackRaw[];
}

interface Open5eCreatureRaw {
  key: string;
  name: string;
  type?: { key?: string; name?: string } | string;
  challenge_rating: number;
  hit_points: number;
  armor_class: number;
  speed_all: Record<string, unknown>;
  actions?: Open5eActionRaw[];
}

@Injectable()
export class AdaptadorCriaturasExternas implements ProveedorCriaturas {
  private readonly logger = new Logger(AdaptadorCriaturasExternas.name);
  private obtenerRutaSnapshot(): string {
    const candidatas = [
      path.resolve(process.cwd(), 'datos', 'open5e-srd-2024-seleccion.json'),
      path.resolve(process.cwd(), '..', '..', 'datos', 'open5e-srd-2024-seleccion.json'),
      path.resolve(__dirname, '..', '..', '..', '..', 'datos', 'open5e-srd-2024-seleccion.json'),
    ];
    for (const r of candidatas) {
      if (fs.existsSync(r)) {
        return r;
      }
    }
    return candidatas[0];
  }

  async obtenerEspeciesSeleccionadas(claves: string[]): Promise<CriaturaExternaDto[]> {
    let datosCrudos: Open5eCreatureRaw[] = [];

    try {
      datosCrudos = await this.consultarApiOpen5e(claves);
      if (!datosCrudos || datosCrudos.length < claves.length) {
        this.logger.warn(
          `Open5e devolvió ${datosCrudos?.length ?? 0} de ${claves.length} especies. Completando con snapshot local de contingencia.`,
        );
        const snapshot = this.cargarSnapshotLocal();
        const conjuntoExistente = new Set(datosCrudos.map((c) => c.key));
        for (const snap of snapshot) {
          if (!conjuntoExistente.has(snap.key)) {
            datosCrudos.push(snap);
          }
        }
      }
    } catch (error) {
      this.logger.warn(
        `Falla en consulta a Open5e (${(error as Error).message}). Activando fallback al snapshot local: ${this.obtenerRutaSnapshot()}`,
      );
      datosCrudos = this.cargarSnapshotLocal();
    }

    if (!datosCrudos || datosCrudos.length === 0) {
      this.logger.warn('Datos vacíos tras consulta externa. Leyendo snapshot local de contingencia.');
      datosCrudos = this.cargarSnapshotLocal();
    }

    const conjuntoClaves = new Set(claves);
    const filtradas = datosCrudos.filter((c) => conjuntoClaves.has(c.key));

    return filtradas.map((c) => this.mapearACriaturaExternaDto(c));
  }

  private async consultarApiOpen5e(claves: string[]): Promise<Open5eCreatureRaw[]> {
    const listaClaves = encodeURIComponent(claves.join(','));
    const url = `https://api.open5e.com/v2/creatures/?document__key__in=srd-2024&key__in=${listaClaves}&fields=key,name,type,challenge_rating,hit_points,armor_class,speed_all,actions&limit=100`;

    // simplificacion: timeout de 10 segundos mediante AbortSignal nativo; suficiente para API externa
    const controlador = new AbortController();
    const temporizador = setTimeout(() => controlador.abort(), 10000);

    try {
      const respuesta = await fetch(url, {
        signal: controlador.signal,
        headers: { Accept: 'application/json' },
      });

      if (!respuesta.ok) {
        throw new Error(`Código de estado HTTP no exitoso: ${respuesta.status}`);
      }

      const cuerpo = (await respuesta.json()) as { results?: Open5eCreatureRaw[] };
      if (!cuerpo.results || !Array.isArray(cuerpo.results)) {
        throw new Error('Formato de respuesta inesperado de Open5e');
      }

      return cuerpo.results;
    } finally {
      clearTimeout(temporizador);
    }
  }

  public cargarSnapshotLocal(): Open5eCreatureRaw[] {
    const ruta = this.obtenerRutaSnapshot();
    if (!fs.existsSync(ruta)) {
      throw new Error(`Snapshot local de contingencia no encontrado en ${ruta}`);
    }
    const contenido = fs.readFileSync(ruta, 'utf-8');
    return JSON.parse(contenido) as Open5eCreatureRaw[];
  }

  public mapearACriaturaExternaDto(crudo: Open5eCreatureRaw): CriaturaExternaDto {
    const metaEspecie = CATALOGO_ESPECIES_PROPENSO[crudo.key];
    const slug = metaEspecie ? metaEspecie.slug : crudo.key;

    let tipoExterno = 'beast';
    if (typeof crudo.type === 'object' && crudo.type !== null) {
      tipoExterno = crudo.type.key || crudo.type.name || 'beast';
    } else if (typeof crudo.type === 'string') {
      tipoExterno = crudo.type;
    }

    const ataques: AtaqueExternoDto[] = [];
    const accionesConAtaques = (crudo.actions || []).filter(
      (a) => a.attacks && a.attacks.length > 0,
    );

    // Hasta 3 acciones con ataques
    for (const accion of accionesConAtaques.slice(0, 3)) {
      const primerAtaque = accion.attacks![0];
      const poderCalculado = calcularPoderAtaque(
        primerAtaque.damage_die_count ?? 1,
        primerAtaque.damage_die_type ?? 'D6',
        primerAtaque.damage_bonus ?? 0,
      );

      const traduccion = TRADUCCION_MOVIMIENTOS[slug]?.[accion.name];
      const tipoAccion = traduccion?.tipoAccion ?? 'Ataque melé';

      ataques.push({
        nombreOriginal: accion.name,
        tipoAccion,
        poder: poderCalculado,
      });
    }

    return {
      idExterno: crudo.key,
      tipoExterno,
      hitPoints: crudo.hit_points,
      armorClass: crudo.armor_class,
      speedMax: extraerVelocidadMaxima(crudo.speed_all),
      challengeRating: crudo.challenge_rating,
      ataques,
    };
  }
}
