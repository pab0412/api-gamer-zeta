import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { Venta } from './entities/venta.entity';
import { ProductosService } from '../productos/productos.service';

describe('VentasService', () => {
  let service: VentasService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<Venta>;
  let productosService: ProductosService;

  const mockVentaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductosService = {
    findOne: jest.fn(),
    actualizarStock: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        {
          provide: getRepositoryToken(Venta),
          useValue: mockVentaRepository,
        },
        {
          provide: ProductosService,
          useValue: mockProductosService,
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
    repository = module.get<Repository<Venta>>(getRepositoryToken(Venta));
    productosService = module.get<ProductosService>(ProductosService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear una venta correctamente con cálculo de IVA', async () => {
      const createDto = {
        usuarioId: 1,
        detalleProductos: [
          { productoId: 1, cantidad: 2 },
          { productoId: 2, cantidad: 1 },
        ],
        metodoPago: 'efectivo',
      };

      const productos = [
        { id: 1, nombre: 'PS5', precio: 100000, stock: 10 },
        { id: 2, nombre: 'Xbox', precio: 50000, stock: 5 },
      ];

      mockProductosService.findOne
        .mockResolvedValueOnce(productos[0])
        .mockResolvedValueOnce(productos[1]);
      mockProductosService.actualizarStock.mockResolvedValue({});

      const ventaCreada = {
        id: 1,
        subtotal: 250000,
        iva: 47500,
        total: 297500,
        estado: 'completada',
      };

      mockVentaRepository.create.mockReturnValue(ventaCreada);
      mockVentaRepository.save.mockResolvedValue(ventaCreada);

      const result = await service.create(createDto);

      expect(mockProductosService.findOne).toHaveBeenCalledTimes(2);
      expect(mockProductosService.actualizarStock).toHaveBeenCalledWith(1, 2);
      expect(mockProductosService.actualizarStock).toHaveBeenCalledWith(2, 1);
      expect(mockVentaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          subtotal: 250000,
          iva: 47500,
          total: 297500,
          estado: 'completada',
        }),
      );
      expect(result).toEqual(ventaCreada);
    });

    it('debe lanzar BadRequestException si el stock es insuficiente', async () => {
      const createDto = {
        usuarioId: 1,
        detalleProductos: [{ productoId: 1, cantidad: 20 }],
        metodoPago: 'efectivo',
      };

      const producto = { id: 1, nombre: 'PS5', precio: 100000, stock: 5 };

      mockProductosService.findOne.mockResolvedValue(producto);

      await expect(service.create(createDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createDto)).rejects.toThrow(
        'Stock insuficiente para PS5. Disponible: 5',
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las ventas ordenadas por fecha', async () => {
      const ventas = [
        { id: 1, total: 100000 },
        { id: 2, total: 200000 },
      ];

      mockVentaRepository.find.mockResolvedValue(ventas);

      const result = await service.findAll();

      expect(mockVentaRepository.find).toHaveBeenCalledWith({
        relations: ['usuario', 'boleta'],
        order: { fecha: 'DESC' },
      });
      expect(result).toEqual(ventas);
    });
  });

  describe('findOne', () => {
    it('debe retornar una venta por ID', async () => {
      const venta = { id: 1, total: 100000 };
      mockVentaRepository.findOne.mockResolvedValue(venta);

      const result = await service.findOne(1);

      expect(mockVentaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['usuario', 'boleta'],
      });
      expect(result).toEqual(venta);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockVentaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Venta con ID 999 no encontrada',
      );
    });
  });

  describe('findByUsuario', () => {
    it('debe retornar ventas de un usuario específico', async () => {
      const ventas = [
        { id: 1, usuarioId: 1, total: 100000 },
        { id: 2, usuarioId: 1, total: 200000 },
      ];

      mockVentaRepository.find.mockResolvedValue(ventas);

      const result = await service.findByUsuario(1);

      expect(mockVentaRepository.find).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        relations: ['boleta'],
        order: { fecha: 'DESC' },
      });
      expect(result).toEqual(ventas);
    });
  });

  describe('update', () => {
    it('debe actualizar el estado de una venta', async () => {
      const ventaExistente = { id: 1, estado: 'completada' };
      const updateDto = { estado: 'anulada' };
      const ventaActualizada = { ...ventaExistente, estado: 'anulada' };

      mockVentaRepository.findOne.mockResolvedValue(ventaExistente);
      mockVentaRepository.save.mockResolvedValue(ventaActualizada);

      const result = await service.update(1, updateDto);

      expect(result.estado).toBe('anulada');
      expect(mockVentaRepository.save).toHaveBeenCalled();
    });
  });

  describe('findVentasDiarias', () => {
    it('debe retornar ventas del día actual', async () => {
      const ventas = [
        { id: 1, fecha: new Date(), estado: 'completada' },
        { id: 2, fecha: new Date(), estado: 'completada' },
      ];

      mockVentaRepository.find.mockResolvedValue(ventas);

      const result = await service.findVentasDiarias();

      expect(mockVentaRepository.find).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            estado: 'completada',
          }),
          relations: ['usuario', 'boleta'],
          order: { fecha: 'DESC' },
        }),
      );
      expect(result).toEqual(ventas);
    });
  });

  describe('remove', () => {
    it('debe anular una venta (soft delete)', async () => {
      const venta = { id: 1, estado: 'completada' };
      const ventaAnulada = { ...venta, estado: 'anulada' };

      mockVentaRepository.findOne.mockResolvedValue(venta);
      mockVentaRepository.save.mockResolvedValue(ventaAnulada);

      const result = await service.remove(1);

      expect(result.estado).toBe('anulada');
      expect(mockVentaRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ estado: 'anulada' }),
      );
    });
  });
});