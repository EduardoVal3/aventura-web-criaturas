import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { AdaptadorCriaturasExternas } from './adaptador-criaturas-externas.service';
import {
  calcularHpBase,
  calcularAtaqueBase,
  calcularDefensaBase,
  calcularVelocidadBase,
  calcularTasaCaptura,
  calcularPoderAtaque,
} from './normalizador-criaturas.util';

describe('AdaptadorCriaturasExternas y Normalizador', () => {
  const adaptador = new AdaptadorCriaturasExternas();

  it('Prueba 1: normaliza correctamente las estadísticas de lobo-gris', () => {
    // Valores de catálogo para srd-2024_wolf (docs/catalogo-criaturas.md §2)
    const hp = calcularHpBase(11);
    const ataque = calcularAtaqueBase(5.5);
    const defensa = calcularDefensaBase(12);
    const velocidad = calcularVelocidadBase(40);
    const tasa = calcularTasaCaptura(0.25);

    assert.strictEqual(hp, 30, 'hpBase debe ser 30');
    assert.strictEqual(ataque, 42, 'ataqueBase debe ser 42');
    assert.strictEqual(defensa, 58, 'defensaBase debe ser 58');
    assert.strictEqual(velocidad, 50, 'velocidadBase debe ser 50');
    assert.strictEqual(tasa, 0.88, 'tasaCaptura debe ser 0.88');

    // Mapeo crudo a DTO
    const dto = adaptador.mapearACriaturaExternaDto({
      key: 'srd-2024_wolf',
      name: 'Wolf',
      type: { key: 'beast', name: 'Beast' },
      challenge_rating: 0.25,
      hit_points: 11,
      armor_class: 12,
      speed_all: { walk: 40, swim: 20 },
      actions: [
        {
          name: 'Bite',
          attacks: [
            {
              damage_die_count: 1,
              damage_die_type: 'D6',
              damage_bonus: 2,
            },
          ],
        },
      ],
    });

    assert.strictEqual(dto.idExterno, 'srd-2024_wolf');
    assert.strictEqual(dto.hitPoints, 11);
    assert.strictEqual(dto.armorClass, 12);
    assert.strictEqual(dto.speedMax, 40);
    assert.strictEqual(dto.ataques.length, 1);
    assert.strictEqual(dto.ataques[0].nombreOriginal, 'Bite');
    assert.strictEqual(dto.ataques[0].poder, 5.5);
  });

  it('Prueba 2: tolera y calcula correctamente el poder ante damage_bonus null', () => {
    // simplificacion: un ataque sin bono trata null como 0
    const poder1 = calcularPoderAtaque(1, 'D6', null);
    assert.strictEqual(poder1, 3.5, '1d6 con bonus null debe ser 3.5');

    const poder2 = calcularPoderAtaque(2, 'D8', null);
    assert.strictEqual(poder2, 9, '2d8 con bonus null debe ser 9.0');
  });

  it('Prueba 3: activa el fallback al snapshot local ante falla simulada de red', async () => {
    const fetchOriginal = globalThis.fetch;
    try {
      // Simular error de red en tiempo de ejecución
      globalThis.fetch = async () => {
        throw new Error('Falla de red simulada para prueba unitaria');
      };

      const resultado = await adaptador.obtenerEspeciesSeleccionadas(['srd-2024_wolf']);
      assert.strictEqual(resultado.length, 1, 'Debe retornar la especie desde el snapshot');
      assert.strictEqual(resultado[0].idExterno, 'srd-2024_wolf');
      assert.strictEqual(resultado[0].hitPoints, 11);
    } finally {
      globalThis.fetch = fetchOriginal;
    }
  });
});
