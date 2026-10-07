import {
  type ApiJuego,
  type CriaturaAlmacen,
  type CriaturaEquipo,
  type EncuentroActivo,
  type EspecieDetalle,
  ErrorApi,
  type EventoHistorial,
  type PersonajeActivo,
  type PeticionAtacar,
  type PeticionCapturar,
  type PeticionComprarTienda,
  type PeticionCrearPersonaje,
  type PeticionHuir,
  type PeticionLogin,
  type PeticionRegistro,
  type PeticionTransferirCriatura,
  type PeticionUsarItem,
  type PeticionVerificarZona,
  type PeticionViajar,
  type RespuestaAlmacen,
  type RespuestaAtacar,
  type RespuestaCapturar,
  type RespuestaComprarTienda,
  type RespuestaCrearPersonaje,
  type RespuestaDesbloqueos,
  type RespuestaEquipo,
  type RespuestaEspecies,
  type RespuestaExploracion,
  type RespuestaHistorial,
  type RespuestaHuir,
  type RespuestaInventario,
  type RespuestaLogin,
  type RespuestaLogout,
  type RespuestaRegistro,
  type RespuestaRestaurar,
  type RespuestaSalud,
  type RespuestaTransferirCriatura,
  type RespuestaUsarItem,
  type RespuestaVerificarZona,
  type RespuestaViajar,
  type UbicacionActual,
} from "./ApiJuego";

// simplificacion: datos fijos en memoria sin reglas reales del juego; suficiente para construir pantallas sin back-end. Se sustituye por apiHttp cuando exista la API NestJS.

let _token: string | null = "token-simulado-aethelgard";

const retardo = (ms = 120) => new Promise((resolve) => setTimeout(resolve, ms));

const criaturasEquipoMock: CriaturaEquipo[] = [
  {
    criaturaId: "cri-301",
    slug: "lobo-gris",
    nombre: "Lobo Gris",
    nivel: 2,
    hpActual: 25,
    hpMaximo: 30,
    ataque: 42,
    defensa: 58,
    velocidad: 50,
    orden: 1,
  },
  {
    criaturaId: "cri-302",
    slug: "pico-de-hacha",
    nombre: "Pico de Hacha",
    nivel: 2,
    hpActual: 14,
    hpMaximo: 19,
    ataque: 42,
    defensa: 51,
    velocidad: 60,
    orden: 2,
  },
];

const criaturasAlmacenMock: CriaturaAlmacen[] = [
  {
    criaturaId: "cri-303",
    slug: "arana-lobo-gigante",
    nombre: "Araña Lobo Gigante",
    nivel: 1,
    hpActual: 11,
    hpMaximo: 11,
  },
];

const especiesCatalogoMock: EspecieDetalle[] = [
  {
    slug: "lobo-gris",
    keyExterna: "srd-2024_wolf",
    nombre: "Lobo Gris",
    tipo: "beast",
    challengeRating: 0.25,
    hpBase: 30,
    ataqueBase: 42,
    defensaBase: 58,
    velocidadBase: 50,
    tasaCaptura: 0.88,
    esEspecial: false,
    movimientos: [
      { nombre: "Mordisco Feroz", nombreOriginal: "Bite", poder: 5.5 },
    ],
  },
  {
    slug: "pico-de-hacha",
    keyExterna: "srd-2024_axe-beak",
    nombre: "Pico de Hacha",
    tipo: "beast",
    challengeRating: 0.25,
    hpBase: 19,
    ataqueBase: 42,
    defensaBase: 51,
    velocidadBase: 60,
    tasaCaptura: 0.85,
    esEspecial: false,
    movimientos: [
      { nombre: "Picotazo Cortante", nombreOriginal: "Beak", poder: 6.0 },
    ],
  },
  {
    slug: "arana-lobo-gigante",
    keyExterna: "srd-2024_giant-wolf-spider",
    nombre: "Araña Lobo Gigante",
    tipo: "beast",
    challengeRating: 0.25,
    hpBase: 11,
    ataqueBase: 44,
    defensaBase: 48,
    velocidadBase: 65,
    tasaCaptura: 0.82,
    esEspecial: false,
    movimientos: [
      { nombre: "Mordedura Venenosa", nombreOriginal: "Bite", poder: 4.5 },
    ],
  },
];

const eventosHistorialMock: EventoHistorial[] = [
  {
    eventoId: "his-501",
    tipo: "VICTORIA_COMBATE",
    descripcion: "Victoria contra Pico de Hacha (Nv. 2) en Praderas del Amanecer (+45 XP)",
    marcaTiempo: "2026-10-07T12:45:00.000Z",
  },
  {
    eventoId: "his-502",
    tipo: "CAPTURA",
    descripcion: "Captura exitosa de Lobo Gris con Talismán Básico",
    marcaTiempo: "2026-10-07T12:42:00.000Z",
  },
];

