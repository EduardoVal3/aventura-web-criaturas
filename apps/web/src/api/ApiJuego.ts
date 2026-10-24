/**
 * Tipos de datos y contrato de la API según docs/contrato-api.md
 */

export class ErrorApi extends Error {
  readonly estado: number;
  readonly codigo: string;

  constructor(estado: number, codigo: string, mensaje: string) {
    super(mensaje);
    this.name = "ErrorApi";
    this.estado = estado;
    this.codigo = codigo;
  }
}

export interface RespuestaSalud {
  estado: string;
  marcaTiempo: string;
  version: string;
}

export interface PeticionRegistro {
  nombreUsuario: string;
  correo: string;
  clave: string;
}

export interface RespuestaRegistro {
  usuarioId: string;
  nombreUsuario: string;
  correo: string;
  tokenAcceso: string;
}

export interface PeticionLogin {
  correo: string;
  clave: string;
}

export interface RespuestaLogin {
  usuarioId: string;
  nombreUsuario: string;
  tokenAcceso: string;
  tienePersonaje: boolean;
}

export interface RespuestaLogout {
  mensaje: string;
}

export interface PeticionCrearPersonaje {
  nombre: string;
  especieInicialSlug: string;
}

export interface CriaturaInicial {
  criaturaId: string;
  especieSlug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  puntosExperiencia: number;
}

export interface RespuestaCrearPersonaje {
  personajeId: string;
  nombre: string;
  monedas: number;
  ubicacionActualId: string;
  criaturaInicial: CriaturaInicial;
}

export interface PersonajeActivo {
  personajeId: string;
  nombre: string;
  monedas: number;
  ubicacionActualId: string;
  totalCriaturasEquipo: number;
  totalCriaturasAlmacen: number;
}

export interface ConexionUbicacion {
  ubicacionDestinoId: string;
  nombre: string;
  nivelSugerido: string;
  estaBloqueada: boolean;
  requisito: string | null;
}

export interface UbicacionActual {
  ubicacionId: string;
  nombre: string;
  slug?: string;
  tipo: "LOCALIDAD" | "ZONA_PELIGRO";
  esSegura: boolean;
  descripcion: string;
  nivelMinimo?: number | null;
  nivelMaximo?: number | null;
  nivelSugerido?: string | null;
  servicios: string[];
  progresoZona?: number;
  conexiones: ConexionUbicacion[];
}

export interface PeticionViajar {
  destinoId: string;
}

export interface RespuestaViajar {
  ubicacionActualId: string;
  nombre: string;
  mensaje: string;
}

export type CodigoEstado =
  | "QUEMADURA"
  | "VENENO"
  | "ESCARCHA"
  | "PARALISIS"
  | "PETRIFICACION"
  | "BASTION";

export type EtiquetaEfectividad = "VENTAJA" | "DESVENTAJA" | "NEUTRAL";

export interface EstadoActivo {
  codigo: CodigoEstado;
  nombre: string;
  turnosRestantes: number;
  escudo?: number;
}

export interface EfectoFinDeTurno {
  objetivo: "ALIADA" | "RIVAL";
  codigo: CodigoEstado;
  dano: number;
  hpRestante: number;
}

export interface EspecieEncuentro {
  slug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  esLegendaria?: boolean;
}

export interface EncuentroDetalle {
  encuentroId: string;
  estado: "EN_CURSO" | "VICTORIA" | "DERROTA" | "HUIDO" | "CAPTURADO";
  especie: EspecieEncuentro;
}

export interface RecompensaExploracion {
  tipo: "MONEDAS" | "ITEM";
  cantidad: number;
  itemCodigo?: string;
}

export interface RespuestaExploracion {
  tipoEvento: "ENCUENTRO" | "OBJETO" | "SIN_EVENTO";
  mensaje: string;
  progresoZona?: number;
  encuentro?: EncuentroDetalle;
  recompensa?: RecompensaExploracion | null;
}

export interface CriaturaCombateRival {
  slug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque?: number;
  defensa?: number;
  velocidad?: number;
  afinidad?: string;
  resonancia?: number;
  estados?: EstadoActivo[];
  esLegendaria?: boolean;
}

