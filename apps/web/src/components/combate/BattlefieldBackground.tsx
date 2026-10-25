import { useState } from "react";
import { sanitizarSlugZona } from "@/lib/assets";

export interface BattlefieldBackgroundProps {
  /**
   * Identificador o slug de la zona para resolver el fondo temático.
   */
  zoneId?: string | null;
  /**
   * URL directa a imagen estática o .webp animado.
   */
  backgroundUrl?: string | null;
  /**
   * URL opcional de bucle animado liviano (.mp4) para fondos dinámicos.
   */
  videoUrl?: string | null;
  /**
   * Clases adicionales para el contenedor raíz.
   */
  className?: string;
  /**
   * Elementos hijos que conviven sobre la arena con z-index superior.
   */
  children?: React.ReactNode;
}

const FONDO_POR_DEFECTO = "/assets/battlegrounds/caverna-cristal.svg";

/**
 * Componente desacoplado para la renderización del escenario de batalla (Battlefield Background System).
 * Soporta loops de video, imágenes optimizadas (.webp) y degradación fluida hacia SVG canónico.
 */
export function BattlefieldBackground({
  zoneId,
  backgroundUrl,
  videoUrl,
  className = "",
  children,
}: BattlefieldBackgroundProps) {
  const [errorCarga, setErrorCarga] = useState(false);

  // Resolución de la fuente visual priorizando prop directa, slug de zona o fallback de cristal
  const fuenteImagen = errorCarga
    ? FONDO_POR_DEFECTO
    : backgroundUrl ||
      (zoneId
        ? `/assets/battlegrounds/${sanitizarSlugZona(zoneId)}.webp`
        : FONDO_POR_DEFECTO);

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none ${className}`}
      data-testid="battlefield-background"
    >
      {/* 1. Capa de Video Animado Ligero si se especifica */}
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover -z-10"
          src={videoUrl}
        />
      ) : (
        /* 2. Capa de Imagen (.webp estático/animado o SVG retro) */
        <img
          src={fuenteImagen}
          alt="Escenario de combate"
          onError={() => {
            // simplificacion: si falla el archivo webp de zona, degradar al SVG canónico de caverna de cristal
            if (!errorCarga) setErrorCarga(true);
          }}
          className="absolute inset-0 w-full h-full object-cover -z-10 pixelated pointer-events-none"
        />
      )}

      {/* 3. Capa de viñeta y gradiente para garantizar legibilidad de HUDs y sprites pixel-art */}
      <div
        className="absolute inset-0 bg-black/30 mix-blend-multiply pointer-events-none z-0"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-0"
        aria-hidden="true"
      />

      {/* 4. Contenido de la arena montado encima */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

export default BattlefieldBackground;
