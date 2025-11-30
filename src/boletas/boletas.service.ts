import {
  forwardRef,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateBoletaDto } from './dto/create-boleta.dto';
import { UpdateBoletaDto } from './dto/update-boleta.dto';
import { Boleta } from './entities/boleta.entity';
import { VentasService } from '../ventas/ventas.service';
import { Venta } from '../ventas/entities/venta.entity';

@Injectable()
export class BoletasService {
  constructor(
    @InjectRepository(Boleta)
    private boletasRepository: Repository<Boleta>,
    @Inject(forwardRef(() => VentasService))
    private ventasService: VentasService,
  ) {}

  async create(createBoletaDto: CreateBoletaDto) {
    const venta = await this.ventasService.findOne(createBoletaDto.ventaId);

    // 2. Generar número de boleta (lógica de correlativo)
    const ultimaBoleta = await this.boletasRepository.findOne({
      order: { id: 'DESC' },
    });

    const numeroActual = ultimaBoleta
      ? parseInt(ultimaBoleta.numero.split('-')[1]) + 1
      : 1;

    const numeroBoleta = `BOL-${numeroActual.toString().padStart(6, '0')}`;

    // 3. Crear boleta
    const boleta = this.boletasRepository.create({
      numero: numeroBoleta,
      ventaId: createBoletaDto.ventaId,
      cliente: createBoletaDto.cliente || 'Consumidor Final',
      rut: createBoletaDto.rut,
      montoTotal: venta.total, // Usamos el total de la venta encontrada
    });

    return await this.boletasRepository.save(boleta);
  }

  async generarBoletaParaVenta(venta: Venta, cliente?: string, rut?: string) {
    // Generar número de boleta (misma lógica que ya tienes)
    // @ts-ignore
    const ultimasBoletas = await this.boletasRepository.find({
      order: { id: 'DESC' },
      take: 1, // Esto es el equivalente a LIMIT 1
    });

    const ultimaBoleta = ultimasBoletas[0];
    const numeroActual = ultimaBoleta
      ? parseInt(ultimaBoleta.numero.split('-')[1]) + 1
      : 1;

    const numeroBoleta = `BOL-${numeroActual.toString().padStart(6, '0')}`;

    // Crear boleta
    const boleta = this.boletasRepository.create({
      numero: numeroBoleta,
      ventaId: venta.id, // Usamos el ID de la Venta ya guardada
      cliente: cliente || 'Consumidor Final',
      rut: rut,
      montoTotal: venta.total, // Usamos el total de la Venta
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