export interface MovimientoCombate {
  nombre: string;
  poder: number;
  tipoAccion?: string;
  slot?: number;
  efecto?: string | null;
  bloqueado?: boolean;
  estadoAplicado?: CodigoEstado | null;
}

export interface CriaturaCombateAliada {
  criaturaId: string;
  nombre: string;
  slug?: string;
  nombreEspecie?: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  experiencia?: number;
  porcentajeXp?: number;
  xpSiguienteNivel?: number;
  xpNivelActual?: number;
  ataque?: number;
  defensa?: number;
  velocidad?: number;
  movimientos?: MovimientoCombate[];
  afinidad?: string;
  resonancia?: number;
  estados?: EstadoActivo[];
}

export interface EncuentroActivo {
  encuentroId: string;
  estado: "EN_CURSO" | "VICTORIA" | "DERROTA" | "HUIDO" | "CAPTURADO";
  turno: number;
  esTurnoJugador: boolean;
  criaturaRival: CriaturaCombateRival;
  criaturaAliada: CriaturaCombateAliada;
  bitacora?: string[];
  efectividadAliadaSobreRival?: {
    multiplicador: number;
    etiqueta: string;
  };
}

export interface PeticionAtacar {
  encuentroId: string;
  movimientoIndice: number;
  turnoEsperado?: number;
}

export interface AccionCombate {
  movimiento: string;
  danoCausado: number;
  hpRestanteRival?: number;
  hpRestanteAliado?: number;
  efectividad?: EtiquetaEfectividad;
  danoAbsorbido?: number;
  estadoAplicado?: CodigoEstado | null;
  perdioTurno?: boolean;
  esInsignia?: boolean;
}

export interface ProgresoVictoria {
  xpGanada: number;
  monedasGanadas: number;
  subioNivel: boolean;
  nivelAnterior?: number;
  nivelNuevo: number;
  porcentajeXp?: number;
  xpSiguienteNivel?: number;
  xpNivelActual?: number;
  saldoMonedas?: number;
}

export interface RespuestaAtacar {
  encuentroId: string;
  estado: "EN_CURSO" | "VICTORIA" | "DERROTA";
  turno: number;
  hpRestanteAliada?: number;
  hpRestanteRival?: number;
  accionJugador?: AccionCombate | null;
  accionRival?: AccionCombate | null;
  rivalActuoPrimero?: boolean;
  resultadoFinal?:
    | string
    | {
        experienciaGanada?: number;
        subioNivel?: boolean;
        nivelNuevo?: number;
        monedasGanadas?: number;
      }
    | null;
  progreso?: ProgresoVictoria | null;
  recompensas?: {
    experienciaGanada?: number;
    monedasGanadas?: number;
    subioNivel?: boolean;
    nivelNuevo?: number;
  } | null;
  efectosFinDeTurno?: EfectoFinDeTurno[];
  resonancia?: {
    aliada: number;
    rival: number;
  };
  estados?: {
    aliada: EstadoActivo[];
    rival: EstadoActivo[];
  };
  mensajes?: string[];
}

export interface PeticionCapturar {
  encuentroId: string;
  itemCodigo: string;
  turnoEsperado?: number;
}

export interface CriaturaCapturada {
  criaturaId: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
}

export interface RespuestaCapturar {
  exito: boolean;
  mensaje: string;
  encuentroId: string;
  estado: "CAPTURADO" | "EN_CURSO";
  destinoCaptura?: "EQUIPO" | "ALMACEN";
  criaturaCapturada?: CriaturaCapturada;
  contraataqueRival?: AccionCombate;
  efectosFinDeTurno?: EfectoFinDeTurno[];
  resonancia?: {
    aliada: number;
    rival: number;
  };
  estados?: {
    aliada: EstadoActivo[];
    rival: EstadoActivo[];
  };
  mensajes?: string[];
}

export interface PeticionHuir {
  encuentroId: string;
  turnoEsperado?: number;
}

