import { Link, NavLink, Outlet, useLocation } from "react-router";
import { Toaster } from "@/components/ui/sonner";
import { reproducirSonido } from "@/lib/assets";

export function LayoutPrincipal() {
  const location = useLocation();
  const esCombate = location.pathname.startsWith("/combate");
  const esHub = location.pathname === "/hub" || location.pathname.startsWith("/hub/");

  if (esCombate || esHub) {
    return (
      <div className="h-screen h-[100dvh] w-full overflow-hidden bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground max-w-full">
        <Outlet />
        <Toaster />
      </div>
    );
  }

  // simplificacion: retroalimentación sonora centralizada a volumen 0.3 para preservar ergonomía auditiva sin saturar
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground max-w-full overflow-x-hidden">
      <header className="border-b-4 border-black bg-card/95 shadow-[0_4px_0_0_#000] sticky top-0 z-40 px-2.5 py-1.5 sm:px-6 sm:py-2.5 backdrop-blur-xs">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2 sm:gap-4 w-full">
          <Link
            to="/hub"
            onClick={() => reproducirSonido("click", 0.3)}
            className="text-[10px] sm:text-base md:text-lg font-bold tracking-tight sm:tracking-wider text-primary retro drop-shadow-[1px_1px_0_#000] hover:text-primary/90 transition-colors shrink-0"
          >
            Aethelgard
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3 shrink-0" aria-label="Navegación principal">
            <NavLink
              to="/kit-ui"
              onClick={() => reproducirSonido("click", 0.3)}
              className={({ isActive }) =>
                `retro text-[7.5px] sm:text-[9px] md:text-[10px] tracking-tight sm:tracking-wider h-7 sm:h-9 px-2 sm:px-3 py-1 sm:py-1.5 inline-flex items-center justify-center border-2 border-black whitespace-nowrap transition-all select-none ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_#000] translate-y-0"
                    : "bg-background text-muted-foreground shadow-[2px_2px_0_0_#000] hover:text-foreground hover:border-primary active:translate-y-0.5 active:shadow-none"
                }`
              }
            >
              <span className="hidden sm:inline">Kit de interfaz</span>
              <span className="sm:hidden">Kit UI</span>
            </NavLink>
            <NavLink
              to="/creditos"
              onClick={() => reproducirSonido("click", 0.3)}
              className={({ isActive }) =>
                `retro text-[7.5px] sm:text-[9px] md:text-[10px] tracking-tight sm:tracking-wider h-7 sm:h-9 px-2 sm:px-3 py-1 sm:py-1.5 inline-flex items-center justify-center border-2 border-black whitespace-nowrap transition-all select-none ${
                  isActive
                    ? "bg-primary text-primary-foreground font-bold shadow-[2px_2px_0_0_#000] translate-y-0"
                    : "bg-background text-muted-foreground shadow-[2px_2px_0_0_#000] hover:text-foreground hover:border-primary active:translate-y-0.5 active:shadow-none"
                }`
              }
            >
              Créditos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="p-3 sm:p-6 lg:p-8 flex-1 max-w-6xl w-full mx-auto">
        <Outlet />
      </main>

      <footer className="border-t-4 border-black bg-card/95 shadow-[0_-4px_0_0_#000] px-3 py-4 sm:px-6 sm:py-5 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex flex-col sm:flex-row items-center sm:items-baseline gap-1 sm:gap-2">
            <span className="retro text-[8px] sm:text-[9px] text-foreground/90 font-bold tracking-tight">
              (c) 2026 Aethelgard
            </span>
            <span className="hidden sm:inline text-muted-foreground/60 text-[8px]">·</span>
            <span className="retro text-[7px] sm:text-[8px] text-muted-foreground/80 tracking-tight break-words">
              Proyecto Integrador ISC-305
            </span>
          </div>
          <nav className="flex items-center justify-center gap-4 sm:gap-6" aria-label="Enlaces al pie">
            <Link
              to="/kit-ui"
              onClick={() => reproducirSonido("click", 0.3)}
              className="retro text-[7.5px] sm:text-[9px] text-muted-foreground hover:text-primary transition-all px-2.5 py-1 sm:px-3 sm:py-1.5 border border-black/80 bg-background/60 hover:bg-background shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:translate-y-0.5 select-none"
            >
              Kit de interfaz
            </Link>
            <Link
              to="/creditos"
              onClick={() => reproducirSonido("click", 0.3)}
              className="retro text-[7.5px] sm:text-[9px] text-muted-foreground hover:text-primary transition-all px-2.5 py-1 sm:px-3 sm:py-1.5 border border-black/80 bg-background/60 hover:bg-background shadow-[1px_1px_0_0_#000] hover:shadow-[2px_2px_0_0_#000] active:translate-y-0.5 select-none"
            >
              Créditos y licencias
            </Link>
          </nav>
        </div>
      </footer>
      <Toaster />
    </div>
  );
}

export default LayoutPrincipal;
