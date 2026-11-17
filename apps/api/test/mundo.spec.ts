import { describe, it } from 'node:test';
import * as assert from 'node:assert';
import {
  MundoService,
  obtenerEspeciesHabitantesZona,
  NODOS_CANONICOS_MUNDO,
} from '../src/modulos/mundo/mundo.service';
import {
  calcularPoderEquipoDesdeCriaturas,
  determinarRangoDomador,
} from '../src/modulos/progreso/progreso.service';

describe('MundoService, Hábitats, Poder de Equipo y Red Territorial (Subfase 10n)', () => {
  describe('1. obtenerEspeciesHabitantesZona', () => {
    it('devuelve exactamente 5 especies autóctonas para cada zona salvaje (ZON-01 a ZON-06) con atributos completos', () => {
      const zonasSalvajes = ['ZON-01', 'ZON-02', 'ZON-03', 'ZON-04', 'ZON-05', 'ZON-06'];

      for (const zonaId of zonasSalvajes) {
        const especies = obtenerEspeciesHabitantesZona(zonaId);
        assert.strictEqual(
          especies.length,
          5,
          `La zona ${zonaId} debe contener exactamente 5 especies autóctonas.`,
        );

        for (const esp of especies) {
          assert.ok(esp.slug, 'Debe poseer slug');
          assert.ok(esp.nombre, 'Debe poseer nombre');
          assert.ok(esp.tipo, 'Debe poseer tipo');
          assert.ok(esp.elemento, 'Debe poseer afinidad elemental');
          assert.strictEqual(typeof esp.esEspecial, 'boolean');
          assert.strictEqual(typeof esp.esLegendaria, 'boolean');
          assert.ok(esp.pesoAparicion > 0, 'Debe poseer peso de aparición mayor a 0');
        }
      }
    });

    it('devuelve un arreglo vacío para asentamientos pacíficos y localidades seguras', () => {
      const localidadesSeguras = ['LOC-01', 'LOC-02', 'LOC-03'];

      for (const locId of localidadesSeguras) {
        const especies = obtenerEspeciesHabitantesZona(locId);
        assert.deepStrictEqual(especies, []);
      }
    });
  });

  describe('2. calcularPoderEquipoDesdeCriaturas y determinarRangoDomador', () => {
    it('calcula correctamente los valores por defecto cuando el personaje no posee criaturas', () => {
      const poder = calcularPoderEquipoDesdeCriaturas([]);
      assert.strictEqual(poder.nivelMaximoEquipo, 1);
      assert.strictEqual(poder.nivelPromedioEquipo, 1);
      assert.strictEqual(poder.nivelMaximoColeccion, 1);
      assert.strictEqual(poder.criaturasEquipoNv5, 0);
      assert.strictEqual(poder.rangoDomador, 'Recluta del Gremio');
    });

    it('calcula métricas de equipo activo y rango de domador proporcional', () => {
      const criaturas = [
        { nivel: 3, enEquipo: true },
        { nivel: 5, enEquipo: true },
      ];
      const poder = calcularPoderEquipoDesdeCriaturas(criaturas);
      assert.strictEqual(poder.nivelMaximoEquipo, 5);
      assert.strictEqual(poder.nivelPromedioEquipo, 4);
      assert.strictEqual(poder.nivelMaximoColeccion, 5);
      assert.strictEqual(poder.criaturasEquipoNv5, 1);
      assert.strictEqual(poder.rangoDomador, 'Domador de Riscos');
    });

    it('distingue cuando una criatura de nivel superior está en el almacén (reserva)', () => {
      const criaturas = [
        { nivel: 4, enEquipo: true },
        { nivel: 10, enEquipo: false },
      ];
      const poder = calcularPoderEquipoDesdeCriaturas(criaturas);
      assert.strictEqual(poder.nivelMaximoEquipo, 4);
      assert.strictEqual(poder.nivelPromedioEquipo, 4);
      assert.strictEqual(poder.nivelMaximoColeccion, 10);
      assert.strictEqual(poder.criaturasEquipoNv5, 0);
      assert.strictEqual(poder.rangoDomador, 'Maestro de la Cumbre');
    });

    it('determinarRangoDomador mapea rigurosamente todos los umbrales de rango', () => {
      assert.strictEqual(determinarRangoDomador(1), 'Recluta del Gremio');
      assert.strictEqual(determinarRangoDomador(2), 'Recluta del Gremio');
      assert.strictEqual(determinarRangoDomador(3), 'Rastreador de Sendas');
      assert.strictEqual(determinarRangoDomador(4), 'Rastreador de Sendas');
      assert.strictEqual(determinarRangoDomador(5), 'Domador de Riscos');
      assert.strictEqual(determinarRangoDomador(7), 'Domador de Riscos');
      assert.strictEqual(determinarRangoDomador(8), 'Custodio Umbrío');
      assert.strictEqual(determinarRangoDomador(9), 'Custodio Umbrío');
      assert.strictEqual(determinarRangoDomador(10), 'Maestro de la Cumbre');
      assert.strictEqual(determinarRangoDomador(50), 'Maestro de la Cumbre');
    });
  });

  describe('3. MundoService.obtenerUbicacionActual enriquecido', () => {
    it('entrega poder de equipo, conexiones enriquecidas con checklist y red territorial de 9 nodos', async () => {
      const mockPrisma = {
        personaje: {
          findUnique: async () => ({
            id: 'pj-test-1',
            usuarioId: 'usr-test-1',
            nombre: 'Valente',
            ubicacionActualId: 'LOC-02',
          }),
        },
        zona: {
          findUnique: async ({ where }: any) => {
            if (where.id === 'LOC-02') {
              return {
                id: 'LOC-02',
                nombre: 'Puesto Fronterizo del Río',
                tipo: 'LOCALIDAD',
                esSegura: true,
                descripcion: 'Puesto comercial ribereño.',
                nivelMinimo: null,
                nivelMaximo: null,
                servicios: ['TIENDA', 'ALMACEN', 'CURACION'],
              };
            }
            return null;
          },
        },
        criatura: {
          findMany: async () => [
            { nivel: 3, enEquipo: true },
            { nivel: 2, enEquipo: true },
          ],
        },
        conexionZona: {
          findMany: async () => [
            {
              zonaOrigenId: 'LOC-02',
              zonaDestinoId: 'ZON-04',
              zonaDestino: {
                id: 'ZON-04',
                nombre: 'Paso de los Riscos',
                tipo: 'ZONA',
                esSegura: false,
                nivelMinimo: 5,
                nivelMaximo: 7,
              },
            },
          ],
        },
        zonaDesbloqueada: {
          findMany: async () => [
            { personajeId: 'pj-test-1', zonaId: 'LOC-01', progreso: 100 },
            { personajeId: 'pj-test-1', zonaId: 'ZON-01', progreso: 100 },
            { personajeId: 'pj-test-1', zonaId: 'LOC-02', progreso: 100 },
          ],
        },
      } as any;

      const mockProgresoService = {
        evaluarEstadoRequisitoZona: async (_tx: any, _personajeId: string, zonaId: string) => {
          if (zonaId === 'ZON-04') {
            return {
              cumple: false,
              progresoActual: 20,
              progresoObjetivo: 100,
              requisito: 'Cartografiar Bosque Susurrante (ZON-03) al 100% y poseer 1 criatura Nv. 5+',
              detalleProgreso: 'Cartografía ZON-03: 40% · Criaturas Nv.5+: 0/1',
              requisitoCartografia: {
                zonaId: 'ZON-03',
                nombre: 'Bosque Susurrante',
                completada: false,
                progresoActual: 40,
              },
              requisitoNivelEquipo: {
                nivelRequerido: 5,
                cantidadCriaturas: 1,
                cantidadActual: 0,
                nivelMaximoActual: 3,
                soloEquipo: false,
                cumplido: false,
              },
            };
          }
          return {
            cumple: true,
            progresoActual: 100,
            progresoObjetivo: 100,
            requisito: null,
            detalleProgreso: 'Acceso habilitado.',
            requisitoCartografia: null,
            requisitoNivelEquipo: null,
          };
        },
      } as any;

      const servicio = new MundoService(mockPrisma, mockProgresoService);
      const res = await servicio.obtenerUbicacionActual('usr-test-1');

      // Validar ubicación actual
      assert.strictEqual(res.ubicacionId, 'LOC-02');
      assert.strictEqual(res.esSegura, true);
      assert.strictEqual(res.faunaNivelMinimo, null);
      assert.strictEqual(res.faunaNivelMaximo, null);
      assert.deepStrictEqual(res.especiesHabitantes, []);

      // Validar poder de equipo
      assert.ok(res.poderEquipo);
      assert.strictEqual(res.poderEquipo.nivelMaximoEquipo, 3);
      assert.strictEqual(res.poderEquipo.nivelPromedioEquipo, 2.5);
      assert.strictEqual(res.poderEquipo.nivelMaximoColeccion, 3);
      assert.strictEqual(res.poderEquipo.rangoDomador, 'Rastreador de Sendas');

      // Validar conexión hacia ZON-04
      assert.strictEqual(res.conexiones.length, 1);
      const conZon04 = res.conexiones[0];
      assert.strictEqual(conZon04.ubicacionDestinoId, 'ZON-04');
      assert.strictEqual(conZon04.tipoDestino, 'ZONA');
      assert.strictEqual(conZon04.esSegura, false);
      assert.strictEqual(conZon04.faunaNivelMinimo, 5);
      assert.strictEqual(conZon04.faunaNivelMaximo, 7);
      assert.strictEqual(conZon04.estaBloqueada, true);
      assert.strictEqual(conZon04.cumpleRequisito, false);

      // Validar hábitat en ZON-04 (incluye Golem Granito especial)
      assert.strictEqual(conZon04.especiesHabitantes.length, 5);
      const golem = conZon04.especiesHabitantes.find((e) => e.slug === 'golem-granito');
      assert.ok(golem, 'ZON-04 debe incluir a Golem Granito');
      assert.strictEqual(golem.esEspecial, true);

      // Validar checklist táctico estructurado
      assert.ok(conZon04.requisitoCartografia);
      assert.strictEqual(conZon04.requisitoCartografia.zonaId, 'ZON-03');
      assert.strictEqual(conZon04.requisitoCartografia.completada, false);
      assert.strictEqual(conZon04.requisitoCartografia.progresoActual, 40);

      assert.ok(conZon04.requisitoNivelEquipo);
      assert.strictEqual(conZon04.requisitoNivelEquipo.nivelRequerido, 5);
      assert.strictEqual(conZon04.requisitoNivelEquipo.cantidadCriaturas, 1);
      assert.strictEqual(conZon04.requisitoNivelEquipo.nivelMaximoActual, 3);
      assert.strictEqual(conZon04.requisitoNivelEquipo.cumplido, false);

      // Validar nodos de mapa territorial (los 9 nodos canónicos)
      assert.strictEqual(res.nodosMapa.length, 9);
      const nodoLoc02 = res.nodosMapa.find((n) => n.id === 'LOC-02');
      assert.ok(nodoLoc02);
      assert.strictEqual(nodoLoc02.esActual, true);
      assert.strictEqual(nodoLoc02.desbloqueada, true);
      assert.strictEqual(nodoLoc02.esSegura, true);

      const nodoZon04 = res.nodosMapa.find((n) => n.id === 'ZON-04');
      assert.ok(nodoZon04);
      assert.strictEqual(nodoZon04.esActual, false);
      assert.strictEqual(nodoZon04.esAdyacente, true);
      assert.strictEqual(nodoZon04.desbloqueada, false);
    });
  });
});
