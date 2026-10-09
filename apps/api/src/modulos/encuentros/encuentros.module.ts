import { Module } from '@nestjs/common';
import { EncuentrosController } from './encuentros.controller';
import { EncuentrosService } from './encuentros.service';
import { CombateModule } from '../combate/combate.module';

@Module({
  imports: [CombateModule],
  controllers: [EncuentrosController],
  providers: [EncuentrosService],
  exports: [EncuentrosService],
})
export class EncuentrosModule {}
