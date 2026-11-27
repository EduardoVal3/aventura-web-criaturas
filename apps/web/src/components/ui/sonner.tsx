import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "dark" } = useTheme();

  return (
    <Sonner
      theme={(theme === "system" ? "dark" : theme) as ToasterProps["theme"]}
      className="toaster group aethelgard-toaster"
      icons={{
        success: <CircleCheckIcon className="size-4 text-emerald-400 shrink-0" />,
        info: <InfoIcon className="size-4 text-[#14d1e8] shrink-0" />,
        warning: <TriangleAlertIcon className="size-4 text-amber-400 shrink-0" />,
        error: <OctagonXIcon className="size-4 text-rose-400 shrink-0" />,
        loading: <Loader2Icon className="size-4 text-[#14d1e8] animate-spin shrink-0" />,
      }}
      style={
        {
          "--normal-bg": "hsl(222, 40%, 12%)",
          "--normal-text": "hsl(45, 29%, 95%)",
          "--normal-border": "hsl(187, 85%, 53%)",
          "--border-radius": "0px",
          "--font-family": "var(--font-pixel, 'Press Start 2P', monospace)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast: "cn-toast aethelgard-toast",
          title: "retro aethelgard-toast-title",
          description: "aethelgard-toast-description",
          icon: "aethelgard-toast-icon",
          actionButton: "retro aethelgard-toast-action",
          cancelButton: "retro aethelgard-toast-cancel",
          closeButton: "aethelgard-toast-close",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
