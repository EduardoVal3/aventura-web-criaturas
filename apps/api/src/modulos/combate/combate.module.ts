import { Module } from '@nestjs/common';
import { CombateController } from './combate.controller';
import { CombateService } from './combate.service';
import { CapturaService } from './servicios/captura.service';
import { HistorialModule } from '../historial/historial.module';

@Module({
  imports: [HistorialModule],
  controllers: [CombateController],
  providers: [CombateService, CapturaService],
  exports: [CombateService, CapturaService],
})
export class CombateModule {}
