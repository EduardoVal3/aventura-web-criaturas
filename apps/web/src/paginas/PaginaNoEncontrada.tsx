import { Link } from "react-router";

export function PaginaNoEncontrada() {
  return (
    <section className="space-y-4 py-12 text-center">
      <h1 className="text-3xl sm:text-4xl font-bold retro text-destructive">
        Página no encontrada
      </h1>
      <p className="text-muted-foreground text-sm sm:text-base">
        La ruta solicitada no existe en el reino de Aethelgard.
      </p>
      <div>
        <Link
          to="/ingreso"
          className="inline-block mt-4 text-primary hover:underline font-semibold text-sm"
        >
          Volver a la pantalla de ingreso
        </Link>
      </div>
    </section>
  );
}

export default PaginaNoEncontrada;
