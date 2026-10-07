interface PropsPaginaPendiente {
  titulo: string;
}

export function PaginaPendiente({ titulo }: PropsPaginaPendiente) {
  return (
    <section className="space-y-4 py-8">
      <h1 className="text-2xl sm:text-3xl font-bold tracking-tight retro">{titulo}</h1>
      <p className="text-muted-foreground text-sm sm:text-base">
        Esta pantalla se construye en la Fase 3.
      </p>
    </section>
  );
}

export default PaginaPendiente;
