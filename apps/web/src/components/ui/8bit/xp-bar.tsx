import { type BitProgressProps, Progress } from "@/components/ui/8bit/progress";
import { cn } from "@/lib/utils";

export interface XpBarProps extends React.ComponentProps<"div"> {
  className?: string;
  props?: BitProgressProps;
  variant?: "retro" | "default";
  value?: number;
  levelUpMessage?: string;
}

export default function XpBar({
  className,
  variant = "retro",
  value = 0,
  levelUpMessage = "¡SUBIÓ DE NIVEL!",
  props: bitProps,
  ...props
}: XpBarProps) {
  const isLevelUp = (value ?? 0) >= 100;
  const clampedValue = Math.min(100, Math.max(0, value ?? 0));

  return (
    <div className={cn("relative transition-all duration-300", className)}>
      <Progress
        {...props}
        value={clampedValue}
        variant={variant}
        className={cn(isLevelUp && "anim-pulso-turno")}
        progressBg={bitProps?.progressBg || "bg-experiencia-xp"}
      />
      {isLevelUp && (
        <div
          className={cn(
            "retro",
            "absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2",
            "text-[0.625rem] text-primary-foreground font-bold",
            "pointer-events-none whitespace-nowrap z-10",
            "bg-pixel-dorado px-2 py-0.5 border border-pixel",
            "drop-shadow-[1px_1px_0_#000] [text-shadow:1px_1px_0_#000,-1px_-1px_0_#000,1px_-1px_0_#000,-1px_1px_0_#000]",
            "animate-pulse"
          )}
        >
          {levelUpMessage}
        </div>
      )}
    </div>
  );
}
