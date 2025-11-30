import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { BoletasService } from './boletas.service';
import { Boleta } from './entities/boleta.entity';
import VentasService from '../ventas/ventas.service';

describe('BoletasService', () => {
  let service: BoletasService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<Boleta>;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let ventasService: VentasService;

  const mockBoletaRepository = {
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
    remove: jest.fn(),
  };

  const mockVentasService = {
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BoletasService,
        {
          provide: getRepositoryToken(Boleta),
          useValue: mockBoletaRepository,
        },
        {
          provide: VentasService,
          useValue: mockVentasService,
        },
      ],
    }).compile();

    service = module.get<BoletasService>(BoletasService);
    repository = module.get<Repository<Boleta>>(getRepositoryToken(Boleta));
    ventasService = module.get<VentasService>(VentasService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('debe crear una boleta correctamente', async () => {
      const createDto = { ventaId: 1, cliente: 'Juan Pérez', rut: '12345678-9' };
      const venta = { id: 1, total: 50000 };
      const ultimaBoleta = { numero: 'BOL-000005' };
      const nuevaBoleta = { id: 1, numero: 'BOL-000006', ...createDto };

      mockVentasService.findOne.mockResolvedValue(venta);
      mockBoletaRepository.findOne.mockResolvedValue(ultimaBoleta);
      mockBoletaRepository.create.mockReturnValue(nuevaBoleta);
      mockBoletaRepository.save.mockResolvedValue(nuevaBoleta);

      const result = await service.create(createDto);

      expect(mockVentasService.findOne).toHaveBeenCalledWith(1);
      expect(mockBoletaRepository.create).toHaveBeenCalledWith({
        numero: 'BOL-000006',
        ventaId: 1,
        cliente: 'Juan Pérez',
        rut: '12345678-9',
        montoTotal: 50000,
      });
      expect(result).toEqual(nuevaBoleta);
    });

    it('debe usar "Consumidor Final" si no se proporciona cliente', async () => {
      const createDto = { ventaId: 1 };
      const venta = { id: 1, total: 30000 };

      mockVentasService.findOne.mockResolvedValue(venta);
      mockBoletaRepository.findOne.mockResolvedValue(null);
      mockBoletaRepository.create.mockReturnValue({});
      mockBoletaRepository.save.mockResolvedValue({});

      await service.create(createDto);

      expect(mockBoletaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          cliente: 'Consumidor Final',
        }),
      );
    });

    it('debe generar BOL-000001 si no hay boletas previas', async () => {
      const createDto = { ventaId: 1 };
      const venta = { id: 1, total: 20000 };

      mockVentasService.findOne.mockResolvedValue(venta);
      mockBoletaRepository.findOne.mockResolvedValue(null);
      mockBoletaRepository.create.mockReturnValue({});
      mockBoletaRepository.save.mockResolvedValue({});

      await service.create(createDto);

      expect(mockBoletaRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          numero: 'BOL-000001',
        }),
      );
    });
  });

  describe('findAll', () => {
    it('debe retornar todas las boletas ordenadas por fecha', async () => {
      const boletas = [
        { id: 1, numero: 'BOL-000001' },
        { id: 2, numero: 'BOL-000002' },
      ];
      mockBoletaRepository.find.mockResolvedValue(boletas);

      const result = await service.findAll();

      expect(mockBoletaRepository.find).toHaveBeenCalledWith({
        relations: ['venta'],
        order: { fechaEmision: 'DESC' },
      });
      expect(result).toEqual(boletas);
    });
  });

  describe('findOne', () => {
    it('debe retornar una boleta por ID', async () => {
      const boleta = { id: 1, numero: 'BOL-000001' };
      mockBoletaRepository.findOne.mockResolvedValue(boleta);

      const result = await service.findOne(1);

      expect(mockBoletaRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
        relations: ['venta', 'venta.usuario'],
      });
      expect(result).toEqual(boleta);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockBoletaRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Boleta con ID 999 no encontrada',
      );
    });
  });

  describe('findByNumero', () => {
    it('debe retornar una boleta por número', async () => {
      const boleta = { id: 1, numero: 'BOL-000001' };
      mockBoletaRepository.findOne.mockResolvedValue(boleta);

      const result = await service.findByNumero('BOL-000001');

      expect(result).toEqual(boleta);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockBoletaRepository.findOne.mockResolvedValue(null);

      await expect(service.findByNumero('BOL-999999')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('findByVenta', () => {
    it('debe retornar boleta asociada a una venta', async () => {
      const boleta = { id: 1, ventaId: 1 };
      mockBoletaRepository.findOne.mockResolvedValue(boleta);

      const result = await service.findByVenta(1);

      expect(mockBoletaRepository.findOne).toHaveBeenCalledWith({
        where: { ventaId: 1 },
        relations: ['venta'],
      });
      expect(result).toEqual(boleta);
    });
  });

  describe('update', () => {
    it('debe actualizar una boleta', async () => {
      const boletaExistente = { id: 1, cliente: 'Juan' };
      const updateDto = { cliente: 'Pedro' };
      const boletaActualizada = { id: 1, cliente: 'Pedro' };

      mockBoletaRepository.findOne.mockResolvedValue(boletaExistente);
      mockBoletaRepository.save.mockResolvedValue(boletaActualizada);

      const result = await service.update(1, updateDto);

      expect(result).toEqual(boletaActualizada);
    });
  });

  describe('remove', () => {
    it('debe eliminar una boleta', async () => {
      const boleta = { id: 1, numero: 'BOL-000001' };
      mockBoletaRepository.findOne.mockResolvedValue(boleta);
      mockBoletaRepository.remove.mockResolvedValue(boleta);

      const result = await service.remove(1);

      expect(mockBoletaRepository.remove).toHaveBeenCalledWith(boleta);
      expect(result).toEqual(boleta);
    });
  });
});