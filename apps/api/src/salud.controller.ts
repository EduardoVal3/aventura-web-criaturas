import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Publico } from './comun/decoradores/publico.decorator';

@ApiTags('Salud')
@Controller('salud')
export class SaludController {
  @Publico()
  @Get()
  @ApiOperation({ summary: 'Verificar estado del servidor' })
  @ApiResponse({ status: 200, description: 'Servidor operativo.' })
  obtenerSalud() {
    return {
      estado: 'disponible',
      marcaTiempo: new Date().toISOString(),
      version: '0.1.0',
    };
  }
}
