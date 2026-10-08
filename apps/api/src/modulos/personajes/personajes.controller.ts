import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { PersonajesService } from './personajes.service';
import { CrearPersonajeDto } from './dto/crear-personaje.dto';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Personajes')
@ApiBearerAuth()
@Controller(['personajes', 'personaje'])
export class PersonajesController {
  constructor(private readonly personajesService: PersonajesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Crea un personaje explorador con criatura inicial e inventario de bienvenida' })
  crear(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: CrearPersonajeDto,
  ) {
    return this.personajesService.crearPersonaje(usuarioId, dto);
  }

  @Get('activo')
  @ApiOperation({ summary: 'Obtiene el personaje activo del explorador autenticado' })
  obtenerActivo(@UsuarioActual('sub') usuarioId: string) {
    return this.personajesService.obtenerPersonajeActivo(usuarioId);
  }

  @Get()
  @ApiOperation({ summary: 'Obtiene los datos del personaje activo (ruta compatible /api/personaje)' })
  obtenerPersonaje(@UsuarioActual('sub') usuarioId: string) {
    return this.personajesService.obtenerPersonajeActivo(usuarioId);
  }
}
