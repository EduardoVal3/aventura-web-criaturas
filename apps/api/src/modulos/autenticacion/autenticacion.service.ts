import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../comun/prisma/prisma.service';
import { RegistroDto } from './dto/registro.dto';
import { IngresoDto } from './dto/ingreso.dto';

@Injectable()
export class AutenticacionService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async registrar(dto: RegistroDto) {
    const usuarioExistente = await this.prisma.usuario.findFirst({
      where: {
        OR: [
          { correo: dto.correo },
          { nombreUsuario: dto.nombreUsuario },
        ],
      },
    });

    if (usuarioExistente) {
      throw new ConflictException({
        codigo: 'USUARIO_DUPLICADO',
        mensaje: 'El nombre de usuario o correo electrónico ya está registrado.',
      });
    }

    const contrasenaHash = await bcrypt.hash(dto.clave, 10);

    const usuario = await this.prisma.usuario.create({
      data: {
        nombreUsuario: dto.nombreUsuario,
        correo: dto.correo,
        contrasenaHash,
      },
    });

    const cargaUtil = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
    };
    const tokenAcceso = await this.jwtService.signAsync(cargaUtil);

    return {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
      tokenAcceso,
    };
  }

  async ingresar(dto: IngresoDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { correo: dto.correo },
    });

    if (!usuario) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Correo o contraseña incorrectos.',
      });
    }

    const coincide = await bcrypt.compare(dto.clave, usuario.contrasenaHash);
    if (!coincide) {
      throw new UnauthorizedException({
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Correo o contraseña incorrectos.',
      });
    }

    const cargaUtil = {
      sub: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      correo: usuario.correo,
    };
    const tokenAcceso = await this.jwtService.signAsync(cargaUtil);

    const personaje = await this.prisma.personaje.findUnique({
      where: { usuarioId: usuario.id },
    });

    return {
      usuarioId: usuario.id,
      nombreUsuario: usuario.nombreUsuario,
      tokenAcceso,
      tienePersonaje: Boolean(personaje),
    };
  }

  async obtenerPerfil(usuario: {
    sub: string;
    nombreUsuario?: string;
    correo?: string;
    [clave: string]: unknown;
  }) {
    let personaje: {
      id: string;
      nombre: string;
      monedas: number;
      ubicacionActualId: string;
      criaturas?: { enEquipo: boolean }[];
    } | null = null;

    if (this.prisma.personaje?.findUnique) {
      personaje = await this.prisma.personaje.findUnique({
        where: { usuarioId: usuario.sub },
        include: {
          criaturas: {
            select: { enEquipo: true },
          },
        },
      });
    }

    const criaturas = personaje?.criaturas ?? [];

    return {
      ...usuario,
      usuarioId: usuario.sub,
      tienePersonaje: Boolean(personaje),
      personaje: personaje
        ? {
            personajeId: personaje.id,
            nombre: personaje.nombre,
            monedas: personaje.monedas,
            ubicacionActualId: personaje.ubicacionActualId,
            totalCriaturasEquipo: criaturas.filter((c) => c.enEquipo).length,
            totalCriaturasAlmacen: criaturas.filter((c) => !c.enEquipo).length,
          }
        : null,
    };
  }
}
