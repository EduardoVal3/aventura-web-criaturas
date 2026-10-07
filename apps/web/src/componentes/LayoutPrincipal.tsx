import { Link, NavLink, Outlet } from "react-router";

export function LayoutPrincipal() {
  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground antialiased selection:bg-primary selection:text-primary-foreground max-w-full overflow-x-hidden">
      <header className="border-b border-border bg-card/80 backdrop-blur-xs sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/hub"
            className="text-lg sm:text-xl font-bold tracking-wider text-primary retro hover:opacity-90 transition-opacity"
          >
            Aethelgard
          </Link>
          <nav className="flex items-center gap-3 sm:gap-4 text-xs sm:text-sm" aria-label="Navegación principal">
            <NavLink
              to="/kit-ui"
              className={({ isActive }) =>
                `px-2 py-1 rounded transition-colors ${
                  isActive
                    ? "text-primary font-semibold underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Kit de interfaz
            </NavLink>
            <NavLink
              to="/creditos"
              className={({ isActive }) =>
                `px-2 py-1 rounded transition-colors ${
                  isActive
                    ? "text-primary font-semibold underline underline-offset-4"
                    : "text-muted-foreground hover:text-foreground"
                }`
              }
            >
              Créditos
            </NavLink>
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        <Outlet />
      </main>

      <footer className="border-t border-border bg-card px-4 py-4 sm:px-6 text-center text-xs text-muted-foreground">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 Aethelgard · Proyecto Integrador ISC-305</p>
          <nav aria-label="Enlaces al pie">
            <Link to="/creditos" className="hover:text-foreground transition-colors underline underline-offset-2">
              Créditos y licencias
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}

export default LayoutPrincipal;
