import {
  Controller,
  Get,
  Post,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { EncuentrosService } from './encuentros.service';
import { CapturaService } from '../combate/servicios/captura.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';
import { CapturarDto } from '../combate/dto/capturar.dto';

@ApiTags('Encuentros')
@ApiBearerAuth()
@Controller('encuentros')
export class EncuentrosController {
  constructor(
    private readonly encuentrosService: EncuentrosService,
    private readonly capturaService: CapturaService,
  ) {}

  @Get('activo')
  @ApiOperation({ summary: 'Consulta el estado del encuentro silvestre en curso' })
  obtenerEncuentroActivo(@UsuarioActual('sub') usuarioId: string) {
    return this.encuentrosService.obtenerEncuentroActivo(usuarioId);
  }

  @Post(':id/capturar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Intenta capturar la criatura del encuentro con un talismán' })
  @ApiResponse({
    status: 200,
    description: 'Resolución probabilística de la captura y asignación atómica.',
  })
  capturar(
    @UsuarioActual('sub') usuarioId: string,
    @Param('id') encuentroId: string,
    @Body() dto: CapturarDto,
  ) {
    return this.capturaService.capturar(usuarioId, encuentroId, dto.itemCodigo);
  }
}
