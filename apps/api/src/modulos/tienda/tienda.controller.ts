import {
  Controller,
  Get,
  Post,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TiendaService } from './tienda.service';
import { UsuarioActual } from '../../comun/decoradores/usuario-actual.decorator';
import { ComprarDto } from './dto/comprar.dto';

@ApiTags('Tienda')
@ApiBearerAuth()
@Controller('tienda')
export class TiendaController {
  constructor(private readonly tiendaService: TiendaService) {}

  @Get()
  @ApiOperation({
    summary:
      'Consulta el catálogo de objetos disponibles para la venta en la tienda local',
  })
  @ApiResponse({
    status: 200,
    description: 'Catálogo de artículos y saldo de monedas disponible.',
  })
  obtenerCatalogo(@UsuarioActual('sub') usuarioId: string) {
    return this.tiendaService.obtenerCatalogo(usuarioId);
  }

  @Post('comprar')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary:
      'Compra uno o más artículos en la tienda local descontando monedas',
  })
  @ApiResponse({
    status: 200,
    description: 'Compra procesada atómicamente y acreditada al inventario.',
  })
  comprar(
    @UsuarioActual('sub') usuarioId: string,
    @Body() dto: ComprarDto,
  ) {
    return this.tiendaService.comprar(
      usuarioId,
      dto.itemCodigo,
      dto.cantidad ?? 1,
    );
  }
}
