import { IsString, IsNumber, IsOptional, Min, IsNotEmpty } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductoDto {
  @ApiProperty({ example: 'PlayStation 5' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre es requerido' })
  nombre: string;

  @ApiProperty({ example: 'Consola de última generación', required: false })
  @IsString()
  @IsOptional()
  descripcion?: string;

  @ApiProperty({ example: 599990 })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  @Type(() => Number)
  precio: number;

  @ApiProperty({ example: 10 })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  @Type(() => Number)
  stock: number;

  @ApiProperty({ example: 'Consolas', required: false })
  @IsString()
  @IsOptional()
  categoria?: string;

  @ApiProperty({ example: 'url-imagen.jpg', required: false })
  @IsString()
  @IsOptional()
  imagen?: string;
}
