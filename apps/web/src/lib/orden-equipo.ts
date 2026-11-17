/**
 * Devuelve una copia de `ids` con el elemento de `desde` reubicado en `hacia`;
 * índices fuera de rango devuelven la copia sin cambios.
 */
export function moverEnLista<T>(ids: readonly T[], desde: number, hacia: number): T[] {
  if (
    desde < 0 ||
    desde >= ids.length ||
    hacia < 0 ||
    hacia >= ids.length ||
    desde === hacia
  ) {
    return [...ids];
  }

  const copia = [...ids];
  const [elemento] = copia.splice(desde, 1);
  copia.splice(hacia, 0, elemento);
  return copia;
}
