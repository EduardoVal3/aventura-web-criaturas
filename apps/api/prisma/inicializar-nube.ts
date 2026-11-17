import { execFileSync } from 'node:child_process';
import * as path from 'node:path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Inicializa zonas, objetos y las 30 especies canónicas únicamente si la base de datos está vacía.
 * Evita repetir consultas externas a Open5e en cada reinicio en frío de Render Free (sin SSH/pre-deploy).
 */
async function inicializarBaseSiVacia() {
  const [zonas, objetos, especies, apariciones] = await Promise.all([
    prisma.zona.count(),
    prisma.objeto.count(),
    prisma.especie.count(),
    prisma.aparicionZona.count(),
  ]);

  if (zonas === 0 || objetos === 0) {
    console.log('Base de datos sin zonas u objetos; ejecutando seed inicial...');
    execFileSync(process.execPath, [path.join(__dirname, 'seed.js')], {
      stdio: 'inherit',
    });
  }

  if (especies === 0 || apariciones === 0) {
    console.log('Base de datos sin catálogo de especies; ejecutando importación inicial...');
    execFileSync(
      process.execPath,
      [path.join(__dirname, 'importar-especies.js')],
      { stdio: 'inherit' },
    );
  }
}

inicializarBaseSiVacia()
  .catch((error) => {
    console.error('Error al inicializar la base de datos en la nube:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
