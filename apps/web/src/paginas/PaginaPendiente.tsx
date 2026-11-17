interface PropsPaginaPendiente {
  titulo: string;
}

export function PaginaPendiente({ titulo }: PropsPaginaPendiente) {
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight retro">{titulo}</h1>
      <p className="text-muted-foreground text-sm sm:text-base">
        Esta sección estará disponible próximamente en Aethelgard.
      </p>
    </section>
  );
}

export default PaginaPendiente;
