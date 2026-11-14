import { useEffect, useState } from "react";
import { type BitProgressProps, Progress } from "@/components/ui/8bit/progress";
import { cn } from "@/lib/utils";

export interface HealthBarProps extends React.ComponentProps<"div"> {
  className?: string;
  props?: BitProgressProps;
  variant?: "retro" | "default";
  value?: number;
}

// Alias para preservar compatibilidad con código existente
export type ManaBarProps = HealthBarProps;

export default function HealthBar({
  className,
  variant = "retro",
  value = 100,
  props: bitProgressProps,
  ...props
}: HealthBarProps) {
  // Regla del Semáforo de Supervivencia (docs/DESIGN.md):
  // > 50%: Verde esmeralda (salud-alta)
  // 20% - 50%: Ámbar dorado (salud-media)
  // <= 20%: Rojo carmesí crítico (salud-critica)
  const colorReactivo =
    bitProgressProps?.progressBg ||
    (value > 50
      ? "bg-salud-alta"
      : value > 20
        ? "bg-salud-media"
        : "bg-salud-critica");

  const esCritico = value <= 20 && value > 0;
  const [estela, setEstela] = useState(value);

  useEffect(() => {
    if (value >= estela) {
      setEstela(value);
      return;
    }
    const id = window.setTimeout(() => {
      setEstela(value);
    }, 180);
    return () => window.clearTimeout(id);
  }, [value, estela]);

  const porcentajeEstela = Math.max(0, Math.min(100, estela));

  return (
    <div className="relative w-full">
      {porcentajeEstela > value && (
        <div
          aria-hidden="true"
          style={{ width: `${porcentajeEstela}%` }}
          className="pointer-events-none absolute inset-y-0 left-0 bg-amber-400/70 transition-all duration-500 ease-out z-0"
        />
      )}
      <Progress
        {...props}
        value={value}
        variant={variant}
        className={cn(
          "relative z-10 transition-all duration-300",
          esCritico && "anim-pulso-critico",
          className
        )}
        progressBg={colorReactivo}
      />
    </div>
  );
}
