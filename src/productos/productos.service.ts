import { Injectable, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateProductoDto } from './dto/create-producto.dto';
import { UpdateProductoDto } from './dto/update-producto.dto';
import { Producto } from './entities/producto.entity';
import { productosIniciales } from './seeds/productos.seed';

@Injectable()
export class ProductosService implements OnModuleInit {
  constructor(
    @InjectRepository(Producto)
    private productosRepository: Repository<Producto>,
  ) {}

  // Este método se ejecuta automáticamente cuando inicia la app
  async onModuleInit() {
    await this.cargarProductosSiNoExisten();
  }

  private async cargarProductosSiNoExisten() {
    // Verificar si ya hay productos
    const count = await this.productosRepository.count();

    if (count === 0) {
      console.log('No hay productos, cargando datos iniciales...');

      for (const productoData of productosIniciales) {
        const producto = this.productosRepository.create(productoData);
        await this.productosRepository.save(producto);
      }

      console.log('Productos cargados exitosamente');
    } else {
      console.log('Productos ya existen en la base de datos');
    }
  }

  async cargarProductosIniciales() {
    const productosCreados = [];

    for (const productoData of productosIniciales) {
      const producto = this.productosRepository.create(productoData);
      const productoGuardado = await this.productosRepository.save(producto);
      // @ts-ignore
      productosCreados.push(productoGuardado);
    }

    return {
      mensaje: 'Productos cargados exitosamente',
      cantidad: productosCreados.length,
      productos: productosCreados,
    };
  }

  async create(createProductoDto: CreateProductoDto) {
    const producto = this.productosRepository.create(createProductoDto);
    return await this.productosRepository.save(producto);
  }

  async findAll() {
    return await this.productosRepository.find({
      where: { activo: true },
      order: { nombre: 'ASC' },
    });
  }

  async findOne(id: number) {
    const producto = await this.productosRepository.findOne({
      where: { id },
    });

    if (!producto) {
      throw new NotFoundException(`Producto con ID ${id} no encontrado`);
    }

    return producto;
  }

  async findByCategoria(categoria: string) {
    return await this.productosRepository.find({
      where: { categoria, activo: true },
    });
  }

  async update(id: number, updateProductoDto: UpdateProductoDto) {
    const producto = await this.findOne(id);

    Object.assign(producto, updateProductoDto);

    return await this.productosRepository.save(producto);
  }

  async remove(id: number) {
    const producto = await this.findOne(id);
    producto.activo = false;
    return await this.productosRepository.save(producto);
  }

  async actualizarStock(id: number, cantidad: number) {
    const producto = await this.findOne(id);

    if (producto.stock < cantidad) {
      throw new Error(`Stock insuficiente para ${producto.nombre}`);
    }

    producto.stock -= cantidad;
    return await this.productosRepository.save(producto);
  }
}