export interface RespuestaHuir {
  exito: boolean;
  mensaje: string;
  estado: string;
  contraataqueRival?: AccionCombate | null;
  efectosFinDeTurno?: EfectoFinDeTurno[];
  resonancia?: {
    aliada: number;
    rival: number;
  };
  estados?: {
    aliada: EstadoActivo[];
    rival: EstadoActivo[];
  };
  mensajes?: string[];
}

export interface CriaturaEquipo {
  criaturaId: string;
  slug: string;
  nombre: string;
  apodo?: string | null;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  experiencia?: number;
  porcentajeXp?: number;
  xpSiguienteNivel?: number;
  xpNivelActual?: number;
  orden: number;
}

export interface RespuestaEquipo {
  criaturas: CriaturaEquipo[];
  limiteEquipo: number;
  enLocalidadSegura: boolean;
}

export interface CriaturaAlmacen {
  criaturaId: string;
  slug: string;
  nombre: string;
  apodo?: string | null;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  experiencia?: number;
  porcentajeXp?: number;
  xpSiguienteNivel?: number;
  xpNivelActual?: number;
  orden?: number | null;
}

export interface RespuestaAlmacen {
  criaturas: CriaturaAlmacen[];
  limiteEquipo: number;
  enLocalidadSegura: boolean;
  totalEnEquipo: number;
}

export interface PeticionTransferirCriatura {
  criaturaId: string;
  haciaEquipo: boolean;
  intercambiarConId?: string;
}

export interface RespuestaTransferirCriatura {
  mensaje: string;
  totalEnEquipo: number;
  totalEnAlmacen: number;
}

export type CategoriaObjeto = "CURACION" | "CAPTURA" | "ESPECIAL";

export interface ItemInventario {
  codigo: string;
  nombre: string;
  descripcion?: string;
  tipo: CategoriaObjeto;
  efectoValor?: number;
  precioCompra?: number;
  cantidad: number;
}

export interface RespuestaInventario {
  monedas: number;
  capacidadMaxima?: number;
  ranurasOcupadas?: number;
  totalUnidades?: number;
  items: ItemInventario[];
}

export interface ArticuloCatalogoTienda {
  codigo: string;
  nombre: string;
  descripcion: string;
  tipo: CategoriaObjeto;
  precioCompra: number;
  efectoValor: number;
  cantidadEnInventario: number;
}

export interface RespuestaCatalogoTienda {
  saldoMonedas: number;
  servicioDisponible: boolean;
  ubicacionActual: {
    id: string;
    nombre: string;
    esSegura: boolean;
  };
  items: ArticuloCatalogoTienda[];
}

export interface PeticionComprarTienda {
  itemCodigo: string;
  cantidad: number;
}

export interface RespuestaComprarTienda {
  itemCodigo: string;
  nombre?: string;
  cantidadComprada: number;
  precioUnitario?: number;
  costoTotal: number;
  saldoRestante: number;
  cantidadEnInventario?: number;
}

export interface PeticionUsarItem {
  itemCodigo: string;
  criaturaId: string;
}

export interface RespuestaUsarItem {
  criaturaId: string;
  criaturaNombre?: string;
  hpPrevio: number;
  hpNuevo: number;
  hpMaximo?: number;
  curacionAplicada?: number;
  cantidadRestante: number;
}

export interface DetalleCriaturaRestaurada {
  criaturaId: string;
  nombre: string;
  hpPrevio: number;
  hpNuevo: number;
  hpMaximo: number;
  hpRestaurado: number;
  fueRevivida: boolean;
}

export interface RespuestaRestaurar {
  mensaje: string;
  criaturasRestauradas: number;
  criaturasCuradas?: number;
  criaturasRevividas?: number;
  hpTotalRestaurado?: number;
  ubicacionNombre?: string;
  detalles?: DetalleCriaturaRestaurada[];
}

export interface ZonaProgreso {
  zonaId: string;
  desbloqueada: boolean;
  requisito?: string;
}

export interface RespuestaDesbloqueos {
  zonas: ZonaProgreso[];
}

