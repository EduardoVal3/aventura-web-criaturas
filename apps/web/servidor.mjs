// simplificacion: servidor estático provisional con node:http; la Fase 2 lo reemplaza por Vite.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';

const PUERTO = 5173;
const pagina = new URL('./index.html', import.meta.url);

createServer(async (_peticion, respuesta) => {
  respuesta.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  respuesta.end(await readFile(pagina));
}).listen(PUERTO, () => console.log(`Web en http://localhost:${PUERTO}`));
