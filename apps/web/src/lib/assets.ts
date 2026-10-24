/**
 * Utilidades para la resolución de recursos multimedia locales y retro en Aethelgard.
 * Los archivos generados en Google Flow se colocan en /assets/[tipo]/[slug].webp.
 * Si el archivo aún no existe, resuelve hacia los placeholders SVG sin romper la UI.
 */

export const RUTAS_PLACEHOLDERS = {
  criatura: '/assets/placeholder-criatura.svg',
  zona: '/assets/placeholder-zona.svg',
  objeto: '/assets/placeholder-objeto.svg',
} as const;

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
  const fallback = RUTAS_PLACEHOLDERS[tipo] || RUTAS_PLACEHOLDERS.criatura;
  // Desconectar el handler para prevenir bucles si el recurso o fallback falla
  img.onerror = null;
  if (img.src !== fallback && !img.src.endsWith(fallback)) {
    img.src = fallback;
  }
}

/**
 * Sintetizador nativo Web Audio de respaldo para efectos de sonido 8-bit.
 */
function sintetizarTonoRetro(nombre: string, volumen: number): void {
  try {
    const ventanaAudio =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;
    if (!ventanaAudio) return;
    const ctx = new ventanaAudio();
    const osc = ctx.createOscillator();
    osc.onended = () => void ctx.close();
    const ganancia = ctx.createGain();
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
      // simplificacion: ruido blanco breve de quemadura/veneno cerrando el contexto en onended
      const tamanoBuffer = Math.floor(ctx.sampleRate * 0.18);
      const buffer = ctx.createBuffer(1, tamanoBuffer, ctx.sampleRate);
      const salida = buffer.getChannelData(0);
      for (let i = 0; i < tamanoBuffer; i++) {
        salida[i] = Math.random() * 2 - 1;
      }
      const fuenteRuido = ctx.createBufferSource();
      fuenteRuido.buffer = buffer;
      fuenteRuido.onended = () => void ctx.close();
      const gananciaRuido = ctx.createGain();
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
    }
  } catch {
    // simplificacion: silencio controlado si el navegador bloquea la Web Audio API; sin efectos colaterales en la UI.
  }
}

/**
 * Reproduce un efecto de sonido retro sintetizado fielmente con la Web Audio API (8-bit).
 * Al ser generado proceduralmente, garantiza latencia cero y elimina peticiones de red 404.
 */
export function reproducirSonido(nombre: string, volumen: number = 0.5): void {
  try {
    sintetizarTonoRetro(nombre, volumen);
  } catch {
    // simplificacion: silencio controlado si el navegador bloquea la Web Audio API.
  }
}

