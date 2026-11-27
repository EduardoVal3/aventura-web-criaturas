/**
 * Utilidades para la resolución de recursos multimedia locales y retro en Aethelgard.
 * Los archivos generados se colocan en /assets/[tipo]/[slug].webp.
 * Si el archivo aún no existe, resuelve hacia los placeholders SVG sin romper la UI.
 */

export const RUTAS_PLACEHOLDERS = {
  criatura: '/assets/placeholder-criatura.svg',
  zona: '/assets/placeholder-zona.svg',
  objeto: '/assets/placeholder-objeto.svg',
} as const;

const MAPA_ZONA_POR_CRIATURA: Record<string, string> = {
  // ZON-01: Praderas del Amanecer
  'lobo-estepario': 'praderas-del-amanecer',
  'vibora-rocosa': 'praderas-del-amanecer',
  'ciervo-lunar': 'praderas-del-amanecer',
  'halcon-ceniza': 'praderas-del-amanecer',
  'oso-fresno': 'praderas-del-amanecer',
  // ZON-02: Riberas del Lago Espejo
  'cangrejo-abismal': 'riberas-del-lago-espejo',
  'anguila-penumbra': 'riberas-del-lago-espejo',
  'quelonio-lacustre': 'riberas-del-lago-espejo',
  'tiburon-arrecife': 'riberas-del-lago-espejo',
  'mantarraya-espectral': 'riberas-del-lago-espejo',
  // ZON-03: Bosque Susurrante
  'arana-gigante': 'bosque-susurrante',
  'jabali-espinoso': 'bosque-susurrante',
  'basilisco': 'bosque-susurrante',
  'treant-anciano': 'bosque-susurrante',
  'mantis-sombria': 'bosque-susurrante',
  // ZON-04: Paso de los Riscos
  'gargola': 'paso-de-los-riscos',
  'esqueleto-guerrero': 'paso-de-los-riscos',
  'escorpion-obsidiana': 'paso-de-los-riscos',
  'espectro-ceniza': 'paso-de-los-riscos',
  'golem-granito': 'paso-de-los-riscos',
  // ZON-05: Cueva Umbría
  'elemental-fuego': 'cueva-umbria',
  'salamandra-magma': 'cueva-umbria',
  'pesadilla': 'cueva-umbria',
  'quimera-tricefala': 'cueva-umbria',
  'behir-abismo': 'cueva-umbria',
  // ZON-06: Pico de la Cumbre
  'yeti': 'pico-de-la-cumbre',
  'lobo-invernal': 'pico-de-la-cumbre',
  'elemental-agua': 'pico-de-la-cumbre',
  'tigre-dientes-sable': 'pico-de-la-cumbre',
  'remorhaz-glaciar': 'pico-de-la-cumbre',
};

/**
 * Resuelve el slug de la zona de combate a partir del slug de la criatura rival.
 */
export function obtenerSlugZonaPorCriatura(slugCriatura?: string | null): string | null {
  if (!slugCriatura) return null;
  return MAPA_ZONA_POR_CRIATURA[slugCriatura] ?? null;
}

/**
 * Obtiene la ruta de la imagen de una criatura por su slug.
 */
export function obtenerImagenCriatura(slug?: string | null): string {
  if (!slug) return RUTAS_PLACEHOLDERS.criatura;
  return `/assets/criaturas/${slug}.webp`;
}

/**
 * Normaliza nombres de localidades o identificadores a formato kebab-case para assets.
 */
