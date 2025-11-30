// dto/create-venta.dto.ts (Revisa y confirma)

import { IsInt, IsNotEmpty, IsString, IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

// DTO para un solo detalle de producto (si lo tienes separado)
export class DetalleProductoDto {
  @IsInt()
  @IsNotEmpty()
  productoId: number;

  @IsInt()
  @IsNotEmpty()
  cantidad: number;
}

export class CreateVentaDto {
  @IsInt()
  @IsNotEmpty()
  usuarioId: number; // Debe ser un número entero y no vacío

  @IsString()
  @IsNotEmpty()
  metodoPago: string; // Debe ser una cadena y no vacío

  @IsArray()
  @ArrayMinSize(1) // Debe tener al menos un producto
  @ValidateNested({ each: true })
  @Type(() => DetalleProductoDto) // Necesario para validar objetos anidados
  detalleProductos: DetalleProductoDto[];
}