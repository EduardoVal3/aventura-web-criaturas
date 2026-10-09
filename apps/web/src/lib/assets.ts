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
  const fallback = RUTAS_PLACEHOLDERS[tipo];
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
    }
  } catch {
    // simplificacion: silencio controlado si el navegador bloquea la Web Audio API
  }
}

/**
 * Reproduce un efecto de sonido retro si está disponible en /assets/sonidos/[nombre].mp3.
 * Si no está disponible o falla, degrada limpiamente a síntesis retro 8-bit nativa.
 */
export function reproducirSonido(nombre: string, volumen: number = 0.5): void {
  try {
    const audio = new Audio(`/assets/sonidos/${nombre}.mp3`);
    audio.volume = Math.max(0, Math.min(1, volumen));
    const promesa = audio.play();
    if (promesa) {
      promesa.catch(() => {
        sintetizarTonoRetro(nombre, volumen);
      });
    }
  } catch {
    sintetizarTonoRetro(nombre, volumen);
  }
}

