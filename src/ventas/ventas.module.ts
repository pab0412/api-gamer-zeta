// ventas/ventas.module.ts
import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VentasService } from './ventas.service';
import { VentasController } from './ventas.controller';
import { Venta } from './entities/venta.entity';
import { ProductosModule } from '../productos/productos.module';
import { BoletasModule } from '../boletas/boletas.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Venta]),
    ProductosModule,
    forwardRef(() => BoletasModule), // Importar para usar ProductosService
  ],
  controllers: [VentasController],
  providers: [VentasService],
  exports: [VentasService], // Exportar para usar en boletas
})
export class VentasModule {}