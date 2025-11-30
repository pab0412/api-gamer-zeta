// boletas/boletas.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BoletasService } from './boletas.service';
import { BoletasController } from './boletas.controller';
import { Boleta } from './entities/boleta.entity';
import { VentasModule } from '../ventas/ventas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Boleta]),
    forwardRef(() => VentasModule),
  ],
  controllers: [BoletasController],
  providers: [BoletasService],
  exports: [BoletasService],
})
export class BoletasModule {}