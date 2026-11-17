import { Module } from '@nestjs/common';
import { ExploracionService } from './exploracion.service';
import { ExploracionController } from './exploracion.controller';
import { HistorialModule } from '../historial/historial.module';
import { ProgresoModule } from '../progreso/progreso.module';

@Module({
  imports: [HistorialModule, ProgresoModule],
  controllers: [ExploracionController],
  providers: [ExploracionService],
  exports: [ExploracionService],
})
export class ExploracionModule {}
