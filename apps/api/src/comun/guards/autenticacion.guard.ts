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

@Injectable()
export class AutenticacionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
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
      (peticion as any).user = cargaUtil;
    } catch {
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
