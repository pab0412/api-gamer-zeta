// ventas/ventas.service.ts
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateVentaDto } from './dto/create-venta.dto';
import { UpdateVentaDto } from './dto/update-venta.dto';
import { Venta } from './entities/venta.entity';
import { ProductosService } from '../productos/productos.service';

@Injectable()
export class VentasService {
  constructor(
    @InjectRepository(Venta)
    private ventasRepository: Repository<Venta>,
    private productosService: ProductosService,
  ) {}

  async create(createVentaDto: CreateVentaDto) {
    const { detalleProductos } = createVentaDto;

    // Validar y calcular totales
    let subtotal = 0;
    const detalleCompleto = [];

    for (const item of detalleProductos) {
      const producto = await this.productosService.findOne(item.productoId);

      if (producto.stock < item.cantidad) {
        throw new BadRequestException(
          `Stock insuficiente para ${producto.nombre}. Disponible: ${producto.stock}`,
        );
      }

      // Convertir precio a número
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

      // Actualizar stock
      await this.productosService.actualizarStock(producto.id, item.cantidad);
    }

    // Calcular IVA (19% en Chile)
    const iva = subtotal * 0.19;
    const total = subtotal + iva;

    // Crear venta
    const venta = this.ventasRepository.create({
      usuarioId: createVentaDto.usuarioId,
      detalleProductos: detalleCompleto,
      metodoPago: createVentaDto.metodoPago,
      subtotal: Number(subtotal.toFixed(2)),
      iva: Number(iva.toFixed(2)),
      total: Number(total.toFixed(2)),
      estado: 'completada',
    });

    return await this.ventasRepository.save(venta);
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

    // Solo permitir actualizar el estado
    if (updateVentaDto.estado) {
      venta.estado = updateVentaDto.estado;
    }

    return await this.ventasRepository.save(venta);
  }

  async remove(id: number) {
    const venta = await this.findOne(id);
    venta.estado = 'anulada';
    return await this.ventasRepository.save(venta);
  }
}