export class CreateVentaDto {
  usuarioId: number;

  detalleProductos: Array<{
    productoId: number;
    cantidad: number;
  }>;

  metodoPago?: string;

  // Datos para la boleta
  cliente?: string;
  rut?: string;
}