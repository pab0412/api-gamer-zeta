import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { VentasService } from './ventas.service';
import { Venta } from './entities/venta.entity';
import { ProductosService } from '../productos/productos.service';
import { BoletasService } from '../boletas/boletas.service';

describe('VentasService', () => {
  let service: VentasService;

  const mockProducto = {
    id: 1,
    nombre: 'PS5',
    precio: 500000,
    stock: 10,
    categoria: 'Consolas',
    activo: true,
  };

  const mockVenta: Venta = {
    id: 1,
    usuarioId: 1,
    detalleProductos: [
      {
        productoId: 1,
        nombre: 'PS5',
        cantidad: 2,
        precioUnitario: 500000,
        subtotal: 1000000,
      },
    ],
    metodoPago: 'efectivo',
    subtotal: 1000000,
    iva: 190000,
    total: 1190000,
    estado: 'completada',
    fecha: new Date(),
    usuario: null,
    boleta: null,
  };

  const mockBoleta = {
    id: 1,
    numero: 'BOL-000001',
    ventaId: 1,
    cliente: 'Consumidor Final',
    rut: null,
    montoTotal: 1190000,
    fechaEmision: new Date(),
    venta: mockVenta,
  };

  const mockVentasRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  const mockProductosService = {
    findOne: jest.fn(),
    actualizarStock: jest.fn(),
  };

  const mockBoletasService = {
    generarBoletaParaVenta: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VentasService,
        {
          provide: getRepositoryToken(Venta),
          useValue: mockVentasRepository,
        },
        {
          provide: ProductosService,
          useValue: mockProductosService,
        },
        {
          provide: BoletasService,
          useValue: mockBoletasService,
        },
      ],
    }).compile();

    service = module.get<VentasService>(VentasService);
    productosService = module.get<ProductosService>(ProductosService);
    boletasService = module.get<BoletasService>(BoletasService);

    // Mock console.log para evitar logs en tests
    jest.spyOn(console, 'log').mockImplementation();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    const createVentaDto = {
      usuarioId: 1,
      metodoPago: 'efectivo' as const,
      detalleProductos: [
        {
          productoId: 1,
          cantidad: 2,
        },
      ],
      cliente: 'Juan Pérez',
      rut: '12345678-9',
    };

    it('debe crear una venta correctamente con cálculo de IVA', async () => {
      mockProductosService.findOne.mockResolvedValue(mockProducto);
      mockProductosService.actualizarStock.mockResolvedValue(mockProducto);
      mockVentasRepository.create.mockReturnValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(mockVenta);
      mockBoletasService.generarBoletaParaVenta.mockResolvedValue(mockBoleta);

      const result = await service.create(createVentaDto);

      expect(mockProductosService.findOne).toHaveBeenCalledWith(1);
      expect(mockProductosService.actualizarStock).toHaveBeenCalledWith(1, 2);
      expect(mockVentasRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          usuarioId: 1,
          metodoPago: 'efectivo',
          subtotal: 1000000,
          iva: 190000,
          total: 1190000,
          estado: 'completada',
        }),
      );
      expect(mockBoletasService.generarBoletaParaVenta).toHaveBeenCalledWith(
        mockVenta,
        'Juan Pérez',
        '12345678-9',
      );
      expect(result).toMatchObject({
        id: 1,
        boleta: mockBoleta,
      });
    });

    it('debe calcular correctamente el detalle de productos', async () => {
      mockProductosService.findOne.mockResolvedValue(mockProducto);
      mockProductosService.actualizarStock.mockResolvedValue(mockProducto);
      mockVentasRepository.create.mockReturnValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(mockVenta);
      mockBoletasService.generarBoletaParaVenta.mockResolvedValue(mockBoleta);

      await service.create(createVentaDto);

      expect(mockVentasRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          detalleProductos: [
            {
              productoId: 1,
              nombre: 'PS5',
              cantidad: 2,
              precioUnitario: 500000,
              subtotal: 1000000,
            },
          ],
        }),
      );
    });

    it('debe lanzar BadRequestException si no hay stock suficiente', async () => {
      const productoSinStock = { ...mockProducto, stock: 1 };
      mockProductosService.findOne.mockResolvedValue(productoSinStock);

      await expect(service.create(createVentaDto)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.create(createVentaDto)).rejects.toThrow(
        'Stock insuficiente para PS5. Disponible: 1',
      );
      expect(mockVentasRepository.save).not.toHaveBeenCalled();
    });

    it('debe actualizar el stock de los productos', async () => {
      mockProductosService.findOne.mockResolvedValue(mockProducto);
      mockProductosService.actualizarStock.mockResolvedValue(mockProducto);
      mockVentasRepository.create.mockReturnValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(mockVenta);
      mockBoletasService.generarBoletaParaVenta.mockResolvedValue(mockBoleta);

      await service.create(createVentaDto);

      expect(mockProductosService.actualizarStock).toHaveBeenCalledWith(1, 2);
    });

    it('debe manejar múltiples productos en una venta', async () => {
      const createDtoMultiple = {
        ...createVentaDto,
        detalleProductos: [
          { productoId: 1, cantidad: 1 },
          { productoId: 2, cantidad: 2 },
        ],
      };

      const producto2 = { ...mockProducto, id: 2, nombre: 'Xbox', precio: 400000 };

      mockProductosService.findOne
        .mockResolvedValueOnce(mockProducto)
        .mockResolvedValueOnce(producto2);
      mockProductosService.actualizarStock.mockResolvedValue({});
      mockVentasRepository.create.mockReturnValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(mockVenta);
      mockBoletasService.generarBoletaParaVenta.mockResolvedValue(mockBoleta);

      await service.create(createDtoMultiple);

      expect(mockProductosService.findOne).toHaveBeenCalledTimes(2);
      expect(mockProductosService.actualizarStock).toHaveBeenCalledTimes(2);
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las ventas ordenadas por fecha descendente', async () => {
      const ventas = [mockVenta];
      mockVentasRepository.find.mockResolvedValue(ventas);

      const result = await service.findAll();

      expect(mockVentasRepository.find).toHaveBeenCalledWith({
        relations: ['usuario', 'boleta'],
        order: { fecha: 'DESC' },
      });
      expect(result).toEqual(ventas);
    });
  });

  describe('findOne', () => {
    it('debe retornar una venta por ID con relaciones', async () => {
      mockVentasRepository.findOne.mockResolvedValue(mockVenta);

      const result = await service.findOne(1);

      expect(mockVentasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['usuario', 'boleta'],
      });
      expect(result).toEqual(mockVenta);
    });

    it('debe lanzar NotFoundException si la venta no existe', async () => {
      mockVentasRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Venta con ID 999 no encontrada',
      );
    });
  });

  describe('findByUsuario', () => {
    it('debe retornar ventas de un usuario específico', async () => {
      const ventas = [mockVenta];
      mockVentasRepository.find.mockResolvedValue(ventas);

      const result = await service.findByUsuario(1);

      expect(mockVentasRepository.find).toHaveBeenCalledWith({
        where: { usuarioId: 1 },
        relations: ['boleta'],
        order: { fecha: 'DESC' },
      });
      expect(result).toEqual(ventas);
    });
  });

  describe('update', () => {
    it('debe actualizar el estado de una venta', async () => {
      const updateDto = { estado: 'anulada' as const };
      const ventaActualizada = { ...mockVenta, estado: 'anulada' };

      mockVentasRepository.findOne.mockResolvedValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(ventaActualizada);

      const result = await service.update(1, updateDto);

      expect(mockVentasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['usuario', 'boleta'],
      });
      expect(mockVentasRepository.save).toHaveBeenCalled();
      expect(result.estado).toBe('anulada');
    });

    it('debe lanzar NotFoundException si la venta no existe', async () => {
      mockVentasRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { estado: 'anulada' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findVentasDiarias', () => {
    it('debe retornar ventas del día actual', async () => {
      const ventas = [mockVenta];
      mockVentasRepository.find.mockResolvedValue(ventas);

      const result = await service.findVentasDiarias();

      expect(mockVentasRepository.find).toHaveBeenCalledWith(
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

    it('debe usar Between para filtrar fechas del día', async () => {
      mockVentasRepository.find.mockResolvedValue([]);

      await service.findVentasDiarias();

      const callArgs = mockVentasRepository.find.mock.calls[0][0];
      expect(callArgs.where.fecha).toBeDefined();
    });
  });

  describe('remove', () => {
    it('debe anular una venta (soft delete)', async () => {
      const ventaAnulada = { ...mockVenta, estado: 'anulada' };
      mockVentasRepository.findOne.mockResolvedValue(mockVenta);
      mockVentasRepository.save.mockResolvedValue(ventaAnulada);

      const result = await service.remove(1);

      expect(mockVentasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['usuario', 'boleta'],
      });
      expect(mockVentasRepository.save).toHaveBeenCalled();
      expect(result.estado).toBe('anulada');
    });

    it('debe lanzar NotFoundException si la venta no existe', async () => {
      mockVentasRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});