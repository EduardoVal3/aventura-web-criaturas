import {
  Injectable,
  ConflictException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { CrearPersonajeDto } from './dto/crear-personaje.dto';

const ESPECIES_INICIALES_VALIDAS = ['lobo-gris', 'oso-negro', 'arana-lobo-gigante'];

@Injectable()
export class PersonajesService {
  constructor(private readonly prisma: PrismaService) {}

  async crearPersonaje(usuarioId: string, dto: CrearPersonajeDto) {
    const personajeExistente = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (personajeExistente) {
      throw new ConflictException({
        codigo: 'PERSONAJE_YA_EXISTE',
        mensaje: 'El usuario ya posee un personaje activo registrado.',
      });
    }

    if (!ESPECIES_INICIALES_VALIDAS.includes(dto.especieInicialSlug)) {
      throw new BadRequestException({
        codigo: 'ESPECIE_INICIAL_INVALIDA',
        mensaje: `La especie ${dto.especieInicialSlug} no está autorizada como inicial.`,
      });
    }

    const especie = await this.prisma.especie.findUnique({
      where: { slug: dto.especieInicialSlug },
    });

    if (!especie) {
      throw new BadRequestException({
        codigo: 'ESPECIE_INICIAL_INVALIDA',
        mensaje: `No se encontró la especie inicial en el catálogo: ${dto.especieInicialSlug}.`,
      });
    }

    // simplificacion: transacción atómica única para la creación del explorador y asignación inicial
    return this.prisma.$transaction(async (tx) => {
      // 1. Crear el Personaje
      const personaje = await tx.personaje.create({
        data: {
          usuarioId,
          nombre: dto.nombre,
          monedas: 100,
          ubicacionActualId: 'LOC-01',
        },
      });

      // 2. Crear la Criatura inicial en equipo
      const criatura = await tx.criatura.create({
        data: {
          personajeId: personaje.id,
          especieId: especie.id,
          apodo: null,
          nivel: 1,
          experiencia: 0,
          hpActual: especie.hpBase,
          hpMaximo: especie.hpBase,
          ataque: especie.ataqueBase,
          defensa: especie.defensaBase,
          velocidad: especie.velocidadBase,
          enEquipo: true,
          ordenEquipo: 1,
        },
      });

      // 3. Asignar inventario de bienvenida: 3 talismanes básicos y 2 pociones menores
      const talisman = await tx.objeto.findUnique({
        where: { codigo: 'talisman-basico' },
      });
      const pocion = await tx.objeto.findUnique({
        where: { codigo: 'pocion-menor' },
      });

      if (talisman) {
        await tx.inventarioPersonaje.create({
          data: {
            personajeId: personaje.id,
            objetoId: talisman.id,
            cantidad: 3,
          },
        });
      }

      if (pocion) {
        await tx.inventarioPersonaje.create({
          data: {
            personajeId: personaje.id,
            objetoId: pocion.id,
            cantidad: 2,
          },
        });
      }

      // 4. Desbloquear las zonas accesibles iniciales: LOC-01, LOC-02, ZON-01, ZON-02
      const zonasIniciales = ['LOC-01', 'LOC-02', 'ZON-01', 'ZON-02'];
      for (const zonaId of zonasIniciales) {
        await tx.zonaDesbloqueada.create({
          data: {
            personajeId: personaje.id,
            zonaId,
          },
        });
      }

      // 5. Registrar en Historial
      await tx.historial.create({
        data: {
          personajeId: personaje.id,
          tipo: 'EXPLORACION',
          descripcion:
            'Comienza la aventura en Villa Serena con una criatura compañera e inventario inicial.',
          datosJson: {
            especieInicial: especie.slug,
            ubicacion: 'LOC-01',
          },
        },
      });

      return {
        personajeId: personaje.id,
        nombre: personaje.nombre,
        monedas: personaje.monedas,
        ubicacionActualId: personaje.ubicacionActualId,
        criaturaInicial: {
          criaturaId: criatura.id,
          especieSlug: especie.slug,
          nombre: especie.nombre,
          nivel: criatura.nivel,
          hpActual: criatura.hpActual,
          hpMaximo: criatura.hpMaximo,
          puntosExperiencia: criatura.experiencia,
        },
      };
    });
  }

  async obtenerPersonajeActivo(usuarioId: string) {
    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId },
    });

    if (!personaje) {
      throw new NotFoundException({
        codigo: 'PERSONAJE_NO_ENCONTRADO',
        mensaje: 'No se encontró un personaje activo para este explorador.',
      });
    }

    const [totalCriaturasEquipo, totalCriaturasAlmacen] = await Promise.all([
      this.prisma.criatura.count({
        where: { personajeId: personaje.id, enEquipo: true },
      }),
      this.prisma.criatura.count({
        where: { personajeId: personaje.id, enEquipo: false },
      }),
    ]);

    return {
      personajeId: personaje.id,
      nombre: personaje.nombre,
      monedas: personaje.monedas,
      ubicacionActualId: personaje.ubicacionActualId,
      totalCriaturasEquipo,
      totalCriaturasAlmacen,
    };
  }
}
