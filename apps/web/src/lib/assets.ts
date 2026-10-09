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
 * Reproduce un efecto de sonido retro si está disponible en /assets/sonidos/[nombre].mp3
 */
export function reproducirSonido(nombre: string, volumen: number = 0.5): void {
  try {
    const audio = new Audio(`/assets/sonidos/${nombre}.mp3`);
    audio.volume = Math.max(0, Math.min(1, volumen));
    audio.play().catch(() => {
      // Ignorar restricciones de reproducción automática del navegador
    });
  } catch {
    // Entorno sin soporte de Audio
  }
}
