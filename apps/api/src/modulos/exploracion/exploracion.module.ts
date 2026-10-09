import { Module } from '@nestjs/common';
import { ExploracionService } from './exploracion.service';
import { ExploracionController } from './exploracion.controller';
import { HistorialModule } from '../historial/historial.module';

@Module({
  imports: [HistorialModule],
  controllers: [ExploracionController],
  providers: [ExploracionService],
  exports: [ExploracionService],
})
export class ExploracionModule {}
