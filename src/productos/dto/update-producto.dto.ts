import { PartialType } from '@nestjs/swagger';
import { CreateProductoDto } from './create-producto.dto';
import { IsBoolean, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateProductoDto extends PartialType(CreateProductoDto) {
  @ApiProperty({ example: true, required: false })
  @IsBoolean({ message: 'El campo activo debe ser booleano' })
  @IsOptional()
  @Type(() => Boolean)
  activo?: boolean;
}