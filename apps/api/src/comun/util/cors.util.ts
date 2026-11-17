/**
 * Normaliza y valida los orígenes autorizados para CORS desde la variable `CORS_ORIGEN`.
 * Auditoría S-7: admite múltiples orígenes separados por coma y rechaza el comodín universal `*`.
 */
export function resolverOrigenesCors(valorRaw?: string): string | string[] {
  const lista = (valorRaw ?? '')
    .split(',')
    .map((origen) => origen.trim().replace(/\/+$/, ''))
    .filter((origen) => origen.length > 0 && origen !== '*');

  if (lista.length === 0) {
    return 'http://localhost:5173';
  }

  return lista.length === 1 ? lista[0] : lista;
}
