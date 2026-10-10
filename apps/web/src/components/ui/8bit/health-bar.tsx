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

  return (
    <Progress
      {...props}
      value={value}
      variant={variant}
      className={cn(
        "transition-all duration-300",
        esCritico && "anim-pulso-critico",
        className
      )}
      progressBg={colorReactivo}
    />
  );
}
