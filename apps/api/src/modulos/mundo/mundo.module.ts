import { Module } from '@nestjs/common';
import { MundoController } from './mundo.controller';
import { MundoService } from './mundo.service';

@Module({
  controllers: [MundoController],
  providers: [MundoService],
  exports: [MundoService],
})
export class MundoModule {}