export function sanitizarSlugZona(nombreOId?: string | null): string {
  if (!nombreOId) return "zona";
  return nombreOId
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Obtiene la ruta del paisaje de una zona por su slug o ID.
 */
export function obtenerImagenZona(slug?: string | null): string {
  if (!slug) return RUTAS_PLACEHOLDERS.zona;
  return `/assets/zonas/${slug}.webp`;
}

/**
 * Obtiene la ruta del icono de un objeto o ítem por su slug.
 */
export function obtenerImagenObjeto(slug?: string | null): string {
  if (!slug) return RUTAS_PLACEHOLDERS.objeto;
  return `/assets/objetos/${slug}.webp`;
}

/**
 * Manejador onError para elementos <img> en React.
 * Reemplaza la fuente por el placeholder correspondiente si el archivo WebP aún no existe.
 */
export function manejarErrorImagen(
  evento: React.SyntheticEvent<HTMLImageElement, Event>,
  tipo: keyof typeof RUTAS_PLACEHOLDERS = 'criatura',
) {
  const img = evento.currentTarget;
  // Prueba en cascada (.webp -> .png -> .jpg -> .jpeg) antes de caer al placeholder SVG
  if (/\.webp$/i.test(img.src)) {
    img.src = img.src.replace(/\.webp$/i, '.png');
    return;
  }
  if (/\.png$/i.test(img.src)) {
    img.src = img.src.replace(/\.png$/i, '.jpg');
    return;
  }
  if (/\.jpg$/i.test(img.src)) {
    img.src = img.src.replace(/\.jpg$/i, '.jpeg');
    return;
  }
  const fallback = RUTAS_PLACEHOLDERS[tipo] || RUTAS_PLACEHOLDERS.criatura;
  // Desconectar el handler para prevenir bucles si el recurso o fallback falla
  img.onerror = null;
  if (img.src !== fallback && !img.src.endsWith(fallback)) {
    img.src = fallback;
  }
}

let contextoAudioCompartido: AudioContext | null = null;
let gestoUsuarioDetectado = false;

function obtenerConstructorAudioContext(): typeof AudioContext | null {
  if (typeof window === "undefined") return null;
  return (
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext ||
    null
  );
}

/**
 * Comprueba si el navegador ya recibió un gesto del usuario para habilitar Web Audio
 * sin disparar advertencias de autoplay en consola.
 */
export function puedeIniciarAudioWeb(): boolean {
  if (typeof window === "undefined") return false;
  if (gestoUsuarioDetectado) return true;
  const activacion = (
    typeof navigator !== "undefined"
      ? (navigator as Navigator & { userActivation?: { hasBeenActive?: boolean } }).userActivation
      : undefined
  );
  if (activacion?.hasBeenActive) {
    gestoUsuarioDetectado = true;
    return true;
  }
  return false;
}

function obtenerContextoAudioSeguro(): AudioContext | null {
  if (!puedeIniciarAudioWeb()) return null;
  const VentanaAudio = obtenerConstructorAudioContext();
  if (!VentanaAudio) return null;
  if (!contextoAudioCompartido || contextoAudioCompartido.state === "closed") {
    contextoAudioCompartido = new VentanaAudio();
  }
  if (contextoAudioCompartido.state === "suspended") {
    void contextoAudioCompartido.resume().catch(() => {});
  }
  return contextoAudioCompartido;
}

/**
 * Sintetizador nativo Web Audio de respaldo para efectos de sonido 8-bit.
 * Reutiliza un único AudioContext tras interacción del usuario para evitar
 * advertencias de autoplay y el límite de 6 contextos de hardware del navegador.
 */
function sintetizarTonoRetro(nombre: string, volumen: number): void {
  try {
    const ctx = obtenerContextoAudioSeguro();
    if (!ctx || ctx.state === "suspended") return;
    const osc = ctx.createOscillator();
    const ganancia = ctx.createGain();
    osc.onended = () => {
      osc.disconnect();
      ganancia.disconnect();
    };
    osc.type = "square";
    ganancia.gain.setValueAtTime(Math.min(0.2, volumen * 0.2), ctx.currentTime);

    if (nombre === "click" || nombre === "seleccionar") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.05);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } else if (
      nombre === "exito" ||
      nombre === "confirmar" ||
      nombre === "victoria"
    ) {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.16);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.16);
    } else if (nombre === "error") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.12);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (nombre === "paso" || nombre === "explorar") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(160, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(90, ctx.currentTime + 0.08);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.08);
    } else if (nombre === "alerta" || nombre === "encuentro") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(330, ctx.currentTime);
      osc.frequency.setValueAtTime(660, ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(990, ctx.currentTime + 0.14);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (nombre === "botin" || nombre === "fanfarria") {
      osc.frequency.setValueAtTime(440, ctx.currentTime);
      osc.frequency.setValueAtTime(554.37, ctx.currentTime + 0.07);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.14);
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.21);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    } else if (nombre === "golpe" || nombre === "ataque" || nombre === "dano") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(180, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.12);
      ganancia.gain.setValueAtTime(Math.min(0.3, volumen * 0.3), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (nombre === "captura" || nombre === "atrapado") {
      osc.type = "square";
      osc.frequency.setValueAtTime(349.23, ctx.currentTime);
      osc.frequency.setValueAtTime(440.0, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(523.25, ctx.currentTime + 0.16);
      osc.frequency.setValueAtTime(698.46, ctx.currentTime + 0.24);
      ganancia.gain.setValueAtTime(Math.min(0.25, volumen * 0.25), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    } else if (nombre === "monedas" || nombre === "compra") {
      osc.type = "square";
      osc.frequency.setValueAtTime(987.77, ctx.currentTime);
      osc.frequency.setValueAtTime(1318.51, ctx.currentTime + 0.07);
      ganancia.gain.setValueAtTime(Math.min(0.2, volumen * 0.2), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.22);
    } else if (nombre === "curar" || nombre === "pocion") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.16);
      ganancia.gain.setValueAtTime(Math.min(0.22, volumen * 0.22), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.26);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.26);
    } else if (nombre === "santuario" || nombre === "bendicion") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.09);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.18);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.27);
      ganancia.gain.setValueAtTime(Math.min(0.25, volumen * 0.25), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.42);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.42);
    } else if (nombre === "dot") {
      // simplificacion: ruido blanco breve de quemadura/veneno desconectando nodos al finalizar en el contexto compartido
      const tamanoBuffer = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, tamanoBuffer, ctx.sampleRate);
      const salida = buffer.getChannelData(0);
      for (let i = 0; i < tamanoBuffer; i++) {
        salida[i] = Math.random() * 2 - 1;
      }
      const fuenteRuido = ctx.createBufferSource();
      fuenteRuido.buffer = buffer;
      const gananciaRuido = ctx.createGain();
      fuenteRuido.onended = () => {
        fuenteRuido.disconnect();
        gananciaRuido.disconnect();
      };
      gananciaRuido.gain.setValueAtTime(Math.min(0.2, volumen * 0.2), ctx.currentTime);
      gananciaRuido.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
      fuenteRuido.connect(gananciaRuido);
      gananciaRuido.connect(ctx.destination);
      fuenteRuido.start();
      return;
    } else if (nombre === "eficaz") {
      osc.type = "square";
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.05);
      ganancia.gain.setValueAtTime(Math.min(0.25, volumen * 0.25), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.12);
    } else if (nombre === "resistido") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(110, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(70, ctx.currentTime + 0.15);
      ganancia.gain.setValueAtTime(Math.min(0.15, volumen * 0.15), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.15);
    } else if (nombre === "furia") {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(523.25, ctx.currentTime);
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1);
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2);
      osc.frequency.setValueAtTime(1046.5, ctx.currentTime + 0.3);
      ganancia.gain.setValueAtTime(Math.min(0.28, volumen * 0.28), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.5);
    } else if (nombre === "velo") {
      osc.type = "triangle";
      osc.frequency.setValueAtTime(392.0, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(587.33, ctx.currentTime + 0.11);
      osc.frequency.exponentialRampToValueAtTime(783.99, ctx.currentTime + 0.24);
      ganancia.gain.setValueAtTime(Math.min(0.18, volumen * 0.18), ctx.currentTime);
      ganancia.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);
      osc.connect(ganancia);
      ganancia.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.28);
    }
  } catch {
    // simplificacion: silencio controlado si el navegador bloquea la Web Audio API; sin efectos colaterales en la UI.
  }
}

