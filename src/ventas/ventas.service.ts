
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ProductosService } from '../productos/productos.service';
import { BoletasService } from '../boletas/boletas.service';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private ventasRepository: Repository<Venta>,
    private productosService: ProductosService,
    private boletasService: BoletasService,
  ) {}

  async create(createVentaDto: CreateVentaDto) {
    const { detalleProductos, cliente, rut } = createVentaDto as any;

    let subtotal = 0;
    const detalleCompleto = [];

    // Validar stock y calcular totales
    for (const item of detalleProductos) {
      const producto = await this.productosService.findOne(item.productoId);

      if (producto.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        );
      }

      const precioUnitario = Number(producto.precio);
      const subtotalProducto = precioUnitario * item.cantidad;
      subtotal += subtotalProducto;

      // @ts-ignore
      detalleCompleto.push({
        productoId: producto.id,
        nombre: producto.nombre,
        cantidad: item.cantidad,
        precioUnitario: precioUnitario,
        subtotal: subtotalProducto,
      });

      await this.productosService.actualizarStock(producto.id, item.cantidad);
    }

    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // Crear la venta
    const venta = this.ventasRepository.create({
      usuarioId: createVentaDto.usuarioId,
      detalleProductos: detalleCompleto,
      metodoPago: createVentaDto.metodoPago,
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      estado: 'completada',
    });

    // ✅ DEBUG CRÍTICO
    console.log('🔍 VENTA ANTES SAVE:', {
      id: venta.id,
      usuarioId: venta.usuarioId,
      total: venta.total
    });

    const ventaGuardada = await this.ventasRepository.save(venta);

    // ✅ DEBUG RETORNO
    console.log('✅ VENTA GUARDADA:', {
      id: ventaGuardada.id,
      usuarioId: ventaGuardada.usuarioId,
      total: ventaGuardada.total
    });

    const boleta = await this.boletasService.generarBoletaParaVenta(
      ventaGuardada,
      cliente,
      rut,
    );

    // ✅ RETORNA ID explícitamente
    return { ...ventaGuardada, boleta };
  }

  async findAll() {
    return await this.ventasRepository.find({
      relations: ['usuario', 'boleta'],
      order: { fecha: 'DESC' },
    });
  }

  async findOne(id: number) {
    const venta = await this.ventasRepository.findOne({
      where: { id },
      relations: ['usuario', 'boleta'],
    });

    if (!venta) {
      throw new NotFoundException(`Venta con ID ${id} no encontrada`);
    }

    return venta;
  }

  async findByUsuario(usuarioId: number) {
    return await this.ventasRepository.find({
      where: { usuarioId },
      relations: ['boleta'],
      order: { fecha: 'DESC' },
    });
  }

  async update(id: number, updateVentaDto: UpdateVentaDto) {
    const venta = await this.findOne(id);

    if (updateVentaDto.estado) {
      venta.estado = updateVentaDto.estado;
    }

    return await this.ventasRepository.save(venta);
  }

  async findVentasDiarias() {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);

    const manana = new Date(hoy);
    manana.setDate(manana.getDate() + 1);

    return await this.ventasRepository.find({
      where: {
        fecha: Between(hoy, manana),
        estado: 'completada',
      },
      relations: ['usuario', 'boleta'],
      order: { fecha: 'DESC' },
    });
  }

  async remove(id: number) {
    const venta = await this.findOne(id);
    venta.estado = 'anulada';
    return await this.ventasRepository.save(venta);
  }
}