import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BoletasService } from './boletas.service';
import { Boleta } from './entities/boleta.entity';
import { VentasService } from '../ventas/ventas.service';
import { Venta } from '../ventas/entities/venta.entity';

describe('BoletasService', () => {
  let service: BoletasService;
  let boletasRepository: Repository<Boleta>;
  let ventasService: VentasService;

  const mockBoletasRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockVentasService = {
    findOne: jest.fn(),
  };

  const mockVenta: Venta = {
    id: 1,
    total: 150000,
    fecha: new Date(),
    metodoPago: 'efectivo',
    usuarioId: 1,
    usuario: null,
    items: [],
    boleta: null,
  };

  const mockBoleta: Boleta = {
    id: 1,
    numero: 'BOL-000001',
    ventaId: 1,
    cliente: 'Consumidor Final',
    rut: null,
    montoTotal: 150000,
    fechaEmision: new Date(),
    venta: mockVenta,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoletasService,
        {
          provide: getRepositoryToken(Boleta),
          useValue: mockBoletasRepository,
        },
        {
          provide: VentasService,
          useValue: mockVentasService,
        },
      ],
    }).compile();

    service = module.get<BoletasService>(BoletasService);
    boletasRepository = module.get<Repository<Boleta>>(
      getRepositoryToken(Boleta),
    );
    ventasService = module.get<VentasService>(VentasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('debe crear una boleta con número correlativo cuando no hay boletas previas', async () => {
      const createDto = {
        ventaId: 1,
        cliente: 'Juan Pérez',
        rut: '12345678-9',
      };

      mockVentasService.findOne.mockResolvedValue(mockVenta);
      mockBoletasRepository.findOne.mockResolvedValue(null);
      mockBoletasRepository.create.mockReturnValue(mockBoleta);
      mockBoletasRepository.save.mockResolvedValue(mockBoleta);

      const result = await service.create(createDto);

      expect(mockVentasService.findOne).toHaveBeenCalledWith(1);
      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        order: { id: 'DESC' },
      });
      expect(mockBoletasRepository.create).toHaveBeenCalledWith({
        numero: 'BOL-000001',
        ventaId: 1,
        cliente: 'Juan Pérez',
        rut: '12345678-9',
        montoTotal: 150000,
      });
      expect(result).toEqual(mockBoleta);
    });

    it('debe crear una boleta incrementando el número correlativo', async () => {
      const createDto = {
        ventaId: 1,
      };

      const boletaAnterior = { ...mockBoleta, numero: 'BOL-000005' };
      const nuevaBoleta = { ...mockBoleta, numero: 'BOL-000006' };

      mockVentasService.findOne.mockResolvedValue(mockVenta);
      mockBoletasRepository.findOne.mockResolvedValue(boletaAnterior);
      mockBoletasRepository.create.mockReturnValue(nuevaBoleta);
      mockBoletasRepository.save.mockResolvedValue(nuevaBoleta);

      const result = await service.create(createDto);

      expect(mockBoletasRepository.create).toHaveBeenCalledWith({
        numero: 'BOL-000006',
        ventaId: 1,
        cliente: 'Consumidor Final',
        rut: undefined,
        montoTotal: 150000,
      });
      expect(result.numero).toBe('BOL-000006');
    });

    it('debe usar "Consumidor Final" si no se proporciona cliente', async () => {
      const createDto = { ventaId: 1 };

      mockVentasService.findOne.mockResolvedValue(mockVenta);
      mockBoletasRepository.findOne.mockResolvedValue(null);
      mockBoletasRepository.create.mockReturnValue(mockBoleta);
      mockBoletasRepository.save.mockResolvedValue(mockBoleta);

      await service.create(createDto);

      expect(mockBoletasRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: 'Consumidor Final',
        }),
      );
    });
  });

  describe('generarBoletaParaVenta', () => {
    it('debe generar una boleta para una venta existente', async () => {
      mockBoletasRepository.find.mockResolvedValue([]);
      mockBoletasRepository.create.mockReturnValue(mockBoleta);
      mockBoletasRepository.save.mockResolvedValue(mockBoleta);

      const result = await service.generarBoletaParaVenta(
        mockVenta,
        'María López',
        '98765432-1',
      );

      expect(mockBoletasRepository.find).toHaveBeenCalledWith({
        order: { id: 'DESC' },
        take: 1,
      });
      expect(mockBoletasRepository.create).toHaveBeenCalledWith({
        numero: 'BOL-000001',
        ventaId: 1,
        cliente: 'María López',
        rut: '98765432-1',
        montoTotal: 150000,
      });
      expect(result).toEqual(mockBoleta);
    });

    it('debe incrementar correctamente el número de boleta', async () => {
      const boletaAnterior = { ...mockBoleta, numero: 'BOL-000099' };
      const nuevaBoleta = { ...mockBoleta, numero: 'BOL-000100' };

      mockBoletasRepository.find.mockResolvedValue([boletaAnterior]);
      mockBoletasRepository.create.mockReturnValue(nuevaBoleta);
      mockBoletasRepository.save.mockResolvedValue(nuevaBoleta);

      const result = await service.generarBoletaParaVenta(mockVenta);

      expect(mockBoletasRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          numero: 'BOL-000100',
        }),
      );
      expect(result.numero).toBe('BOL-000100');
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las boletas ordenadas por fecha descendente', async () => {
      const boletas = [mockBoleta];
      mockBoletasRepository.find.mockResolvedValue(boletas);

      const result = await service.findAll();

      expect(mockBoletasRepository.find).toHaveBeenCalledWith({
        relations: ['venta'],
        order: { fechaEmision: 'DESC' },
      });
      expect(result).toEqual(boletas);
    });
  });

  describe('findOne', () => {
    it('debe retornar una boleta por ID con sus relaciones', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(mockBoleta);

      const result = await service.findOne(1);

      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['venta', 'venta.usuario'],
      });
      expect(result).toEqual(mockBoleta);
    });

    it('debe lanzar NotFoundException si la boleta no existe', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Boleta con ID 999 no encontrada',
      );
    });
  });

  describe('findByNumero', () => {
    it('debe retornar una boleta por su número', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(mockBoleta);

      const result = await service.findByNumero('BOL-000001');

      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        where: { numero: 'BOL-000001' },
        relations: ['venta', 'venta.usuario'],
      });
      expect(result).toEqual(mockBoleta);
    });

    it('debe lanzar NotFoundException si el número no existe', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(null);

      await expect(service.findByNumero('BOL-999999')).rejects.toThrow(
        NotFoundException,
      );
      await expect(service.findByNumero('BOL-999999')).rejects.toThrow(
        'Boleta BOL-999999 no encontrada',
      );
    });
  });

  describe('findByVenta', () => {
    it('debe retornar una boleta por ID de venta', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(mockBoleta);

      const result = await service.findByVenta(1);

      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        where: { ventaId: 1 },
        relations: ['venta'],
      });
      expect(result).toEqual(mockBoleta);
    });

    it('debe retornar null si no existe boleta para esa venta', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(null);

      const result = await service.findByVenta(999);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('debe actualizar una boleta existente', async () => {
      const updateDto = {
        cliente: 'Pedro González',
        rut: '11111111-1',
      };
      const boletaActualizada = { ...mockBoleta, ...updateDto };

      mockBoletasRepository.findOne.mockResolvedValue(mockBoleta);
      mockBoletasRepository.save.mockResolvedValue(boletaActualizada);

      const result = await service.update(1, updateDto);

      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['venta', 'venta.usuario'],
      });
      expect(mockBoletasRepository.save).toHaveBeenCalled();
      expect(result.cliente).toBe('Pedro González');
    });

    it('debe lanzar NotFoundException si la boleta no existe', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { cliente: 'Test' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe eliminar una boleta existente', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(mockBoleta);
      mockBoletasRepository.remove.mockResolvedValue(mockBoleta);

      const result = await service.remove(1);

      expect(mockBoletasRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['venta', 'venta.usuario'],
      });
      expect(mockBoletasRepository.remove).toHaveBeenCalledWith(mockBoleta);
      expect(result).toEqual(mockBoleta);
    });

    it('debe lanzar NotFoundException si la boleta no existe', async () => {
      mockBoletasRepository.findOne.mockResolvedValue(null);

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});