const CLAVE_SONIDO_SILENCIADO = "aethelgard_sonido_silenciado";

/**
 * Indica si los efectos de sonido retro están silenciados por el usuario.
 */
export function estaSonidoSilenciado(): boolean {
  try {
    return window.localStorage.getItem(CLAVE_SONIDO_SILENCIADO) === "1";
  } catch {
    return false;
  }
}

/**
 * Persiste la preferencia de silencio de audio retro en localStorage.
 */
export function establecerSonidoSilenciado(silenciado: boolean): void {
  try {
    window.localStorage.setItem(CLAVE_SONIDO_SILENCIADO, silenciado ? "1" : "0");
  } catch {
    // simplificacion: ignorar entornos sin localStorage
  }
  if (silenciado) {
    pausarIntervaloAmbiente();
  } else if (modoAmbienteDeseado) {
    arrancarLoopAmbiente(modoAmbienteDeseado);
  }
}

/**
 * Alterna entre sonido activo y silenciado, devolviendo el nuevo estado de silencio.
 */
export function alternarSonidoSilenciado(): boolean {
  const nuevoEstado = !estaSonidoSilenciado();
  establecerSonidoSilenciado(nuevoEstado);
  return nuevoEstado;
}

/**
 * Reproduce un efecto de sonido retro sintetizado fielmente con la Web Audio API (8-bit).
 * Al ser generado proceduralmente, garantiza latencia cero y elimina peticiones de red 404.
 */
export function reproducirSonido(nombre: string, volumen: number = 0.5): void {
  try {
    registrarListenerDesbloqueoAudio();
    if (estaSonidoSilenciado()) return;
    sintetizarTonoRetro(nombre, volumen);
  } catch {
    // simplificacion: silencio controlado si el navegador bloquea la Web Audio API.
  }
}

export type ModoMusicaAmbiente = "hub" | "combate";