export interface PeticionVerificarZona {
  zonaId: string;
}

export interface RespuestaVerificarZona {
  zonaId: string;
  desbloqueada: boolean;
  mensaje: string;
}

export type ArquetipoEspecie = "TANQUE" | "ATACANTE" | "VELOZ" | "EQUILIBRADO";
export type CategoriaHistorial = "COMBATE" | "CAPTURA" | "EXPLORACION" | "TIENDA" | "CURACION";

export interface EspecieCatalogo {
  slug: string;
  nombre: string;
  tipo: string;
  elemento?: string;
  challengeRating: number;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  tasaCaptura: number;
  esEspecial: boolean;
  esLegendaria?: boolean;
  keyExterna?: string;
  descripcion?: string;
  arquetipo?: ArquetipoEspecie;
  movimientos?: MovimientoEspecie[];
  zona?: { id: string; nombre: string } | null;
}

export interface RespuestaEspecies {
  total: number;
  especies: EspecieCatalogo[];
}

export interface MovimientoEspecie {
  nombre: string;
  nombreOriginal: string;
  tipoAccion?: string;
  poder: number;
  slot?: number;
  efecto?: string | null;
}

export interface EspecieDetalle extends EspecieCatalogo {
  keyExterna: string;
  movimientos: MovimientoEspecie[];
}

export interface EventoHistorial {
  eventoId: string;
  tipo: string;
  categoria?: CategoriaHistorial;
  descripcion: string;
  marcaTiempo: string;
  datosJson?: Record<string, unknown>;
}

export interface RespuestaHistorial {
  total?: number;
  pagina?: number;
  limite?: number;
  eventos: EventoHistorial[];
}

export interface ApiJuego {
  establecerToken(token: string | null): void;
  obtenerSalud(): Promise<RespuestaSalud>;
  registrarUsuario(peticion: PeticionRegistro): Promise<RespuestaRegistro>;
  iniciarSesion(peticion: PeticionLogin): Promise<RespuestaLogin>;
  cerrarSesion(): Promise<RespuestaLogout>;
  crearPersonaje(peticion: PeticionCrearPersonaje): Promise<RespuestaCrearPersonaje>;
  obtenerPersonajeActivo(): Promise<PersonajeActivo>;
  obtenerUbicacionActual(): Promise<UbicacionActual>;
  viajar(peticion: PeticionViajar): Promise<RespuestaViajar>;
  explorar(): Promise<RespuestaExploracion>;
  obtenerEncuentroActivo(): Promise<EncuentroActivo>;
  atacar(peticion: PeticionAtacar): Promise<RespuestaAtacar>;
  capturar(peticion: PeticionCapturar): Promise<RespuestaCapturar>;
  huir(peticion: PeticionHuir): Promise<RespuestaHuir>;
  obtenerEquipo(): Promise<RespuestaEquipo>;
  obtenerAlmacen(): Promise<RespuestaAlmacen>;
  transferirCriatura(peticion: PeticionTransferirCriatura): Promise<RespuestaTransferirCriatura>;
  obtenerInventario(): Promise<RespuestaInventario>;
  obtenerCatalogoTienda(): Promise<RespuestaCatalogoTienda>;
  comprarEnTienda(peticion: PeticionComprarTienda): Promise<RespuestaComprarTienda>;
  usarItem(peticion: PeticionUsarItem): Promise<RespuestaUsarItem>;
  restaurarEquipo(): Promise<RespuestaRestaurar>;
  obtenerDesbloqueos(): Promise<RespuestaDesbloqueos>;
  verificarZona(peticion: PeticionVerificarZona): Promise<RespuestaVerificarZona>;
  obtenerEspecies(tipo?: string): Promise<RespuestaEspecies>;
  obtenerEspecie(slug: string): Promise<EspecieDetalle>;
  obtenerHistorial(categoria?: string): Promise<RespuestaHistorial>;
  actualizarOrdenEquipo(peticion: {
    criaturaIds?: string[];
    orden?: { criaturaId: string; orden: number }[];
  }): Promise<RespuestaEquipo>;
}
