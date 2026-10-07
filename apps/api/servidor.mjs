// simplificacion: servidor provisional con node:http; la Fase 4 lo reemplaza por NestJS.
import { createServer } from 'node:http';

const PUERTO = 3000;
const JSON_UTF8 = { 'Content-Type': 'application/json; charset=utf-8' };

createServer((peticion, respuesta) => {
  if (peticion.method === 'GET' && peticion.url === '/api/salud') {
    respuesta.writeHead(200, JSON_UTF8);
    respuesta.end(JSON.stringify({ estado: 'ok' }));
    return;
  }
  respuesta.writeHead(404, JSON_UTF8);
  respuesta.end(JSON.stringify({ error: 'Ruta no encontrada' }));
}).listen(PUERTO, () => console.log(`API en http://localhost:${PUERTO}/api/salud`));