let temporizadorAmbiente: number | null = null;
let modoAmbienteDeseado: ModoMusicaAmbiente | null = null;
let pasoAmbiente = 0;
let listenerDesbloqueoRegistrado = false;

const NOTAS_AMBIENTE_HUB = [261.63, 329.63, 392.0, 493.88, 392.0, 329.63, 293.66, 392.0];
const NOTAS_AMBIENTE_COMBATE = [220.0, 261.63, 329.63, 293.66, 220.0, 246.94, 329.63, 349.23];

function pausarIntervaloAmbiente(): void {
  if (temporizadorAmbiente !== null) {
    window.clearInterval(temporizadorAmbiente);
    temporizadorAmbiente = null;
  }
}

function tocarNotaSuaveAmbiente(modo: ModoMusicaAmbiente): void {
  if (estaSonidoSilenciado()) return;
  try {
    const ctx = obtenerContextoAudioSeguro();
    if (!ctx || ctx.state === "suspended") return;

    const ahora = ctx.currentTime;
    const notas = modo === "combate" ? NOTAS_AMBIENTE_COMBATE : NOTAS_AMBIENTE_HUB;
    const frecuencia = notas[pasoAmbiente % notas.length];
    pasoAmbiente += 1;

    const osc = ctx.createOscillator();
    const filtro = ctx.createBiquadFilter();
    const ganancia = ctx.createGain();

    osc.onended = () => {
      osc.disconnect();
      filtro.disconnect();
      ganancia.disconnect();
    };

    osc.type = modo === "combate" ? "triangle" : "sine";
    osc.frequency.setValueAtTime(frecuencia, ahora);

    filtro.type = "lowpass";
    filtro.frequency.setValueAtTime(modo === "combate" ? 680 : 540, ahora);

    const duracion = modo === "combate" ? 0.48 : 0.85;
    const picoVolumen = modo === "combate" ? 0.032 : 0.028;

    ganancia.gain.setValueAtTime(0.0001, ahora);
    ganancia.gain.linearRampToValueAtTime(picoVolumen, ahora + 0.08);
    ganancia.gain.exponentialRampToValueAtTime(0.0001, ahora + duracion);

    osc.connect(filtro);
    filtro.connect(ganancia);
    ganancia.connect(ctx.destination);

    osc.start(ahora);
    osc.stop(ahora + duracion + 0.02);
  } catch {
    // simplificacion: ignorar bloqueos de autoplay
  }
}

function arrancarLoopAmbiente(modo: ModoMusicaAmbiente): void {
  pausarIntervaloAmbiente();
  if (typeof window === "undefined" || estaSonidoSilenciado() || !puedeIniciarAudioWeb()) return;

  const intervaloMs = modo === "combate" ? 440 : 780;
  tocarNotaSuaveAmbiente(modo);
  temporizadorAmbiente = window.setInterval(() => {
    tocarNotaSuaveAmbiente(modo);
  }, intervaloMs);
}

function registrarListenerDesbloqueoAudio(): void {
  if (typeof window === "undefined" || listenerDesbloqueoRegistrado) return;
  listenerDesbloqueoRegistrado = true;
  const desbloquear = () => {
    gestoUsuarioDetectado = true;
    const ctx = obtenerContextoAudioSeguro();
    if (ctx && ctx.state === "suspended") {
      void ctx.resume().then(() => {
        if (modoAmbienteDeseado && !estaSonidoSilenciado() && temporizadorAmbiente === null) {
          arrancarLoopAmbiente(modoAmbienteDeseado);
        }
      }).catch(() => {});
      return;
    }
    if (modoAmbienteDeseado && !estaSonidoSilenciado() && temporizadorAmbiente === null) {
      arrancarLoopAmbiente(modoAmbienteDeseado);
    }
  };
  window.addEventListener("pointerdown", desbloquear, { passive: true });
  window.addEventListener("keydown", desbloquear, { passive: true });
}

/**
 * Inicia un acompañamiento ambiental suave (modo "hub" o "combate") respetando el estado de silencio
 * y esperando la primera interacción del usuario para evitar advertencias de autoplay en consola.
 */
export function iniciarMusicaAmbiente(modo: ModoMusicaAmbiente): void {
  if (typeof window === "undefined") return;
  modoAmbienteDeseado = modo;
  pasoAmbiente = 0;

  registrarListenerDesbloqueoAudio();

  if (!estaSonidoSilenciado() && puedeIniciarAudioWeb()) {
    arrancarLoopAmbiente(modo);
  }
}

/**
 * Detiene el acompañamiento ambiental activo.
 */
export function detenerMusicaAmbiente(): void {
  modoAmbienteDeseado = null;
  pausarIntervaloAmbiente();
}
