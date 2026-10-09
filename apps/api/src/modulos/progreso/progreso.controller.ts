import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ProgresoService } from './progreso.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';
import { VerificarZonaDto } from './dto/verificar-zona.dto';

@ApiTags('Progreso')
@ApiBearerAuth()
@Controller('progreso')
export class ProgresoController {
  constructor(private readonly progresoService: ProgresoService) {}

  @Get('desbloqueos')
  @ApiOperation({
    summary: 'Consulta el catálogo de zonas del mundo y su estado de desbloqueo',
  })
  @ApiResponse({
    status: 200,
    description: 'Listado de zonas con estado de desbloqueo y requisitos.',
  })
  obtenerDesbloqueos(@UsuarioActual('sub') usuarioId: string) {
    return this.progresoService.obtenerDesbloqueos(usuarioId);
  }

  @Post('verificar-zona')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Evalúa requisitos y desbloquea el acceso formal a una zona bloqueada',
  })
  @ApiResponse({
    status: 200,
    description: 'Zona desbloqueada exitosamente.',
  })
  verificarZona(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: VerificarZonaDto,
  ) {
    return this.progresoService.verificarYDesbloquearZona(usuarioId, dto.zonaId);
  }
}
