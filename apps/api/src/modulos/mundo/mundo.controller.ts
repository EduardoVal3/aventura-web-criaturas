import { Body, Controller, Get, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation } from '@nestjs/swagger';
import { MundoService } from './mundo.service';
import { ViajarDto } from './dto/viajar.dto';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';

@ApiTags('Mundo')
@ApiBearerAuth()
@Controller('mundo')
export class MundoController {
  constructor(private readonly mundoService: MundoService) {}

  @Get(['ubicacion-actual', 'ubicacion'])
  @ApiOperation({ summary: 'Consulta la ubicación actual del personaje, servicios y destinos conectados' })
  obtenerUbicacionActual(@UsuarioActual('sub') usuarioId: string) {
    return this.mundoService.obtenerUbicacionActual(usuarioId);
  }

  @Post(['viajar', 'mover'])
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Desplaza al personaje hacia una zona conectada y desbloqueada' })
  viajar(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: ViajarDto,
  ) {
    return this.mundoService.viajar(usuarioId, dto.destinoId);
  }
}
