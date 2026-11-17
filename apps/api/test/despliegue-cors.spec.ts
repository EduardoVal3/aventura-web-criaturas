import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import { resolverOrigenesCors } from '../src/comun/util/cors.util';

describe('Configuración CORS para despliegue (S-7)', () => {
  it('usa localhost:5173 por defecto cuando no se define CORS_ORIGEN', () => {
    assert.strictEqual(resolverOrigenesCors(undefined), 'http://localhost:5173');
    assert.strictEqual(resolverOrigenesCors('   '), 'http://localhost:5173');
  });

  it('normaliza barras finales y rechaza el comodín universal *', () => {
    assert.strictEqual(
      resolverOrigenesCors('https://aethelgard.pages.dev/'),
      'https://aethelgard.pages.dev',
    );
    assert.strictEqual(resolverOrigenesCors('*'), 'http://localhost:5173');
  });

  it('admite múltiples orígenes autorizados separados por coma sin incluir *', () => {
    assert.deepStrictEqual(
      resolverOrigenesCors('https://aethelgard.pages.dev/, *, http://localhost:5173/ '),
      ['https://aethelgard.pages.dev', 'http://localhost:5173'],
    );
  });
});
