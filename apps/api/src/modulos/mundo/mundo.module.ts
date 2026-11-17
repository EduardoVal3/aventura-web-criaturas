import { Module } from '@nestjs/common';
import { ProgresoModule } from '../progreso/progreso.module';
import { MundoController } from './mundo.controller';
import { MundoService } from './mundo.service';

@Module({
  imports: [ProgresoModule],
  controllers: [MundoController],
  providers: [MundoService],
  exports: [MundoService],
})
export class MundoModule {}
