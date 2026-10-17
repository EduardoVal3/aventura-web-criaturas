import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { ES_PUBLICO_KEY } from '../decoradores/publico.decorator';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(contexto: ExecutionContext): Promise<boolean> {
    const esPublico = this.reflector.getAllAndOverride<boolean>(ES_PUBLICO_KEY, [
      contexto.getHandler(),
      contexto.getClass(),
    ]);

    if (esPublico) {
      return true;
    }

    const peticion = contexto.switchToHttp().getRequest<Request>();
    const token = this.extraerTokenDeEncabezado(peticion);

    if (!token) {
      throw new UnauthorizedException({
        codigo: 'NO_AUTORIZADO',
        mensaje: 'Token de autenticación faltante o no provisto.',
      });
    }

    try {
      const cargaUtil = await this.jwtService.verifyAsync(token);

      // simplificacion: validación de existencia en BD para evitar tokens huérfanos tras reseteos
      const usuario = await this.prisma.usuario.findUnique({
        where: { id: cargaUtil.sub },
        select: { id: true, nombreUsuario: true, correo: true },
      });

      if (!usuario) {
        throw new UnauthorizedException({
          codigo: 'USUARIO_NO_ENCONTRADO',
          mensaje: 'El usuario asociado a la sesión ya no existe en el sistema.',
        });
      }

      (peticion as any).user = { ...cargaUtil, ...usuario };
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException({
        codigo: 'CREDENCIALES_INVALIDAS',
        mensaje: 'Token de autenticación inválido o expirado.',
      });
    }

    return true;
  }

  private extraerTokenDeEncabezado(peticion: Request): string | undefined {
    const [tipo, token] = peticion.headers.authorization?.split(' ') ?? [];
    return tipo === 'Bearer' ? token : undefined;
  }
}
