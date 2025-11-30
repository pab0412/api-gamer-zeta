import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotFoundException } from '@nestjs/common';
import { ProductosService } from './productos.service';
import { Producto } from './entities/producto.entity';

describe('ProductosService', () => {
  let service: ProductosService;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  let repository: Repository<Producto>;

  const mockProductoRepository = {
    count: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    find: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductosService,
        {
          provide: getRepositoryToken(Producto),
          useValue: mockProductoRepository,
        },
      ],
    }).compile();

    service = module.get<ProductosService>(ProductosService);
    repository = module.get<Repository<Producto>>(getRepositoryToken(Producto));
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('debe cargar productos si la base de datos está vacía', async () => {
      mockProductoRepository.count.mockResolvedValue(0);
      mockProductoRepository.create.mockReturnValue({ id: 1, nombre: 'Test' });
      mockProductoRepository.save.mockResolvedValue({ id: 1, nombre: 'Test' });

      await service.onModuleInit();

      expect(mockProductoRepository.count).toHaveBeenCalledTimes(1);
      expect(mockProductoRepository.create).toHaveBeenCalled();
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });

    it('no debe cargar productos si ya existen datos', async () => {
      mockProductoRepository.count.mockResolvedValue(5);

      await service.onModuleInit();

      expect(mockProductoRepository.count).toHaveBeenCalledTimes(1);
      expect(mockProductoRepository.create).not.toHaveBeenCalled();
      expect(mockProductoRepository.save).not.toHaveBeenCalled();
    });
  });

  describe('create', () => {
    it('debe crear un producto correctamente', async () => {
      const createDto = {
        nombre: 'PS5',
        precio: 500000,
        stock: 10,
        categoria: 'Consolas',
      };
      const producto = { id: 1, ...createDto, activo: true };

      mockProductoRepository.create.mockReturnValue(producto);
      mockProductoRepository.save.mockResolvedValue(producto);

      const result = await service.create(createDto);

      expect(mockProductoRepository.create).toHaveBeenCalledWith({
        ...createDto,
        activo: true,
      });
      expect(mockProductoRepository.save).toHaveBeenCalledWith(producto);
      expect(result).toEqual(producto);
      expect(result.activo).toBe(true);
    });
  });

  describe('findAll', () => {
    it('debe retornar todos los productos ordenados', async () => {
      const productos = [
        { id: 1, nombre: 'PS5', activo: true },
        { id: 2, nombre: 'Xbox', activo: true },
      ];

      mockProductoRepository.find.mockResolvedValue(productos);

      const result = await service.findAll();

      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        order: { nombre: 'ASC' },
      });
      expect(result).toEqual(productos);
    });
  });

  describe('findOne', () => {
    it('debe retornar un producto por ID', async () => {
      const producto = { id: 1, nombre: 'PS5' };
      mockProductoRepository.findOne.mockResolvedValue(producto);

      const result = await service.findOne(1);

      expect(mockProductoRepository.findOne).toHaveBeenCalledWith({
        where: { id: 1 },
      });
      expect(result).toEqual(producto);
    });

    it('debe lanzar NotFoundException si no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
      await expect(service.findOne(999)).rejects.toThrow(
        'Producto con ID 999 no encontrado',
      );
    });
  });

  describe('findByCategoria', () => {
    it('debe retornar productos por categoría', async () => {
      const productos = [
        { id: 1, nombre: 'PS5', categoria: 'Consolas' },
        { id: 2, nombre: 'Xbox', categoria: 'Consolas' },
      ];

      mockProductoRepository.find.mockResolvedValue(productos);

      const result = await service.findByCategoria('Consolas');

      expect(mockProductoRepository.find).toHaveBeenCalledWith({
        where: { categoria: 'Consolas', activo: true },
      });
      expect(result).toEqual(productos);
    });
  });

  describe('update', () => {
    it('debe actualizar un producto', async () => {
      const productoExistente = { id: 1, nombre: 'PS5', precio: 500000 };
      const updateDto = { precio: 450000 };
      const productoActualizado = { ...productoExistente, ...updateDto };

      mockProductoRepository.findOne.mockResolvedValue(productoExistente);
      mockProductoRepository.save.mockResolvedValue(productoActualizado);

      const result = await service.update(1, updateDto);

      expect(result.precio).toBe(450000);
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar NotFoundException si el producto no existe', async () => {
      mockProductoRepository.findOne.mockResolvedValue(null);

      await expect(service.update(999, { precio: 100 })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('debe desactivar un producto (soft delete)', async () => {
      const producto = { id: 1, nombre: 'PS5', activo: true };
      const productoDesactivado = { ...producto, activo: false };

      mockProductoRepository.findOne.mockResolvedValue(producto);
      mockProductoRepository.save.mockResolvedValue(productoDesactivado);

      const result = await service.remove(1);

      expect(result.activo).toBe(false);
      expect(mockProductoRepository.save).toHaveBeenCalledWith(
        expect.objectContaining({ activo: false }),
      );
    });
  });

  describe('actualizarStock', () => {
    it('debe reducir el stock correctamente', async () => {
      const producto = { id: 1, nombre: 'PS5', stock: 10 };
      const productoActualizado = { ...producto, stock: 7 };

      mockProductoRepository.findOne.mockResolvedValue(producto);
      mockProductoRepository.save.mockResolvedValue(productoActualizado);

      const result = await service.actualizarStock(1, 3);

      expect(result.stock).toBe(7);
      expect(mockProductoRepository.save).toHaveBeenCalled();
    });

    it('debe lanzar error si el stock es insuficiente', async () => {
      const producto = { id: 1, nombre: 'PS5', stock: 2 };

      mockProductoRepository.findOne.mockResolvedValue(producto);

      await expect(service.actualizarStock(1, 5)).rejects.toThrow(
        'Stock insuficiente para PS5',
      );
    });
  });
});