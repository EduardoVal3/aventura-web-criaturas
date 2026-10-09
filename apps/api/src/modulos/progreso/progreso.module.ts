import { Module } from '@nestjs/common';
import { ProgresoController } from './progreso.controller';
import { ProgresoService } from './progreso.service';

@Module({
  controllers: [ProgresoController],
  providers: [ProgresoService],
  exports: [ProgresoService],
})
export class ProgresoModule {}
