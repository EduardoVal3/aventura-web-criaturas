import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AutenticacionService } from './autenticacion.service';
import { RegistroDto } from './dto/registro.dto';
import { IngresoDto } from './dto/ingreso.dto';
import { Publico } from '../../comun/decoradores/publico.decorator';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Autenticación')
@Controller(['autenticacion', 'usuarios'])
export class AutenticacionController {
  constructor(private readonly autenticacionService: AutenticacionService) {}

  @Publico()
  @Post('registro')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo explorador' })
  @ApiResponse({ status: 201, description: 'Usuario registrado exitosamente.' })
  @ApiResponse({ status: 400, description: 'Datos de registro inválidos.' })
  @ApiResponse({ status: 409, description: 'Usuario o correo ya registrado.' })
  async registrar(@Body() dto: RegistroDto) {
    return this.autenticacionService.registrar(dto);
  }

  @Publico()
  @Post(['ingreso', 'login'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  @ApiResponse({ status: 200, description: 'Inicio de sesión exitoso.' })
  @ApiResponse({ status: 401, description: 'Credenciales inválidas.' })
  async ingresar(@Body() dto: IngresoDto) {
    return this.autenticacionService.ingresar(dto);
  }

  @Get('perfil')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Obtener datos del usuario autenticado' })
  @ApiResponse({ status: 200, description: 'Perfil obtenido exitosamente.' })
  @ApiResponse({ status: 401, description: 'Token faltante o inválido.' })
  async obtenerPerfil(@UsuarioActual() usuario: any) {
    return usuario;
  }
}
