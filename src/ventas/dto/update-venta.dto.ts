// ventas/dto/update-venta.dto.ts (Revisa y confirma)

import { IsEnum, IsOptional } from 'class-validator';

// Define tus estados permitidos
export enum VentaEstado {
  COMPLETADA = 'completada',
  ANULADA = 'anulada',
  PENDIENTE = 'pendiente',
}

export class UpdateVentaDto {
  @IsEnum(VentaEstado)
  @IsOptional() // Permite que no se envíe el campo si no se desea actualizar
  estado?: VentaEstado;
}