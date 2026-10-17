import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import * as fs from 'node:fs';
import * as path from 'node:path';
import {
  BESTIARIO,
  TABLAS_APARICION,
  EspecieCanonica,
  AparicionCanonica,
} from '../src/modulos/externo/bestiario-canonico';
import { CATALOGO_ESPECIES_PROPENSO } from '../src/modulos/externo/normalizador-criaturas.util';

describe('Bestiario Canónico, Jerarquía de Atributos y Tablas de Aparición (Subfase 10j)', () => {
  const AFINIDADES_VALIDAS = new Set(['fisico', 'fuego', 'agua', 'natura', 'sombra', 'luz']);
  const EFECTOS_VALIDOS = new Set([
    'QUEMADURA',
    'VENENO',
    'ESCARCHA',
    'PARALISIS',
    'PETRIFICACION',
    'BASTION',
  ]);
  const TIPOS_ACCION_VALIDOS = new Set(['Ataque melé', 'Ataque a distancia', 'Estado']);

  const ZONAS_CANONICAS = ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04', 'ZON-05', 'ZON-06'];

  it('1. Carga íntegra: 30 especies soberanas con claves y 4 movimientos en slots 1..4', () => {
    assert.strictEqual(BESTIARIO.length, 30, 'El bestiario debe contener exactamente 30 especies');

    const slugs = new Set<string>();
    const idsExternos = new Set<string>();

    for (const esp of BESTIARIO) {
      assert.ok(esp.slug && esp.slug.trim().length > 0, `Slug inválido en ${esp.nombre}`);
      assert.ok(esp.idExterno && esp.idExterno.startsWith('srd-2024_'), `idExterno inválido: ${esp.idExterno}`);
      assert.ok(!slugs.has(esp.slug), `Slug duplicado detectado: ${esp.slug}`);
      assert.ok(!idsExternos.has(esp.idExterno), `idExterno duplicado detectado: ${esp.idExterno}`);
      slugs.add(esp.slug);
      idsExternos.add(esp.idExterno);

      assert.ok(esp.nombre && esp.nombre.trim().length > 0, `Nombre vacío en ${esp.slug}`);
      assert.ok(AFINIDADES_VALIDAS.has(esp.elemento), `Afinidad elemental no válida: ${esp.elemento} en ${esp.slug}`);

      // Movimientos: exactamente 4
      assert.strictEqual(
        esp.movimientos.length,
        4,
        `La especie ${esp.slug} debe poseer exactamente 4 movimientos tácticos`,
      );

      const slots = esp.movimientos.map((m) => m.slot);
      assert.deepStrictEqual(slots, [1, 2, 3, 4], `Los slots de ${esp.slug} deben ser 1, 2, 3 y 4 en orden`);

      for (const mov of esp.movimientos) {
        assert.ok(mov.nombre && mov.nombre.trim().length > 0, `Nombre de movimiento vacío en ${esp.slug}`);
        assert.ok(
          TIPOS_ACCION_VALIDOS.has(mov.tipoAccion),
          `Tipo de acción inválido: ${mov.tipoAccion} en ${mov.nombre} (${esp.slug})`,
        );
      }
    }
  });

  it('2. 5 especies por zona: 6 zonas x 5 especies = 30 apariciones sin duplicados de zona', () => {
    assert.strictEqual(
      TABLAS_APARICION.length,
      30,
      'Deben existir exactamente 30 registros en TABLAS_APARICION (5 por cada una de las 6 zonas)',
    );

    const especiesPorZona: Record<string, AparicionCanonica[]> = {};
    const especiesAsignadas = new Set<string>();

    for (const aparicion of TABLAS_APARICION) {
      assert.ok(
        ZONAS_CANONICAS.includes(aparicion.zonaId),
        `Zona desconocida en tabla de aparición: ${aparicion.zonaId}`,
      );
      if (!especiesPorZona[aparicion.zonaId]) {
        especiesPorZona[aparicion.zonaId] = [];
      }
      especiesPorZona[aparicion.zonaId].push(aparicion);

      assert.ok(
        !especiesAsignadas.has(aparicion.especieSlug),
        `La especie ${aparicion.especieSlug} está asignada a más de una zona`,
      );
      especiesAsignadas.add(aparicion.especieSlug);

      assert.ok(
        aparicion.nivelMinimo <= aparicion.nivelMaximo,
        `Rango de nivel inválido en ${aparicion.especieSlug}: ${aparicion.nivelMinimo} > ${aparicion.nivelMaximo}`,
      );
    }

    for (const zonaId of ZONAS_CANONICAS) {
      const listaZona = especiesPorZona[zonaId] || [];
      assert.strictEqual(
        listaZona.length,
        5,
        `La zona ${zonaId} debe contener exactamente 5 especies asignadas`,
      );
    }
  });

  it('3. Invariante INV-01: suma de pesos exactamente 100 por zona con plantilla [35, 35, 15, 10, 5]', () => {
    for (const zonaId of ZONAS_CANONICAS) {
      const filasZona = TABLAS_APARICION.filter((a) => a.zonaId === zonaId);
      const sumaPesos = filasZona.reduce((acc, f) => acc + f.peso, 0);
      assert.strictEqual(
        sumaPesos,
        100,
        `La suma de pesos para ${zonaId} debe ser estrictamente 100 (INV-01), obtuvo: ${sumaPesos}`,
      );

      const pesosOrdenados = filasZona.map((f) => f.peso).sort((a, b) => b - a);
      assert.deepStrictEqual(
        pesosOrdenados,
        [35, 35, 15, 10, 5],
        `La distribución de pesos en ${zonaId} debe ser [35, 35, 15, 10, 5]`,
      );
    }
  });

  it('4. Rarezas y consagración de Legendarias: behir-abismo y remorhaz-glaciar como únicas Legendarias', () => {
    const mapaEspecies = new Map<string, EspecieCanonica>(BESTIARIO.map((e) => [e.slug, e]));

    const legendarias = BESTIARIO.filter((e) => e.esLegendaria);
    assert.strictEqual(legendarias.length, 2, 'Deben existir exactamente 2 criaturas legendarias');
    const slugsLegendarias = legendarias.map((e) => e.slug).sort();
    assert.deepStrictEqual(
      slugsLegendarias,
      ['behir-abismo', 'remorhaz-glaciar'],
      'Las únicas criaturas legendarias consagradas son behir-abismo y remorhaz-glaciar',
    );

    for (const esp of legendarias) {
      assert.strictEqual(esp.esEspecial, true, `La criatura legendaria ${esp.slug} debe tener esEspecial=true`);
    }

    // Comprobar la fila de peso 5 de cada zona
    for (const zonaId of ZONAS_CANONICAS) {
      const filaPeso5 = TABLAS_APARICION.find((a) => a.zonaId === zonaId && a.peso === 5);
      assert.ok(filaPeso5, `No se encontró especie de peso 5 en ${zonaId}`);
      const especie = mapaEspecies.get(filaPeso5.especieSlug);
      assert.ok(especie, `No se encontró definición para ${filaPeso5.especieSlug}`);

      if (zonaId === 'ZON-05' || zonaId === 'ZON-06') {
        assert.strictEqual(
          especie.esLegendaria,
          true,
          `La criatura de peso 5 en ${zonaId} (${especie.slug}) debe ser Legendaria`,
        );
      } else {
        assert.strictEqual(
          especie.esEspecial,
          true,
          `La criatura de peso 5 en ${zonaId} (${especie.slug}) debe ser Especial`,
        );
        assert.strictEqual(
          especie.esLegendaria,
          false,
          `La criatura de peso 5 en ${zonaId} (${especie.slug}) no debe ser Legendaria`,
        );
      }
    }
  });

  it('5. Presupuesto por rango y límites individuales de atributos en [30, 100] (J-4)', () => {
    const mapaAparicion = new Map<string, string>(
      TABLAS_APARICION.map((a) => [a.especieSlug, a.zonaId]),
    );

    const BANDAS_NO_ESPECIAL: Record<string, [number, number]> = {
      'ZON-01': [140, 155],
      'ZON-02': [160, 175],
      'ZON-03': [180, 195],
      'ZON-04': [200, 215],
      'ZON-05': [220, 235],
      'ZON-06': [240, 255],
    };

    const BANDAS_ESPECIAL: Record<string, [number, number]> = {
      'ZON-01': [210, 225],
      'ZON-02': [240, 255],
      'ZON-03': [265, 280],
      'ZON-04': [290, 310],
    };

    for (const esp of BESTIARIO) {
      const { hpBase, ataqueBase, defensaBase, velocidadBase } = esp.statsBase;
      const stats = [hpBase, ataqueBase, defensaBase, velocidadBase];

      // J-4: cada stat en [30, 100]
      for (const s of stats) {
        assert.ok(
          s >= 30 && s <= 100,
          `Stat fuera de rango [30, 100] en ${esp.slug}: ${s}`,
        );
      }

      const presupuesto = hpBase + ataqueBase + defensaBase + velocidadBase;
      const zona = mapaAparicion.get(esp.slug)!;
      assert.ok(zona, `Zona no asignada para ${esp.slug}`);

      if (esp.slug === 'behir-abismo') {
        assert.strictEqual(presupuesto, 355, 'Behir debe tener presupuesto exacto 355');
      } else if (esp.slug === 'remorhaz-glaciar') {
        assert.strictEqual(presupuesto, 380, 'Remorhaz debe tener presupuesto exacto 380');
      } else if (esp.esEspecial) {
        const [minEsp, maxEsp] = BANDAS_ESPECIAL[zona];
        assert.ok(
          presupuesto >= minEsp && presupuesto <= maxEsp,
          `Presupuesto especial de ${esp.slug} (${presupuesto}) fuera de banda [${minEsp}, ${maxEsp}]`,
        );
      } else {
        const [minNoEsp, maxNoEsp] = BANDAS_NO_ESPECIAL[zona];
        assert.ok(
          presupuesto >= minNoEsp && presupuesto <= maxNoEsp,
          `Presupuesto común de ${esp.slug} (${presupuesto}) fuera de banda [${minNoEsp}, ${maxNoEsp}]`,
        );
      }
    }
  });

  it('6. Monotonía estricta de jerarquía: J-1, J-2 y J-3', () => {
    const mapaAparicion = new Map<string, string>(
      TABLAS_APARICION.map((a) => [a.especieSlug, a.zonaId]),
    );

    const calcularPresupuesto = (esp: EspecieCanonica) =>
      esp.statsBase.hpBase +
      esp.statsBase.ataqueBase +
      esp.statsBase.defensaBase +
      esp.statsBase.velocidadBase;

    // J-1: max(comunes z) < min(comunes z+1) para z < 6
    for (let z = 1; z < 6; z++) {
      const zActual = `ZON-0${z}`;
      const zSiguiente = `ZON-0${z + 1}`;

      const comunesActual = BESTIARIO.filter(
        (e) => !e.esEspecial && mapaAparicion.get(e.slug) === zActual,
      );
      const comunesSiguiente = BESTIARIO.filter(
        (e) => !e.esEspecial && mapaAparicion.get(e.slug) === zSiguiente,
      );

      const maxActual = Math.max(...comunesActual.map(calcularPresupuesto));
      const minSiguiente = Math.min(...comunesSiguiente.map(calcularPresupuesto));

      assert.ok(
        maxActual < minSiguiente,
        `J-1 violado: max(${zActual})=${maxActual} debe ser menor que min(${zSiguiente})=${minSiguiente}`,
      );
    }

    // J-2: toda criatura común de la zona i tiene presupuesto < toda especial/legendaria de j >= i
    for (let i = 1; i <= 6; i++) {
      const zonaActual = `ZON-0${i}`;
      const comunesZonaI = BESTIARIO.filter(
        (e) => !e.esEspecial && mapaAparicion.get(e.slug) === zonaActual,
      );

      for (let j = i; j <= 6; j++) {
        const zonaJ = `ZON-0${j}`;
        const especialesZonaJ = BESTIARIO.filter(
          (e) => e.esEspecial && mapaAparicion.get(e.slug) === zonaJ,
        );

        for (const comun of comunesZonaI) {
          const presComun = calcularPresupuesto(comun);
          for (const especial of especialesZonaJ) {
            const presEspecial = calcularPresupuesto(especial);
            assert.ok(
              presComun < presEspecial,
              `J-2 violado: común ${comun.slug} (${presComun}) de ${zonaActual} >= especial ${especial.slug} (${presEspecial}) de ${zonaJ}`,
            );
          }
        }
      }
    }

    // J-3: presupuestos de especiales crecen estrictamente por zona
    const presupuestosEspeciales: number[] = [];
    for (const zona of ZONAS_CANONICAS) {
      const espZona = BESTIARIO.find(
        (e) => e.esEspecial && mapaAparicion.get(e.slug) === zona,
      )!;
      presupuestosEspeciales.push(calcularPresupuesto(espZona));
    }

    for (let k = 0; k < presupuestosEspeciales.length - 1; k++) {
      assert.ok(
        presupuestosEspeciales[k] < presupuestosEspeciales[k + 1],
        `J-3 violado: especial de ${ZONAS_CANONICAS[k]} (${presupuestosEspeciales[k]}) debe ser menor que ${ZONAS_CANONICAS[k + 1]} (${presupuestosEspeciales[k + 1]})`,
      );
    }
  });

  it('7. Sets tácticos de 4 movimientos: M1 [4,6], M2 [9,12], M3 [3,5] con efecto, M4 [14,18] o [18,22]', () => {
    for (const esp of BESTIARIO) {
      const [m1, m2, m3, m4] = esp.movimientos;

      // M1: 4-6, sin efecto
      assert.ok(m1.poder >= 4 && m1.poder <= 6, `M1 fuera de [4, 6] en ${esp.slug}: ${m1.poder}`);
      assert.strictEqual(m1.efecto, null, `M1 no debe poseer efecto de estado en ${esp.slug}`);

      // M2: 9-12, sin efecto
      assert.ok(m2.poder >= 9 && m2.poder <= 12, `M2 fuera de [9, 12] en ${esp.slug}: ${m2.poder}`);
      assert.strictEqual(m2.efecto, null, `M2 no debe poseer efecto de estado en ${esp.slug}`);

      // M3: 3-5, con efecto válido obligatorio
      assert.ok(m3.poder >= 3 && m3.poder <= 5, `M3 fuera de [3, 5] en ${esp.slug}: ${m3.poder}`);
      assert.ok(m3.efecto && EFECTOS_VALIDOS.has(m3.efecto), `M3 debe tener efecto válido en ${esp.slug}: ${m3.efecto}`);

      // M4: 14-18 (comunes/especiales) o 18-22 (legendarias)
      if (esp.esLegendaria) {
        assert.ok(
          m4.poder >= 18 && m4.poder <= 22,
          `M4 legendario fuera de [18, 22] en ${esp.slug}: ${m4.poder}`,
        );
      } else {
        assert.ok(
          m4.poder >= 14 && m4.poder <= 18,
          `M4 estándar fuera de [14, 18] en ${esp.slug}: ${m4.poder}`,
        );
      }
    }
  });

  it('8. Referencias cruzadas e integridad con snapshot local y catálogo propenso', () => {
    // Slugs de tablas de aparición existen en bestiario
    const slugsBestiario = new Set(BESTIARIO.map((e) => e.slug));
    for (const aparicion of TABLAS_APARICION) {
      assert.ok(
        slugsBestiario.has(aparicion.especieSlug),
        `Slug en tabla de aparición no existe en bestiario: ${aparicion.especieSlug}`,
      );
    }

    // CATALOGO_ESPECIES_PROPENSO contiene exactamente 30 claves
    const clavesPropensas = Object.keys(CATALOGO_ESPECIES_PROPENSO);
    assert.strictEqual(
      clavesPropensas.length,
      30,
      'CATALOGO_ESPECIES_PROPENSO debe contener exactamente 30 claves',
    );

    // Snapshot local existe y contiene las 30 claves
    const rutaSnapshot = path.resolve(__dirname, '../../../datos/open5e-srd-2024-seleccion.json');
    assert.ok(fs.existsSync(rutaSnapshot), `Snapshot no encontrado en ${rutaSnapshot}`);
    const snapshotRaw = fs.readFileSync(rutaSnapshot, 'utf-8');
    const snapshot = JSON.parse(snapshotRaw) as Array<{ key: string }>;
    const snapshotMap = new Set(snapshot.map((c) => c.key));

    for (const clave of clavesPropensas) {
      assert.ok(
        snapshotMap.has(clave),
        `La clave ${clave} de CATALOGO_ESPECIES_PROPENSO no existe en el snapshot local`,
      );
    }
  });
});
