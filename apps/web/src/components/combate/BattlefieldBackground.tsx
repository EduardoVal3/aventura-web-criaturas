import { useState, useEffect } from "react";
import { RUTAS_PLACEHOLDERS, sanitizarSlugZona } from "@/lib/assets";

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
const FONDO_PLACEHOLDER_ZONA = RUTAS_PLACEHOLDERS.zona;

/**
 * Componente desacoplado para la renderización del escenario de batalla (Battlefield Background System).
 * Resuelve la imagen con fallback en cascada: webp de zona -> caverna cristal svg -> placeholder zona svg.
 * Garantiza visibilidad en el stacking context (z-0 en lugar de -z-10 para evitar ocultarse tras el fondo del contenedor).
 */
export function BattlefieldBackground({
  zoneId,
  backgroundUrl,
  videoUrl,
  className = "",
  children,
}: BattlefieldBackgroundProps) {
  // Nivel de fallback: 0 = fuente inicial, 1 = caverna cristal svg, 2 = placeholder zona svg
  const [pasoFallback, setPasoFallback] = useState(0);

  const fuenteInicial =
    backgroundUrl ||
    (zoneId && zoneId.trim().length > 0 && zoneId !== "encuentro"
      ? `/assets/battlegrounds/${sanitizarSlugZona(zoneId)}.webp`
      : FONDO_POR_DEFECTO);

  const [fuenteActual, setFuenteActual] = useState(fuenteInicial);

  useEffect(() => {
    setPasoFallback(0);
    setFuenteActual(fuenteInicial);
  }, [fuenteInicial]);

  const manejarError = () => {
    if (pasoFallback === 0) {
      setPasoFallback(1);
      setFuenteActual(FONDO_POR_DEFECTO);
    } else if (pasoFallback === 1) {
      setPasoFallback(2);
      setFuenteActual(FONDO_PLACEHOLDER_ZONA);
    }
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden select-none bg-[#090d16] ${className}`}
      data-testid="battlefield-background"
    >
      {/* 1. Capa de Video Animado Ligero si se especifica */}
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          src={videoUrl}
        />
      ) : (
        /* 2. Capa de Imagen SVG / WebP con z-0 visible */
        <img
          src={fuenteActual}
          alt="Escenario de combate"
          onError={manejarError}
          className="absolute inset-0 w-full h-full object-cover z-0 pixelated pointer-events-none"
        />
      )}

      {/* 3. Capa de viñeta y gradiente para garantizar legibilidad de HUDs y sprites pixel-art */}
      <div
        className="absolute inset-0 bg-black/25 mix-blend-multiply pointer-events-none z-[1]"
        aria-hidden="true"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/60 pointer-events-none z-[1]"
        aria-hidden="true"
      />

      {/* 4. Contenido de la arena montado encima con z-10 */}
      <div className="relative z-10 w-full h-full flex flex-col justify-between">
        {children}
      </div>
    </div>
  );
}

export default BattlefieldBackground;
