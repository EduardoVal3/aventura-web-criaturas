import { useState, useEffect } from "react";
import { RUTAS_PLACEHOLDERS, sanitizarSlugZona } from "@/lib/assets";
import { cn } from "@/lib/utils";

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
   * Punto focal CSS object-position (ej. "53% 56%") para alinear plataformas en desktop y móvil.
   */
  objectPosition?: string;
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

interface TemaEscenario25D {
  cielo: string;
  acento: string;
  sueloPrincipal: string;
  rejilla: string;
}

function resolverTemaEscenario(zoneId?: string | null): TemaEscenario25D {
  const slug = sanitizarSlugZona(zoneId);
  if (slug.includes("cueva") || slug.includes("volcan")) {
    return {
      cielo: "from-[#1a090d] via-[#2b1015] to-[#090d16]",
      acento: "#fb923c",
      sueloPrincipal: "rgba(127, 29, 29, 0.35)",
      rejilla: "rgba(251, 146, 60, 0.28)",
    };
  }
  if (slug.includes("pico") || slug.includes("cumbre") || slug.includes("glaciar")) {
    return {
      cielo: "from-[#0a1829] via-[#132942] to-[#090d16]",
      acento: "#7dd3fc",
      sueloPrincipal: "rgba(30, 58, 138, 0.32)",
      rejilla: "rgba(125, 211, 252, 0.3)",
    };
  }
  if (slug.includes("bosque") || slug.includes("pradera")) {
    return {
      cielo: "from-[#091a12] via-[#112a1d] to-[#090d16]",
      acento: "#34d399",
      sueloPrincipal: "rgba(20, 83, 45, 0.32)",
      rejilla: "rgba(52, 211, 153, 0.25)",
    };
  }
  // Por defecto: Caverna rúnica cian (estilo dark-fantasy)
  return {
    cielo: "from-[#071124] via-[#0d1f3a] to-[#090d16]",
    acento: "#14d1e8",
    sueloPrincipal: "rgba(14, 116, 144, 0.25)",
    rejilla: "rgba(20, 209, 232, 0.32)",
  };
}

/**
 * Componente desacoplado para la renderización del escenario de batalla (Battlefield Background System).
 * Resuelve la imagen con fallback en cascada: webp de zona -> caverna cristal svg -> placeholder zona svg.
 * Garantiza visibilidad en el stacking context (z-0 en lugar de -z-10 para evitar ocultarse tras el fondo del contenedor).
 */
export function BattlefieldBackground({
  zoneId,
  backgroundUrl,
  videoUrl,
  objectPosition = "50% 50%",
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
    if (/\.webp$/i.test(fuenteActual)) {
      setFuenteActual(fuenteActual.replace(/\.webp$/i, ".png"));
      return;
    }
    if (/\.png$/i.test(fuenteActual)) {
      setFuenteActual(fuenteActual.replace(/\.png$/i, ".jpg"));
      return;
    }
    if (/\.jpg$/i.test(fuenteActual)) {
      setFuenteActual(fuenteActual.replace(/\.jpg$/i, ".jpeg"));
      return;
    }
    if (pasoFallback === 0) {
      setPasoFallback(1);
      setFuenteActual(FONDO_POR_DEFECTO);
    } else if (pasoFallback === 1) {
      setPasoFallback(2);
      setFuenteActual(FONDO_PLACEHOLDER_ZONA);
    }
  };

  const tema = resolverTemaEscenario(zoneId);

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden select-none bg-[#090d16]",
        !className.includes("flex-1") && "h-full",
        className,
      )}
      data-testid="battlefield-background"
    >
      {/* 1. Capa de Video o Imagen Base (si existe WebP real de zona) */}
      {videoUrl ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          style={{ objectPosition }}
          className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none"
          src={videoUrl}
        />
      ) : (
        <img
          src={fuenteActual}
          alt="Escenario de combate"
          onError={manejarError}
          style={{ objectPosition }}
          className={`absolute inset-0 w-full h-full object-cover z-0 pixelated pointer-events-none ${
            pasoFallback > 0 ? "opacity-35" : "opacity-100"
          }`}
        />
      )}

      {/* 2. Escenario 2.5D Procedural solo cuando no hay ilustración WebP real */}
      {pasoFallback > 0 && !videoUrl && (
        <>
          <div
            aria-hidden="true"
            className={`absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b ${tema.cielo} opacity-90`}
          />

          {/* Columnas rúnicas laterales en perspectiva */}
          <div aria-hidden="true" className="absolute inset-x-0 top-0 bottom-[28%] z-[1] pointer-events-none overflow-hidden">
            <div
              className="absolute left-3 sm:left-8 top-8 bottom-0 w-7 sm:w-11 border-2 border-black bg-[#0d1726]/85 shadow-[4px_0_0_#000]"
              style={{ boxShadow: `inset 0 0 12px ${tema.rejilla}, 4px 0 0 #000` }}
            >
              <div
                className="mx-auto mt-6 w-2 sm:w-3 h-12 sm:h-16 opacity-80"
                style={{ backgroundColor: tema.acento, boxShadow: `0 0 14px ${tema.acento}` }}
              />
            </div>
            <div
              className="absolute right-3 sm:right-8 top-10 bottom-0 w-6 sm:w-10 border-2 border-black bg-[#0d1726]/85 shadow-[-4px_0_0_#000]"
              style={{ boxShadow: `inset 0 0 12px ${tema.rejilla}, -4px 0 0 #000` }}
            >
              <div
                className="mx-auto mt-8 w-2 sm:w-2.5 h-10 sm:h-14 opacity-75"
                style={{ backgroundColor: tema.acento, boxShadow: `0 0 14px ${tema.acento}` }}
              />
            </div>
          </div>

          {/* Suelo 2.5D con fuga en perspectiva CSS */}
          <div
            aria-hidden="true"
            className="absolute inset-x-[-20%] bottom-[-8%] h-[58%] z-[2] pointer-events-none overflow-hidden"
            style={{ perspective: "460px" }}
          >
            <div
              className="w-full h-full border-t-2"
              style={{
                transform: "rotateX(58deg)",
                transformOrigin: "bottom center",
                borderColor: tema.acento,
                backgroundColor: tema.sueloPrincipal,
                backgroundImage: `linear-gradient(to right, ${tema.rejilla} 2px, transparent 2px), linear-gradient(to bottom, ${tema.rejilla} 2px, transparent 2px)`,
                backgroundSize: "52px 52px",
                boxShadow: `inset 0 24px 48px rgba(0,0,0,0.65)`,
              }}
            />
          </div>
        </>
      )}

      {/* 3. Viñeta sutil para legibilidad de HUDs sobre la ilustración real */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45 pointer-events-none z-[3]"
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
