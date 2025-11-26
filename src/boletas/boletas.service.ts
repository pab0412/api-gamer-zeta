import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBoletaDto } from './dto/create-boleta.dto';
import { UpdateBoletaDto } from './dto/update-boleta.dto';
import { Boleta } from './entities/boleta.entity';
import { VentasService } from '../ventas/ventas.service';

@Injectable()
export class BoletasService {
  constructor(
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    private ventasService: VentasService,
  ) {}

  async create(createBoletaDto: CreateBoletaDto) {
    // Verificar que la venta existe
    const venta = await this.ventasService.findOne(createBoletaDto.ventaId);

    // Generar número de boleta
    const ultimaBoleta = await this.boletasRepository.findOne({
      order: { id: 'DESC' },
    });

    const numeroActual = ultimaBoleta
      ? parseInt(ultimaBoleta.numero.split('-')[1]) + 1
      : 1;

    const numeroBoleta = `BOL-${numeroActual.toString().padStart(6, '0')}`;

    // Crear boleta
    const boleta = this.boletasRepository.create({
      numero: numeroBoleta,
      ventaId: createBoletaDto.ventaId,
      cliente: createBoletaDto.cliente || 'Consumidor Final',
      rut: createBoletaDto.rut,
      montoTotal: venta.total,
    });

    return await this.boletasRepository.save(boleta);
  }

  async findAll() {
    return await this.boletasRepository.find({
      relations: ['venta'],
      order: { fechaEmision: 'DESC' },
    });
  }

  async findOne(id: number) {
    const boleta = await this.boletasRepository.findOne({
      where: { id },
      relations: ['venta', 'venta.usuario'],
    });

    if (!boleta) {
      throw new NotFoundException(`Boleta con ID ${id} no encontrada`);
    }

    return boleta;
  }

  async findByNumero(numero: string) {
    const boleta = await this.boletasRepository.findOne({
      where: { numero },
      relations: ['venta', 'venta.usuario'],
    });

    if (!boleta) {
      throw new NotFoundException(`Boleta ${numero} no encontrada`);
    }

    return boleta;
  }

  async findByVenta(ventaId: number) {
    return await this.boletasRepository.findOne({
      where: { ventaId },
      relations: ['venta'],
    });
  }

  async update(id: number, updateBoletaDto: UpdateBoletaDto) {
    const boleta = await this.findOne(id);
    Object.assign(boleta, updateBoletaDto);
    return await this.boletasRepository.save(boleta);
  }

  async remove(id: number) {
    const boleta = await this.findOne(id);
    return await this.boletasRepository.remove(boleta);
  }
}