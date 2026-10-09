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

export interface EspecieEncuentro {
  slug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque: number;
  defensa: number;
  velocidad: number;
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
}

export interface CriaturaCombateAliada {
  criaturaId: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
}

export interface EncuentroActivo {
  encuentroId: string;
  estado: "EN_CURSO" | "VICTORIA" | "DERROTA" | "HUIDO" | "CAPTURADO";
  turno: number;
  esTurnoJugador: boolean;
  criaturaRival: CriaturaCombateRival;
  criaturaAliada: CriaturaCombateAliada;
}

export interface PeticionAtacar {
  encuentroId: string;
  movimientoIndice: number;
}

export interface AccionCombate {
  movimiento: string;
  danoCausado: number;
  hpRestanteRival?: number;
  hpRestanteAliado?: number;
}

export interface RespuestaAtacar {
  encuentroId: string;
  estado: "EN_CURSO" | "VICTORIA" | "DERROTA";
  turno: number;
  accionJugador: AccionCombate;
  accionRival?: AccionCombate | null;
  resultadoFinal?: {
    experienciaGanada?: number;
    subioNivel?: boolean;
    nivelNuevo?: number;
  } | null;
}

export interface PeticionCapturar {
  encuentroId: string;
  itemCodigo: string;
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
}

export interface PeticionHuir {
  encuentroId: string;
}

export interface RespuestaHuir {
  exito: boolean;
  mensaje: string;
  estado: "HUIDO";
}

export interface CriaturaEquipo {
  criaturaId: string;
  slug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
  ataque: number;
  defensa: number;
  velocidad: number;
  orden: number;
}

export interface RespuestaEquipo {
  criaturas: CriaturaEquipo[];
}

export interface CriaturaAlmacen {
  criaturaId: string;
  slug: string;
  nombre: string;
  nivel: number;
  hpActual: number;
  hpMaximo: number;
}

export interface RespuestaAlmacen {
  criaturas: CriaturaAlmacen[];
}

export interface PeticionTransferirCriatura {
  criaturaId: string;
  haciaEquipo: boolean;
}

export interface RespuestaTransferirCriatura {
  mensaje: string;
  totalEnEquipo: number;
  totalEnAlmacen: number;
}

export interface ItemInventario {
  codigo: string;
  nombre: string;
  tipo: "CAPTURA" | "CURACION";
  cantidad: number;
}

export interface RespuestaInventario {
  monedas: number;
  items: ItemInventario[];
}

export interface PeticionComprarTienda {
  itemCodigo: string;
  cantidad: number;
}

export interface RespuestaComprarTienda {
  itemCodigo: string;
  cantidadComprada: number;
  costoTotal: number;
  saldoRestante: number;
}

export interface PeticionUsarItem {
  itemCodigo: string;
  criaturaId: string;
}

export interface RespuestaUsarItem {
  criaturaId: string;
  hpPrevio: number;
  hpNuevo: number;
  cantidadRestante: number;
}

export interface RespuestaRestaurar {
  mensaje: string;
  criaturasRestauradas: number;
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

export interface EspecieCatalogo {
  slug: string;
  nombre: string;
  tipo: string;
  challengeRating: number;
  hpBase: number;
  ataqueBase: number;
  defensaBase: number;
  velocidadBase: number;
  tasaCaptura: number;
  esEspecial: boolean;
}

export interface RespuestaEspecies {
  total: number;
  especies: EspecieCatalogo[];
}

export interface MovimientoEspecie {
  nombre: string;
  nombreOriginal: string;
  poder: number;
}

export interface EspecieDetalle extends EspecieCatalogo {
  keyExterna: string;
  movimientos: MovimientoEspecie[];
}

export interface EventoHistorial {
  eventoId: string;
  tipo: string;
  descripcion: string;
  marcaTiempo: string;
}

export interface RespuestaHistorial {
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
  comprarEnTienda(peticion: PeticionComprarTienda): Promise<RespuestaComprarTienda>;
  usarItem(peticion: PeticionUsarItem): Promise<RespuestaUsarItem>;
  restaurarEquipo(): Promise<RespuestaRestaurar>;
  obtenerDesbloqueos(): Promise<RespuestaDesbloqueos>;
  verificarZona(peticion: PeticionVerificarZona): Promise<RespuestaVerificarZona>;
  obtenerEspecies(tipo?: string): Promise<RespuestaEspecies>;
  obtenerEspecie(slug: string): Promise<EspecieDetalle>;
  obtenerHistorial(): Promise<RespuestaHistorial>;
}