export const apiSimulada = {
  establecerToken(token: string | null): void {
    _token = token;
  },

  async obtenerSalud(): Promise<RespuestaSalud> {
    await retardo();
    return {
      estado: "activo",
      marcaTiempo: new Date().toISOString(),
      version: "0.1.0",
    };
  },

  async registrarUsuario(peticion: PeticionRegistro): Promise<RespuestaRegistro> {
    await retardo();
    if (!peticion.correo || !peticion.clave || !peticion.nombreUsuario) {
      throw new ErrorApi(400, "DATOS_INVALIDOS", "Todos los campos de registro son obligatorios.");
    }
    return {
      usuarioId: "usr-101",
      nombreUsuario: peticion.nombreUsuario,
      correo: peticion.correo,
      tokenAcceso: "jwt.token.simulado",
    };
  },

  async iniciarSesion(peticion: PeticionLogin): Promise<RespuestaLogin> {
    await retardo();
    if (peticion.correo === "error@ejemplo.com") {
      throw new ErrorApi(401, "CREDENCIALES_INVALIDAS", "Correo o clave incorrectos.");
    }
    return {
      usuarioId: "usr-101",
      nombreUsuario: "arturo_sendas",
      tokenAcceso: "jwt.token.simulado",
      tienePersonaje: true,
    };
  },

  async cerrarSesion(): Promise<RespuestaLogout> {
    await retardo();
    _token = null;
    return {
      mensaje: "Sesión cerrada correctamente.",
    };
  },

  async crearPersonaje(peticion: PeticionCrearPersonaje): Promise<RespuestaCrearPersonaje> {
    await retardo();
    if (!peticion.nombre) {
      throw new ErrorApi(400, "DATOS_INVALIDOS", "El nombre de personaje es obligatorio.");
    }
    return {
      personajeId: "pj-201",
      nombre: peticion.nombre,
      monedas: 100,
      ubicacionActualId: "LOC-01",
      criaturaInicial: {
        criaturaId: "cri-301",
        especieSlug: peticion.especieInicialSlug || "lobo-gris",
        nombre: "Lobo Gris",
        nivel: 1,
        hpActual: 30,
        hpMaximo: 30,
        puntosExperiencia: 0,
      },
    };
  },

  async obtenerPersonajeActivo(): Promise<PersonajeActivo> {
    await retardo();
    if (!_token) {
      throw new ErrorApi(401, "NO_AUTORIZADO", "Debes iniciar sesión para obtener el personaje activo.");
    }
    return {
      personajeId: "pj-201",
      nombre: "Arturo",
      monedas: 120,
      ubicacionActualId: "LOC-01",
      totalCriaturasEquipo: criaturasEquipoMock.length,
      totalCriaturasAlmacen: criaturasAlmacenMock.length,
    };
  },

  async obtenerUbicacionActual(): Promise<UbicacionActual> {
    await retardo();
    return {
      ubicacionId: "LOC-01",
      nombre: "Villa Serena",
      tipo: "LOCALIDAD",
      esSegura: true,
      descripcion: "Aldea pacífica en el valle donde inician los reclutas del gremio.",
      servicios: ["CURACION", "ALMACEN", "HISTORIAL", "TIENDA"],
      conexiones: [
        {
          ubicacionDestinoId: "ZON-01",
          nombre: "Praderas del Amanecer",
          nivelSugerido: "1-3",
          estaBloqueada: false,
          requisito: null,
        },
        {
          ubicacionDestinoId: "ZON-02",
          nombre: "Bosque Susurrante",
          nivelSugerido: "2-4",
          estaBloqueada: false,
          requisito: null,
        },
      ],
    };
  },

  async viajar(peticion: PeticionViajar): Promise<RespuestaViajar> {
    await retardo();
    if (peticion.destinoId === "ZON-05") {
      throw new ErrorApi(403, "ZONA_BLOQUEADA", "Esta zona requiere maestría superior.");
    }
    return {
      ubicacionActualId: peticion.destinoId,
      nombre: "Praderas del Amanecer",
      mensaje: "Has llegado a Praderas del Amanecer.",
    };
  },

  async explorar(): Promise<RespuestaExploracion> {
    await retardo();
    return {
      tipoEvento: "ENCUENTRO",
      mensaje: "¡Una criatura salvaje te desafía en el camino!",
      encuentro: {
        encuentroId: "enc-401",
        estado: "EN_CURSO",
        especie: {
          slug: "pico-de-hacha",
          nombre: "Pico de Hacha",
          nivel: 2,
          hpActual: 19,
          hpMaximo: 19,
          ataque: 42,
          defensa: 51,
          velocidad: 60,
        },
      },
    };
  },

  async obtenerEncuentroActivo(): Promise<EncuentroActivo> {
    await retardo();
    return {
      encuentroId: "enc-401",
      estado: "EN_CURSO",
      turno: 1,
      esTurnoJugador: true,
      criaturaRival: {
        slug: "pico-de-hacha",
        nombre: "Pico de Hacha",
        nivel: 2,
        hpActual: 14,
        hpMaximo: 19,
      },
      criaturaAliada: {
        criaturaId: "cri-301",
        nombre: "Lobo Gris",
        nivel: 2,
        hpActual: 25,
        hpMaximo: 30,
      },
    };
  },

  async atacar(peticion: PeticionAtacar): Promise<RespuestaAtacar> {
    await retardo();
    return {
      encuentroId: peticion.encuentroId,
      estado: "EN_CURSO",
      turno: 2,
      accionJugador: {
        movimiento: "Mordisco Feroz",
        danoCausado: 5,
        hpRestanteRival: 9,
      },
      accionRival: {
        movimiento: "Picotazo Cortante",
        danoCausado: 4,
        hpRestanteAliado: 21,
      },
      resultadoFinal: null,
    };
  },

  async capturar(peticion: PeticionCapturar): Promise<RespuestaCapturar> {
    await retardo();
    return {
      exito: true,
      mensaje: "¡Captura exitosa! Pico de Hacha ha sido incorporado a tu equipo.",
      encuentroId: peticion.encuentroId,
      estado: "CAPTURADO",
      destinoCaptura: "EQUIPO",
      criaturaCapturada: {
        criaturaId: "cri-302",
        nombre: "Pico de Hacha",
        nivel: 2,
        hpActual: 9,
        hpMaximo: 19,
      },
    };
  },

  async huir(_peticion: PeticionHuir): Promise<RespuestaHuir> {
    await retardo();
    return {
      exito: true,
      mensaje: "¡Lograste huir del combate con éxito!",
      estado: "HUIDO",
    };
  },

  async obtenerEquipo(): Promise<RespuestaEquipo> {
    await retardo();
    return {
      criaturas: [...criaturasEquipoMock],
    };
  },

  async obtenerAlmacen(): Promise<RespuestaAlmacen> {
    await retardo();
    return {
      criaturas: [...criaturasAlmacenMock],
    };
  },

  async transferirCriatura(peticion: PeticionTransferirCriatura): Promise<RespuestaTransferirCriatura> {
    await retardo();
    if (!peticion.criaturaId) {
      throw new ErrorApi(400, "DATOS_INVALIDOS", "ID de criatura requerido.");
    }
    return {
      mensaje: "Criatura transferida exitosamente.",
      totalEnEquipo: criaturasEquipoMock.length,
      totalEnAlmacen: criaturasAlmacenMock.length,
    };
  },

  async obtenerInventario(): Promise<RespuestaInventario> {
    await retardo();
    return {
      monedas: 120,
      items: [
        {
          codigo: "talisman-basico",
          nombre: "Talismán Básico de Captura",
          tipo: "CAPTURA",
          cantidad: 3,
        },
        {
          codigo: "pocion-menor",
          nombre: "Poción de Curación Menor",
          tipo: "CURACION",
          cantidad: 2,
        },
      ],
    };
  },

  async comprarEnTienda(peticion: PeticionComprarTienda): Promise<RespuestaComprarTienda> {
    await retardo();
    return {
      itemCodigo: peticion.itemCodigo,
      cantidadComprada: peticion.cantidad,
      costoTotal: 50 * peticion.cantidad,
      saldoRestante: 70,
    };
  },

  async usarItem(peticion: PeticionUsarItem): Promise<RespuestaUsarItem> {
    await retardo();
    return {
      criaturaId: peticion.criaturaId,
      hpPrevio: 10,
      hpNuevo: 30,
      cantidadRestante: 1,
    };
  },

  async restaurarEquipo(): Promise<RespuestaRestaurar> {
    await retardo();
    return {
      mensaje: "Todas las criaturas de tu equipo han sido completamente restauradas.",
      criaturasRestauradas: criaturasEquipoMock.length,
    };
  },

  async obtenerDesbloqueos(): Promise<RespuestaDesbloqueos> {
    await retardo();
    return {
      zonas: [
        { zonaId: "ZON-01", desbloqueada: true },
        { zonaId: "ZON-02", desbloqueada: true },
        { zonaId: "ZON-03", desbloqueada: true },
        { zonaId: "ZON-04", desbloqueada: true },
        {
          zonaId: "ZON-05",
          desbloqueada: false,
          requisito: "Poseer al menos 3 criaturas en equipo de Nivel >= 5",
        },
      ],
    };
  },

  async verificarZona(peticion: PeticionVerificarZona): Promise<RespuestaVerificarZona> {
    await retardo();
    return {
      zonaId: peticion.zonaId,
      desbloqueada: true,
      mensaje: "¡Has demostrado suficiente maestría! La zona ha sido desbloqueada.",
    };
  },

  async obtenerEspecies(tipo?: string): Promise<RespuestaEspecies> {
    await retardo();
    const filtradas = tipo
      ? especiesCatalogoMock.filter((e) => e.tipo === tipo)
      : especiesCatalogoMock;
    return {
      total: filtradas.length,
      especies: filtradas,
    };
  },

  async obtenerEspecie(slug: string): Promise<EspecieDetalle> {
    await retardo();
    const encontrada = especiesCatalogoMock.find((e) => e.slug === slug);
    if (!encontrada) {
      throw new ErrorApi(404, "ESPECIE_NO_ENCONTRADA", `No se encontró la especie "${slug}".`);
    }
    return encontrada;
  },

  async obtenerHistorial(): Promise<RespuestaHistorial> {
    await retardo();
    return {
      eventos: [...eventosHistorialMock],
    };
  },
} satisfies ApiJuego;
